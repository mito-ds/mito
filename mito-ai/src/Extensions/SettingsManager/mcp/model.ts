/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface IMCPTool {
    name: string;
    description: string;
}

export interface IMCPServer {
    name: string;
    command: string;
    args: string[];
    env: Record<string, string>;
    tools?: IMCPTool[];
    error?: string;
}

export interface IMCPServers {
    [id: string]: IMCPServer;
}

export interface IMCPServerFormData {
    name: string;
    command: string;
    argsText: string;
    envText: string;
}

export const EMPTY_MCP_FORM: IMCPServerFormData = {
    name: '',
    command: '',
    argsText: '',
    envText: ''
};

/**
 * Parse whitespace/newline-separated args, ignoring blank lines.
 */
export const parseArgs = (argsText: string): string[] => {
    return argsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
};

/**
 * Parse KEY=VALUE env vars, one per line. Returns [env, error].
 */
export const parseEnv = (envText: string): [Record<string, string>, string | null] => {
    const env: Record<string, string> = {};
    const lines = envText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) {
            return [{}, `Invalid env line: "${line}". Use KEY=VALUE.`];
        }
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1);
        env[key] = value;
    }
    return [env, null];
};
