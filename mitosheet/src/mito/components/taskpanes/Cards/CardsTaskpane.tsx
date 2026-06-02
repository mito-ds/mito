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

/*
    Lets the user describe an "at-a-glance" card for a column, generate a template
    with AI, and save it. The saved template persists with the analysis and is shown
    when a cell in this column is selected.
*/
const CardsTaskpane = (props: CardsTaskpaneProps): JSX.Element => {
    const sheetData: SheetData | undefined = props.sheetDataArray[props.sheetIndex];

    const [userInput, setUserInput] = useState('');
    const [template, setTemplate] = useState(() => sheetData?.columnCards?.[props.columnID] ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    if (sheetData === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const columnHeader = sheetData.columnIDsMap[props.columnID];

    const generateTemplate = async () => {
        setLoading(true);
        setError(undefined);
        const response = await props.mitoAPI.getCardTemplate(props.sheetIndex, props.columnID, userInput);
        setLoading(false);

        const result = 'result' in response ? response.result : undefined;
        if (result === undefined || 'error' in result) {
            setError(result !== undefined && 'error' in result ? result.error : 'Something went wrong generating the card.');
            return;
        }
        setTemplate(result.template);
    }

    const saveCard = async () => {
        await props.mitoAPI.editSetColumnCard(props.sheetIndex, props.columnID, template);
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
                    Describe the card you want. It appears when you select a cell in this column.
                    Use {'{Column Header}'} for values from other columns, or {'{=expression}'} for
                    computed fields (e.g. {'{=Revenue - Cost}'}).
                </p>
                <TextArea
                    value={userInput}
                    placeholder="e.g. Show the customer's name, total revenue, and signup date"
                    onChange={(e) => setUserInput(e.target.value)}
                    height="small"
                />
                <Row justify="space-between">
                    <TextButton
                        variant="dark"
                        onClick={generateTemplate}
                        disabled={loading || userInput.trim() === ''}
                    >
                        {loading ? 'Generating...' : 'Generate Card with AI'}
                    </TextButton>
                </Row>
                {error !== undefined &&
                    <p className="text-color-error">{error}</p>
                }
                <p className="text-header-3">Card Template</p>
                <TextArea
                    value={template}
                    placeholder="Your card template will appear here. You can also edit it directly."
                    onChange={(e) => setTemplate(e.target.value)}
                    height="medium"
                />
                <Row justify="space-between">
                    <TextButton
                        variant="light"
                        width="hug-contents"
                        onClick={() => setTemplate('')}
                        disabled={template === ''}
                    >
                        Clear
                    </TextButton>
                    <TextButton
                        variant="dark"
                        width="hug-contents"
                        onClick={saveCard}
                        disabled={template.trim() === ''}
                    >
                        Save Card
                    </TextButton>
                </Row>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default CardsTaskpane;
