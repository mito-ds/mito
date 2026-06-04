/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useState } from "react";
import { MitoAPI } from "../api/api";
import { CardBlock } from "../components/endo/CardBlockDisplay";
import { ColumnID, SheetData } from "../types";
import { ExploreLink } from "../utils/cardStorage";

export const useCardContent = (
    mitoAPI: MitoAPI,
    sheetIndex: number,
    rowIndex: number,
    columnID: ColumnID | undefined,
    sheetData: SheetData | undefined,
): {
    blocks: CardBlock[] | undefined;
    explore: ExploreLink[];
    hasCard: boolean;
} => {
    const hasCard = columnID !== undefined && sheetData?.columnCards?.[columnID] !== undefined;
    const [blocks, setBlocks] = useState<CardBlock[] | undefined>(undefined);
    const [explore, setExplore] = useState<ExploreLink[]>([]);

    useEffect(() => {
        if (!hasCard || columnID === undefined) {
            setBlocks(undefined);
            setExplore([]);
            return;
        }

        let cancelled = false;
        void (async () => {
            const response = await mitoAPI.getCardContent(sheetIndex, rowIndex, columnID);
            if (cancelled) {
                return;
            }
            const result = 'result' in response ? response.result : undefined;
            if (result !== undefined && !('error' in result)) {
                setBlocks(result.blocks);
                setExplore(result.explore ?? []);
            } else {
                setBlocks([]);
                setExplore([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [hasCard, sheetIndex, rowIndex, columnID, mitoAPI, sheetData?.columnCards]);

    return { blocks, explore, hasCard };
};
