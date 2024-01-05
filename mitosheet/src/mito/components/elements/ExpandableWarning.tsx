import React from "react";
import CautionIcon from "../icons/CautionIcon";
import XIcon from "../icons/XIcon";
import TriangleExpandCollapseIcon from "../icons/TriangleExpandCollapseIcon";

export interface WarningState {
    warningStrings: string[],
    dismissed: boolean,
    dismiss: () => void
};

const ExpandableWarning = (props: {warningState?: WarningState}): JSX.Element => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (props.warningState === undefined || props.warningState.warningStrings.length === 0 || props.warningState.dismissed) {
        return <></>;
    } else if (props.warningState.warningStrings.length === 1) {
        return (
            <div className='caution-text-container'>
                <CautionIcon width={'25px'} height={'30px'} color='var(--mito-status-warning-dark)'/>
                <p className='caution-text'>{props.warningState.warningStrings[0]}</p>
                <XIcon
                    onClick={props.warningState.dismiss}
                    strokeColor="var(--mito-status-warning-dark)"
                    rounded
                    width="12px"
                    style={{ cursor: 'pointer' }}
                />
            </div> 
        )
    } else {
        return (
            <div
                className="caution-text-container expandable-caution-text-container"
                style={{
                    background: 'var(--mito-status-warning)',
                    border: '1px solid var(--mito-status-warning-dark)'
                }}
                onClick={(e) => {
                    setIsExpanded(!isExpanded);
                    e.stopPropagation();
                }}
            >
                <div
                    style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between'}}
                >
                    <CautionIcon width={'54px'} height={'30px'} color='var(--mito-status-warning-dark)'/>
                    <p className='caution-text'>
                        <TriangleExpandCollapseIcon
                            action={isExpanded ? 'collapse' : 'expand'}
                        />
                        {`${props.warningState.warningStrings.length} merge key pairings were removed because at least one of the merge keys was missing from the source tabs.`}
                    </p>
                    <XIcon
                        onClick={props.warningState.dismiss}
                        strokeColor="var(--mito-status-warning-dark)"
                        rounded
                        width="23px"
                        style={{ cursor: 'pointer' }}
                        />
                </div>
                {
                    isExpanded &&
                    (<ul style={{margin: '4px 0'}}>
                        {props.warningState.warningStrings.map((warning, index) => {
                            return (
                                <li className='caution-text' key={index}>
                                    {warning}
                                </li>
                            )
                        })}
                    </ul>)
                }
            </div>
        )
    }
}

export default ExpandableWarning;