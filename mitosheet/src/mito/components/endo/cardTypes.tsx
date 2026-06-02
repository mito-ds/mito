/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export type CardTextBlock = {
    type: 'text';
    content: string;
};

export type CardHeaderBlock = {
    type: 'header';
    content: string;
};

export type CardMetricBlock = {
    type: 'metric';
    label: string;
    value: string;
    delta?: string;
};

export type CardTableBlock = {
    type: 'table';
    rows: [string, string][];
};

export type CardDividerBlock = {
    type: 'divider';
};

export type CardBlock =
    | CardTextBlock
    | CardHeaderBlock
    | CardMetricBlock
    | CardTableBlock
    | CardDividerBlock;

export type CardContentResponse = {
    blocks: CardBlock[];
};
