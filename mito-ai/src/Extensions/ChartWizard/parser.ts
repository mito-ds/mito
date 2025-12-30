/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface ChartConfigVariable {
    name: string;
    value: string | number | boolean | [number, number];
    type: 'string' | 'number' | 'boolean' | 'tuple';
}

export interface ParsedChartConfig {
    variables: ChartConfigVariable[];
    configStartIndex: number;
    configEndIndex: number;
}

/**
 * Parses the chart configuration section from Python code.
 * Looks for variables between "# === CHART CONFIG ===" and "# === END CONFIG ===" markers.
 */
export function parseChartConfig(sourceCode: string): ParsedChartConfig | null {
    const configStartMarker = '# === CHART CONFIG ===';
    const configEndMarker = '# === END CONFIG ===';

    const startIndex = sourceCode.indexOf(configStartMarker);
    const endIndex = sourceCode.indexOf(configEndMarker);

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return null;
    }

    const configSection = sourceCode.substring(startIndex + configStartMarker.length, endIndex).trim();
    const lines = configSection.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const variables: ChartConfigVariable[] = [];

    for (const line of lines) {
        // Skip comment lines
        if (line.startsWith('#')) {
            continue;
        }

        // Parse single variable assignments (one variable per line)
        const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
        if (match && match[1] && match[2]) {
            const varName = match[1];
            const valueStr = match[2];
            const parsed = parseValue(valueStr.trim());
            if (parsed) {
                variables.push({
                    name: varName,
                    value: parsed.value,
                    type: parsed.type
                });
            }
        }
    }

    return {
        variables,
        configStartIndex: startIndex,
        configEndIndex: endIndex + configEndMarker.length
    };
}

/**
 * Parses a Python value string into its appropriate type.
 */
function parseValue(valueStr: string): { value: string | number | boolean | [number, number]; type: 'string' | 'number' | 'boolean' | 'tuple' } | null {
    // Remove surrounding whitespace
    valueStr = valueStr.trim();

    // Boolean values
    if (valueStr === 'True') {
        return { value: true, type: 'boolean' };
    }
    if (valueStr === 'False') {
        return { value: false, type: 'boolean' };
    }

    // Tuple (e.g., (12, 6))
    const tupleMatch = valueStr.match(/^\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\)$/);
    if (tupleMatch) {
        return {
            value: [parseFloat(tupleMatch[1] || '0'), parseFloat(tupleMatch[2] || '0')],
            type: 'tuple'
        };
    }

    // Number
    if (/^-?\d+(?:\.\d+)?$/.test(valueStr)) {
        return { value: parseFloat(valueStr), type: 'number' };
    }

    // String (remove quotes)
    const stringMatch = valueStr.match(/^['"](.*)['"]$/);
    if (stringMatch) {
        return { value: stringMatch[1] || '', type: 'string' };
    }

    // If it doesn't match any pattern, treat as string literal
    return { value: valueStr, type: 'string' };
}


/**
 * Updates the chart configuration section with new variable values.
 * Regenerates the config section in a simple, consistent format.
 */
export function updateChartConfig(sourceCode: string, variables: ChartConfigVariable[]): string {
    const parsed = parseChartConfig(sourceCode);
    if (!parsed) {
        return sourceCode;
    }

    // Create a map of variable names to their new values
    const varMap = new Map<string, ChartConfigVariable>();
    variables.forEach(v => varMap.set(v.name, v));

    // Build new config section - simple one variable per line format
    const configStartMarker = '# === CHART CONFIG ===';
    const configEndMarker = '# === END CONFIG ===';
    let newConfigSection = configStartMarker + '\n\n';

    // Use updated variables if available, otherwise keep original
    const variablesToWrite = parsed.variables.map(v => varMap.get(v.name) || v);

    for (const variable of variablesToWrite) {
        const formattedValue = formatValue(variable.value, variable.type);
        newConfigSection += `${variable.name} = ${formattedValue}\n`;
    }

    newConfigSection += '\n' + configEndMarker;

    // Replace the old config section with the new one
    const beforeConfig = sourceCode.substring(0, parsed.configStartIndex);
    const afterConfig = sourceCode.substring(parsed.configEndIndex);

    return beforeConfig + newConfigSection + afterConfig;
}

/**
 * Formats a value back to its Python string representation.
 */
function formatValue(value: string | number | boolean | [number, number], type: string): string {
    if (type === 'boolean') {
        return value ? 'True' : 'False';
    }
    if (type === 'tuple' && Array.isArray(value)) {
        return `(${value[0]}, ${value[1]})`;
    }
    if (type === 'number') {
        return String(value);
    }
    // String - escape single quotes and wrap in single quotes
    return `'${String(value).replace(/'/g, "\\'")}'`;
}