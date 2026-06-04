/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { ColumnID, SheetData, UIState } from "../../../types";
import { parseCardDefinition, serializeCardDefinition } from "../../../utils/cardStorage";
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
    const initialStored = sheetData?.columnCards?.[props.columnID] ?? '';
    const [cardCode, setCardCode] = useState(() => parseCardDefinition(initialStored).code);
    const [exploreLinks, setExploreLinks] = useState(() => parseCardDefinition(initialStored).explore);
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
        setExploreLinks(result.explore);
    }

    const saveCard = async () => {
        await props.mitoAPI.editSetColumnCard(
            props.sheetIndex,
            props.columnID,
            serializeCardDefinition(cardCode, exploreLinks),
        );
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
                    Describe the card. AI builds a dashboard-style layout: title, metrics, insight, and key fields.
                    Use <code>row</code> for the selected row and <code>df</code> for sheet-wide stats.
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
                        onClick={() => { setCardCode(''); setExploreLinks([]); }}
                        disabled={cardCode === '' && exploreLinks.length === 0}
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
