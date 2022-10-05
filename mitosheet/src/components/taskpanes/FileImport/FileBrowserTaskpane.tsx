// Copyright (c) Mito

import React from 'react';

import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import { isMitoError } from '../../../utils/errors';
import FileBrowser from '../../import/FileBrowser/FileBrowser';
import { ImportState } from './FileImportTaskpane';


interface FileBrowserImportProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newPathParts: string[]) => void;

    setImportState: React.Dispatch<React.SetStateAction<ImportState>>;
}



/* 
    Allows a user to import an XLSX file with the given name, and
    in turn allows them to configure how to import sheets in this
    file.
*/
function FileBrowserTaskpane(props: FileBrowserImportProps): JSX.Element {

    return (
        <FileBrowser
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            userProfile={props.userProfile}
            setUIState={props.setUIState}
            isUpdate={false}

            currPathParts={props.currPathParts}
            setCurrPathParts={props.setCurrPathParts}

            setImportState={props.setImportState}
            importCSVFile={async (file) => {
                // Get the full file path
                const filePath = await props.mitoAPI.getPathJoined([...props.currPathParts, file.name]);
                if (filePath === undefined) {
                    return;
                }

                // Send an import message
                const result = await props.mitoAPI.editSimpleImport([filePath]);

                // If it is an error, we open the import taskpane with an error
                if (isMitoError(result)) {
                    props.setImportState({
                        screen: 'csv_import',
                        fileName: file.name,
                        filePath: filePath,
                        error: result.to_fix
                    })
                }
            }}
        />
    )
}

export default FileBrowserTaskpane;