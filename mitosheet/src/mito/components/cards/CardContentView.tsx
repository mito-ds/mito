/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import CardBlockDisplay, { CardBlock } from "../endo/CardBlockDisplay";
import { ExploreLink } from "../../utils/cardStorage";

const CardContentView = (props: {
    blocks: CardBlock[] | undefined;
    explore: ExploreLink[];
    openingView: string | undefined;
    onOpenExploreView: (link: ExploreLink) => void;
}): JSX.Element => {
    if (props.blocks === undefined) {
        return <div className="mito-selection-card-loading">…</div>;
    }

    return (
        <>
            <CardBlockDisplay blocks={props.blocks} />
            {props.explore.length > 0 &&
                <div className="mito-selection-card-explore">
                    <p className="mito-selection-card-explore-title">Explore more</p>
                    <div className="mito-selection-card-explore-list" role="list">
                        {props.explore.map((link) =>
                            <button
                                key={link.view_code + link.label}
                                type="button"
                                role="listitem"
                                className="mito-selection-card-explore-item"
                                disabled={props.openingView !== undefined}
                                onClick={() => { props.onOpenExploreView(link); }}
                            >
                                <span className="mito-selection-card-explore-item-label">
                                    {link.label}
                                </span>
                                <span className="mito-selection-card-explore-item-chevron" aria-hidden>
                                    ›
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            }
        </>
    );
};

export default CardContentView;
