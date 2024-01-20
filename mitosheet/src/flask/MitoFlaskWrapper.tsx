


import { AnalysisData, Mito, SendFunctionReturnType, UserProfile, MitoEnterpriseConfigKey } from "mitosheet-frontend";
import React, { Component } from "react";


export default class MitoFlaskWrapper extends Component {
    processMessageQueueTimer: null | NodeJS.Timeout;

    constructor(props: any) {
        super(props);
    }

    public async send(msg: Record<string, unknown>): Promise<SendFunctionReturnType<any>> {
        console.log("SENDING", msg)
        return {} as any
    }


    render = () => {
        const key = 'abc'
        const sheetDataArray = [] as any;
        const analysisData: AnalysisData = {
            analysisName: 'abc',
            publicInterfaceVersion: 1,
            analysisToReplay: undefined,
            code: [],
            stepSummaryList: [],
            currStepIdx: 1,
            graphDataDict: {},
            updateEventCount: 1,
            undoCount: 1,
            redoCount: 1,
            renderCount: 1,
            lastResult: null,
            experiment: undefined,
            codeOptions: {
                as_function: true,
                call_function: true,
                function_name: 'abc',
                function_params: {},
                import_custom_python_code: true
            },
            userDefinedFunctions: [],
            userDefinedImporters: [],
            userDefinedEdits: [],
            importFolderData: null,
            theme: null
        };
        const userProfile: UserProfile = {
            userEmail: 'abc',
            receivedTours: [],
        
            isPro: true,
            isEnterprise: true,
        
            pandasVersion: '2.0.0',
            pythonVersion: '3.9.11',
        
            telemetryEnabled: true,
            shouldUpgradeMitosheet: false,
            numUsages: 10,
            snowflakeCredentials: null,
            openAIAPIKey: null,
            aiPrivacyPolicy: true,
            mitoConfig: {
                [MitoEnterpriseConfigKey.MEC_VERSION]: null,
                [MitoEnterpriseConfigKey.SUPPORT_EMAIL]: 'n@g.com',
                [MitoEnterpriseConfigKey.DISABLE_TOURS]: true,
                [MitoEnterpriseConfigKey.CODE_SNIPPETS]: null,
                [MitoEnterpriseConfigKey.ENABLE_SNOWFLAKE]: true,
                [MitoEnterpriseConfigKey.DISPLAY_SNOWFLAKE_IMPORT]: true,
                [MitoEnterpriseConfigKey.DISPLAY_AI_TRANSFORM]: true,
                [MitoEnterpriseConfigKey.DISPLAY_SCHEDULING]: true,
                [MitoEnterpriseConfigKey.CUSTOM_SHEET_FUNCTIONS_PATH]: 'abc',
                [MitoEnterpriseConfigKey.CUSTOM_IMPORTERS_PATH]: 'abc',
            },
        };

        return (
            <Mito 
                key={key as string}
                getSendFunction={async () => this.send.bind(this)} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
            />  
        )
    }
}