import React from "react";
import MitoAPI from "../../../jupyter/api";
import ExcelFormatSection from "../../../pro/download/ExcelFormatSection";
import { ExcelExportState, SheetData, UIState, UserProfile } from "../../../types";
import { addIfAbsent, removeIfPresent, toggleInArray } from "../../../utils/arrays";
import MultiToggleBox from "../../elements/MultiToggleBox";
import MultiToggleItem from "../../elements/MultiToggleItem";
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
            <MultiToggleBox
                width='block'
                height='small'
                toggleAllIndexes={(indexesToToggle, newToggle) => {
                    props.setUIState(prevUiState => {
                        // We make the assumption that the order of the sheets in the MultiToggleBox
                        // is the same as the order in the sheet. 
                        const newSelectedSheetIndexes = [...props.exportState.sheetIndexes]
                        indexesToToggle.forEach(sheetIndex => {
                            if (newToggle) {
                                addIfAbsent(newSelectedSheetIndexes, sheetIndex)
                            } else {
                                removeIfPresent(newSelectedSheetIndexes, sheetIndex)
                            }
                        })
                        newSelectedSheetIndexes.sort() // Make sure these are in the right order;
                        return {
                            ...prevUiState,
                            exportConfiguration: {exportType: 'excel', sheetIndexes: newSelectedSheetIndexes}
                        }
                    })
                }}
            >
                {props.dfNames.map((dfName, index) => {
                    return (
                        <MultiToggleItem
                            key={index}
                            title={dfName}
                            toggled={props.exportState.sheetIndexes.includes(index)}
                            index={index}
                            onToggle={() => { 
                                props.setUIState(prevUIState => {
                                    const newSheetIndexes = [...props.exportState.sheetIndexes]
                                    toggleInArray(newSheetIndexes, index); // Toggle the index
                                    newSheetIndexes.sort() // Make sure these are in the right order;

                                    return {
                                        ...prevUIState,
                                        exportConfiguration: {exportType: 'excel', sheetIndexes: newSheetIndexes}
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

