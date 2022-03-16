import React from "react";
import MitoAPI from "../../../api";
import ExcelFormatSection from "../../../pro/download/ExcelFormatSection";
import { DataframeID, ExcelExportState, SheetData, UIState, UserProfile } from "../../../types";
import { toggleInArray } from "../../../utils/arrays";
import MultiToggleBox from "../../elements/MultiToggleBox";
import MultiToggleItem from "../../elements/MultiToggleItem";
import Row from "../../spacing/Row";

const ExcelDownloadConfigSection = (props: {
    mitoAPI: MitoAPI
    userProfile: UserProfile;
    sheetDataMap: Record<DataframeID, SheetData>
    exportState: ExcelExportState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    newlyFormattedColumns: Record<DataframeID, string[]>
    setNewlyFormattedColumns: React.Dispatch<React.SetStateAction<Record<DataframeID, string[]>>>
}): JSX.Element => {

    return (
        <>
            <p className='text-header-3'>
                Sheets to Export
            </p> 
            <MultiToggleBox
                width='block'
                height='small'
            >
                {Object.entries(props.sheetDataMap).map(([dataframeID, sheetData]) => {
                    return (
                        <MultiToggleItem
                            key={dataframeID}
                            title={sheetData.dfName}
                            toggled={props.exportState.dataframeIDs.includes(dataframeID)}
                            onToggle={() => { 
                                props.setUIState(prevUIState => {
                                    const newDataframeIDs = [...props.exportState.dataframeIDs]
                                    toggleInArray(newDataframeIDs, dataframeID); // Toggle the index

                                    return {
                                        ...prevUIState,
                                        exportConfiguration: {exportType: 'excel', dataframeIDs: newDataframeIDs}
                                    }
                                })
                            }}
                        />
                    ) 
                })}
            </MultiToggleBox>
            

            {/* 
                For sheets that are going to be exported, display all of the columns that have 
                formatting applied to them and let the user change / add new formatting before exporting. 

                This is a Mito Pro feature.
            */}
            {props.userProfile.isPro && 
                <ExcelFormatSection
                    mitoAPI={props.mitoAPI}
                    sheetDataMap={props.sheetDataMap}
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

