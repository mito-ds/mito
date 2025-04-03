/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Function to check for blacklisted words that could be dangerous for the agent to execute

export const checkForBlacklistedWords = (code: string): { safe: boolean, reason?: string } => {
    // List of dangerous operations/commands that could delete files or cause harm
    const blacklistedPatterns = [
        {
            pattern: /\brm\s+-rf\b/,
            message: "This code contains a command (rm -rf) that could recursively delete files and directories from your system"
        },
        {
            pattern: /\bfs\.rmdir\b/,
            message: "This code contains a Node.js command (fs.rmdir) that could delete directories from your system"
        },
        {
            pattern: /\bfs\.unlink\b/,
            message: "This code contains a Node.js command (fs.unlink) that could delete files from your system"
        },
        {
            pattern: /\bshutil\.rmtree\b/,
            message: "This code contains a Python command (shutil.rmtree) that could recursively delete directories and their contents"
        },
        {
            pattern: /\bos\.remove\b/,
            message: "This code contains a Python command (os.remove) that could delete files from your system"
        },
        {
            pattern: /\bos\.rmdir\b/,
            message: "This code contains a Python command (os.rmdir) that could delete directories from your system"
        },
        {
            pattern: /\bos\.unlink\b/,
            message: "This code contains a Python command (os.unlink) that could delete files from your system"
        },
        {
            pattern: /\brmdir\b/,
            message: "This code contains a command (rmdir) that could delete directories from your system"
        },
        {
            pattern: /\bunlink\b/,
            message: "This code contains a function (unlink) that could delete files from your system"
        },
        {
            pattern: /\bdelete\s+from\b/i,
            message: "This code contains an SQL DELETE command that could remove data from your database"
        },
        {
            pattern: /\bdrop\s+table\b/i,
            message: "This code contains an SQL DROP TABLE command that could delete entire tables from your database"
        },
        {
            pattern: /\bdrop\s+database\b/i,
            message: "This code contains an SQL DROP DATABASE command that could delete your entire database"
        },
        {
            pattern: /\bformat\s*\(/,
            message: "This code contains a format command that could potentially format your drives or storage devices"
        },
        {
            pattern: /\bsystem\s*\(/,
            message: "This code contains a system() call that could execute arbitrary system commands, which is a security risk"
        },
        {
            pattern: /\beval\s*\(/,
            message: "This code contains an eval() function that could execute arbitrary code, which is a security risk"
        },
        {
            pattern: /\bexec\s*\(/,
            message: "This code contains an exec() function that could execute arbitrary code, which is a security risk"
        },
    ];

    for (const { pattern, message } of blacklistedPatterns) {
        if (pattern.test(code)) {
            return {
                safe: false,
                reason: message
            };
        }
    }

    return { safe: true };
};