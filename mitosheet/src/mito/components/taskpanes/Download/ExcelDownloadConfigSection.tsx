import React from "react";
import MitoAPI from "../../../api/api";
import ExcelFormatSection from "../../../pro/download/ExcelFormatSection";
import { ExcelExportState, SheetData, UIState, UserProfile } from "../../../../types";
import MultiToggleDataframes from "../../elements/MultiToggleDataframes";
import Row from "../../layout/Row";

const ExcelDownloadConfigSection = (props: {
    dfNames: string[]
    mitoAPI: MitoAPI
    userProfile: UserProfile;
    sheetDataArray: SheetData[]
    exportState: ExcelExportState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    newlyFormattedColumns: Record<number, string[]>
    setNewlyFormattedColumns: React.Dispatch<React.SetStateAction<Record<number, string[]>>>
}): JSX.Element => {

    return (
        <>
            <p className='text-header-3'>
                Dataframes to Export
            </p> 
            <MultiToggleDataframes
                sheetDataArray={props.sheetDataArray}
                selectedSheetIndexes={props.exportState.sheetIndexes}
                setUIState={props.setUIState}
                onChange={(newSelectedSheetIndexes) => {
                    props.setUIState(prevUiState => {
                        return {
                            ...prevUiState,
                            exportConfiguration: {exportType: 'excel', sheetIndexes: newSelectedSheetIndexes}
                        }
                    })
                }}
            />
            {/* 
                For sheets that are going to be exported, display all of the columns that have 
                formatting applied to them and let the user change / add new formatting before exporting. 

                This is a Mito Pro feature.
            */}
            {props.userProfile.isPro && 
                <ExcelFormatSection
                    dfNames={props.dfNames}
                    mitoAPI={props.mitoAPI}
                    sheetDataArray={props.sheetDataArray}
                    exportState={props.exportState}
                    newlyFormattedColumns={props.newlyFormattedColumns}
                    setNewlyFormattedColumns={props.setNewlyFormattedColumns}
                />
            }
            {!props.userProfile.isPro &&
                <Row justify='space-around'>
                    <p className='ma-25px text-align-center text-body-1'>
                        Want to preserving your formatting when exporting to Excel? Consider upgrading to&nbsp;
                        <a 
                            onClick={() => void props.mitoAPI.log('clicked_pro_button', 
                                {
                                    'pro_button_location': 'download_taskpane_excel_format_export',
                                }
                            )}
                            className='text-body-1-link' 
                            href='https://www.trymito.io/plans' 
                            target='_blank' 
                            rel="noreferrer"
                        >
                            Mito Pro
                        </a>.
                    </p>
                </Row>
            }
        </>
    )
}

export default ExcelDownloadConfigSection;

