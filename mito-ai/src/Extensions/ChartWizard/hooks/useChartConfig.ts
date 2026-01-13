/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, useEffect, useMemo } from 'react';
import { parseChartConfig, ChartConfigVariable } from '../parser';

interface UseChartConfigProps {
    sourceCode: string | null | undefined;
    currentSourceCode: string | null;
}

/**
 * Hook to manage chart configuration parsing and state.
 * 
 * Parses chart configuration from source code and provides:
 * - configVariables: Array of parsed configuration variables
 * - hasConfig: Boolean indicating if configuration exists
 */
export const useChartConfig = ({ sourceCode, currentSourceCode }: UseChartConfigProps) => {
    const [configVariables, setConfigVariables] = useState<ChartConfigVariable[]>([]);

    // Parse config when chart data or current source code changes
    useEffect(() => {
        const codeToParse = currentSourceCode || sourceCode;
        if (!codeToParse) {
            setConfigVariables([]);
            return;
        }

        const parsed = parseChartConfig(codeToParse);
        if (parsed) {
            setConfigVariables(parsed.variables);
        } else {
            setConfigVariables([]);
        }
    }, [sourceCode, currentSourceCode]);

    const hasConfig = useMemo(() => configVariables.length > 0, [configVariables.length]);

    return {
        configVariables,
        setConfigVariables,
        hasConfig,
    };
};
