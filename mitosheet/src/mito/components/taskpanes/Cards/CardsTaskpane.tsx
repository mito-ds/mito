/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { ColumnID, SheetData, UIState } from "../../../types";
import TextArea from "../../elements/TextArea";
import TextButton from "../../elements/TextButton";
import Row from "../../layout/Row";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { TaskpaneType } from "../taskpanes";

interface CardsTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    sheetDataArray: SheetData[];
    sheetIndex: number;
    columnID: ColumnID;
}

const CardsTaskpane = (props: CardsTaskpaneProps): JSX.Element => {
    const sheetData: SheetData | undefined = props.sheetDataArray[props.sheetIndex];

    const [userInput, setUserInput] = useState('');
    const [cardCode, setCardCode] = useState(() => sheetData?.columnCards?.[props.columnID] ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    if (sheetData === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const columnHeader = sheetData.columnIDsMap[props.columnID];

    const generateCode = async () => {
        setLoading(true);
        setError(undefined);
        const response = await props.mitoAPI.getCardTemplate(props.sheetIndex, props.columnID, userInput);
        setLoading(false);

        const result = 'result' in response ? response.result : undefined;
        if (result === undefined || 'error' in result) {
            setError(result !== undefined && 'error' in result ? result.error : 'Something went wrong generating the card.');
            return;
        }
        setCardCode(result.code);
    }

    const saveCard = async () => {
        await props.mitoAPI.editSetColumnCard(props.sheetIndex, props.columnID, cardCode);
        props.setUIState(prevUIState => {
            return {...prevUIState, currOpenTaskpane: {type: TaskpaneType.NONE}}
        })
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header={`Create Card for ${columnHeader}`}
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <p className="text-body-1">
                    Describe the card. AI writes a short Streamlit script using
                    {' '}<code>st.metric</code>, <code>st.write</code>, <code>st.table</code>, etc.
                    Use <code>row</code> for the selected row.
                </p>
                <TextArea
                    value={userInput}
                    placeholder="e.g. Show title, IMDB rating, and gross revenue"
                    onChange={(e) => setUserInput(e.target.value)}
                    height="small"
                />
                <Row justify="space-between">
                    <TextButton
                        variant="dark"
                        onClick={generateCode}
                        disabled={loading || userInput.trim() === ''}
                    >
                        {loading ? 'Generating...' : 'Generate with AI'}
                    </TextButton>
                </Row>
                {error !== undefined &&
                    <p className="text-color-error">{error}</p>
                }
                <p className="text-header-3">Card code</p>
                <TextArea
                    value={cardCode}
                    placeholder={'st.metric("Rating", row["IMDB_Rating"])'}
                    onChange={(e) => setCardCode(e.target.value)}
                    height="medium"
                />
                <Row justify="space-between">
                    <TextButton
                        variant="light"
                        width="hug-contents"
                        onClick={() => setCardCode('')}
                        disabled={cardCode === ''}
                    >
                        Clear
                    </TextButton>
                    <TextButton
                        variant="dark"
                        width="hug-contents"
                        onClick={saveCard}
                        disabled={cardCode.trim() === ''}
                    >
                        Save Card
                    </TextButton>
                </Row>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default CardsTaskpane;
