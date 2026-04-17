/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";

export type SelectionFloatActionsProps = {
    children: React.ReactNode;
};

/**
 * Horizontal row for actions tied to the current cell selection (Visualize, etc.).
 * Add more controls as siblings — layout stays a single row with gap until you
 * change `.mito-endo-grid__selection-actions` (e.g. flex-wrap or a second row).
 */
export function SelectionFloatActions(
    props: SelectionFloatActionsProps
): JSX.Element {
    return (
        <div
            className="mito-endo-grid__selection-actions"
            role="toolbar"
            aria-label="Selection actions"
        >
            {props.children}
        </div>
    );
}
