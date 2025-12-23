/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface ChartConfigVariable {
    name: string;
    value: string | number | boolean | [number, number];
    type: 'string' | 'number' | 'boolean' | 'tuple';
    rawValue: string; // Original string representation
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
        
        // Handle tuple unpacking first (e.g., X_LABEL, Y_LABEL = 'Year', 'Gross Earnings ($)')
        const tupleMatch = line.match(/^([A-Z_][A-Z0-9_]+(?:\s*,\s*[A-Z_][A-Z0-9_]+)+)\s*=\s*(.+)$/);
        if (tupleMatch) {
            const [, varNames, valuesStr] = tupleMatch;
            const varNameList = varNames?.split(',').map(n => n.trim()) || [];
            const valuesList = parseTupleValues(valuesStr?.trim() || '');
            
            if (varNameList.length === valuesList.length) {
                for (let i = 0; i < varNameList.length; i++) {
                    const parsed = parseValue(valuesList[i] || '');
                    if (parsed) {
                        variables.push({
                            name: varNameList[i] || '',
                            value: parsed.value,
                            type: parsed.type,
                            rawValue: valuesList[i] || ''
                        });
                    }
                }
            }
            continue; // Skip single variable parsing for this line
        }
        
        // Parse single variable assignments
        const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
        if (match) {
            const [, varName, valueStr] = match;
            const parsed = parseValue(valueStr?.trim() || '');
            if (parsed) {
                variables.push({
                    name: varName || '',
                    value: parsed.value,
                    type: parsed.type,
                    rawValue: valueStr?.trim() || ''
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
 * Parses tuple values from a string like "'Year', 'Gross Earnings ($)'"
 */
function parseTupleValues(valuesStr: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        
        if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (inQuotes && char === quoteChar) {
            // Check if it's escaped
            if (i > 0 && valuesStr[i - 1] === '\\') {
                current += char;
            } else {
                inQuotes = false;
                current += char;
            }
        } else if (!inQuotes && char === ',') {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    if (current.trim()) {
        values.push(current.trim());
    }
    
    return values;
}

/**
 * Updates the chart configuration section with new variable values.
 * Tries to preserve the original format (tuple unpacking vs single assignments).
 */
export function updateChartConfig(sourceCode: string, variables: ChartConfigVariable[]): string {
    const parsed = parseChartConfig(sourceCode);
    if (!parsed) {
        return sourceCode;
    }
    
    // Create a map of variable names to their new values
    const varMap = new Map<string, ChartConfigVariable>();
    variables.forEach(v => varMap.set(v.name, v));
    
    // Get the original config section to preserve formatting
    const configStartMarker = '# === CHART CONFIG ===';
    const configEndMarker = '# === END CONFIG ===';
    const originalConfigSection = sourceCode.substring(
        parsed.configStartIndex + configStartMarker.length,
        parsed.configEndIndex - configEndMarker.length
    ).trim();
    
    const originalLines = originalConfigSection.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('#'));
    
    let newConfigSection = configStartMarker + '\n\n';
    
    // Try to preserve original format - check if variables were on the same line
    for (const originalLine of originalLines) {
        // Check if this was a tuple unpacking line
        const tupleMatch = originalLine.match(/^([A-Z_][A-Z0-9_]+(?:\s*,\s*[A-Z_][A-Z0-9_]+)+)\s*=\s*(.+)$/);
        if (tupleMatch) {
            const [, varNames] = tupleMatch;
            const varNameList = varNames?.split(',').map(n => n.trim()) || [];
            const updatedVars = varNameList.map(name => varMap.get(name) || parsed.variables.find(v => v.name === name)).filter(Boolean) as ChartConfigVariable[];
            
            if (updatedVars.length === varNameList.length) {
                const varNamesStr = updatedVars.map(v => v.name).join(', ');
                const valuesStr = updatedVars.map(v => formatValue(v.value, v.type)).join(', ');
                newConfigSection += `${varNamesStr} = ${valuesStr}\n`;
            }
        } else {
            // Single variable assignment
            const match = originalLine.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
            if (match) {
                const [, varName] = match;
                const updatedVar = varMap.get(varName || '') || parsed.variables.find(v => v.name === varName);
                if (updatedVar) {
                    const formattedValue = formatValue(updatedVar.value, updatedVar.type);
                    newConfigSection += `${updatedVar.name || ''} = ${formattedValue}\n`;
                }
            }
        }
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
    // String - add quotes
    return `'${String(value).replace(/'/g, "\\'")}'`;
}

