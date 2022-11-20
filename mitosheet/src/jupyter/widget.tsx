import {
    DOMWidgetModel,
    DOMWidgetView,
    ISerializers,
    WidgetView
} from '@jupyter-widgets/base';


import { MODULE_NAME, MODULE_VERSION } from '../version';

// React
import React from 'react';
import ReactDOM from 'react-dom';
import Mito from '../components/Mito';
import { getAnalysisData, getSheetDataArray, getUserProfile } from './jupyterUtils';


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

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        commands: any;
    }
}

export class ExampleView extends DOMWidgetView {

    initialize(parameters: WidgetView.InitializeParameters): void {
        super.initialize(parameters);

        // Bind the functions we pass down to other classes
        this.send = this.send.bind(this);
        this.model.on = this.model.on.bind(this.model);
    }

    render(): void {
        /**
         * This is the final location where we use the shared variables. When we transition away from being
         * a widget and to just a display() call, we will instead write these variables directly to the JS
         * so that Mito can still be created with them.
         * 
         * We do this instead of making Mito creatable without these variables, because we assume that they 
         * exist currently, and allowing them to be undefined is a big refactor.
         */
        const sheetDataArray = getSheetDataArray(this.model);
        const analysisData = getAnalysisData(this.model);
        const userProfile = getUserProfile(this.model);

        ReactDOM.render(
            <Mito
                model={this.model}
                send={this.send}
                registerReceiveHandler={(handler) => {
                    this.model.on('msg:custom', handler, this);
                }}
                sheetDataArray={sheetDataArray}
                analysisData={analysisData}
                userProfile={userProfile}
            />,
            this.el
        )   
    }
}
