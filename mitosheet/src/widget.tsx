// Copyright (c) Mito

import {
    DOMWidgetModel,
    DOMWidgetView,
    ISerializers,
    WidgetView,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

// React
import React from 'react';
import ReactDOM from 'react-dom';

// Components
import Mito from './components/Mito';


export class ExampleModel extends DOMWidgetModel {

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    defaults() {
        return {
            ...super.defaults(),
            _model_name: ExampleModel.model_name,
            _model_module: ExampleModel.model_module,
            _model_module_version: ExampleModel.model_module_version,
            _view_name: ExampleModel.view_name,
            _view_module: ExampleModel.view_module,
            _view_module_version: ExampleModel.view_module_version,
            df_json: '',
        };
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
    // Add any extra serializers here
    };

    static model_name = 'ExampleModel';
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
    static view_name = 'ExampleView'; // Set to null if no view
    static view_module = MODULE_NAME; // Set to null if no view
    static view_module_version = MODULE_VERSION;
}

// We save a Mito component in the global scope, so we
// can set the state from outside the react component
declare global {
    interface Window { 
        setMitoStateMap:  Map<string, MitoStateUpdaters> | undefined;
        mitoAPIMap:  Map<string, MitoAPI> | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        commands: any;
        user_id: string;
    }
}

import MitoAPI from './api';
import { AnalysisData, MitoError, MitoStateUpdaters, SheetData, UserProfile } from './types';
import { ModalEnum } from './components/modals/modals';

export class ExampleView extends DOMWidgetView {
    // Used to make code in the notebook not flash when read in for replaying.
    // See write-code-to-cell below.
    creationSeconds: undefined | number;

    initialize(parameters: WidgetView.InitializeParameters): void {
        super.initialize(parameters);

        // Bind the functions we pass down to other classes
        this.send = this.send.bind(this);
        this.updateSheetAndCode = this.updateSheetAndCode.bind(this);
        this.setErrorModal = this.setErrorModal.bind(this);
        this.creationSeconds = new Date().getSeconds(); 
    }

    /* 
        We override the sending message utilities, just to make sure that
        this is captured properly
    */
    send(msg: Record<string, unknown>): void{
        super.send(msg);
    }

    render(): void {

        const model_id = this.model.model_id;
        const mitoAPI = new MitoAPI(model_id, this.send, this.updateSheetAndCode, this.setErrorModal);

        // Store the API in a global map so we can receive messages on it
        if (window.mitoAPIMap === undefined) {
            window.mitoAPIMap = new Map();
        }
        window.mitoAPIMap.set(model_id, mitoAPI);

        // Get the initial sheet data, analysis data, and user profile
        const sheetDataArray = this.getSheetDataArray();
        const analysisData = this.getAnalysisData();
        const userProfile = this.getUserProfile();

        ReactDOM.render(
            <Mito 
                model_id={model_id}
                mitoAPI={mitoAPI}
                sheetDataArray={sheetDataArray}
                analysisData={analysisData}
                userProfile={userProfile}
            />,
            this.el
        )
        
        this.model.on('msg:custom', this.handleMessage, this);
    }

    /* 
        This is the function actually responsible for updating the Mito component
        with the new state, and is called by the MitoAPI when it receives a successful
        response from the backend! 

        If you are adding a new shared variable, you want to add it's updating here
        if you want it to update on success.
    */
    updateSheetAndCode(): void {
        const model_id = this.model.model_id;
        const stateUpdaters = window.setMitoStateMap?.get(model_id);

        if (stateUpdaters === undefined) {
            return;
        }

        const sheetDataArray = this.getSheetDataArray();
        const analysisData = this.getAnalysisData();
        const userProfile = this.getUserProfile();
        // TODO: set analysis data, update user profile
        stateUpdaters.setSheetDataArray(sheetDataArray);
        stateUpdaters.setAnalysisData(analysisData);
        stateUpdaters.setUserProfile(userProfile);

        window.commands?.execute('write-code-to-cell', {
            analysisName: analysisData.analysisName,
            code: analysisData.code,
            /* 
                If there is an analysis that is read in and takes a bit to replay, then the code
                disappears for a little bit, which is pretty disorienting. As such, if we're writing
                empty code, and we're within the first 60 seconds of creating the sheet, then we do 
                not actually clear the cell if there is something there. This stops an anlaysis that
                is read in from flashing
            */
            overwriteIfCodeEmpty: this.creationSeconds !== undefined ? (this.creationSeconds < (new Date().getSeconds() - 60)) : true
        });
    }

    /* 
        Sets the current error modal on the Mito instance, which is useful
        (for now) when the frontend recieves a response that means an 
        operation failed.

        This function should die once we start handling errors in place.
    */
    setErrorModal(error: MitoError): void {
        const model_id = this.model.model_id;
        const stateUpdaters = window.setMitoStateMap?.get(model_id);
        stateUpdaters?.setUIState((prevUIState => {
            return {
                ...prevUIState,
                currOpenModal: {
                    type: ModalEnum.Error,
                    error: error
                }
            }
        }))
    }

    /* 
        This route handles the messages sent from the Python widget, and mostly
        is just responsible for forwarding it to the correct Mito API.

        See the MitoAPI class comments for a full description of how the API process
        works and why it is designed the way it is.
    */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    handleMessage(message: any): void {
        const model_id = this.model.model_id;
        const mitoAPI = window.mitoAPIMap?.get(model_id);
        mitoAPI?.receiveResponse(message);
    }

    getSheetDataArray(): SheetData[] {
        const unparsed = this.model.get('sheet_data_json')
        return JSON.parse(unparsed);
    }
    
    getUserProfile(): UserProfile {
        const unparsed = this.model.get('user_profile_json')
        const userProfile = JSON.parse(unparsed)
        if (userProfile['usageTriggeredFeedbackID'] == '') {
            userProfile['usageTriggeredFeedbackID'] = undefined
        }
        return userProfile;
    }
    
    getAnalysisData(): AnalysisData {
        const unparsed = this.model.get('analysis_data_json')
        return JSON.parse(unparsed);
    }
}
