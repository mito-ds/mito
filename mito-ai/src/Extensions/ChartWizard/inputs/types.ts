/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ChartConfigVariable } from '../utils/parser';

export interface InputRowProps {
    variable: ChartConfigVariable;
    label: string;
    onVariableChange: (variableName: string, newValue: string | number | boolean | [number, number]) => void;
}

