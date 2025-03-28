/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { checkForBlacklistedWords } from '../../utils/blacklistedWords';

describe('checkForBlacklistedWords', () => {
    // Basic functionality tests
    describe('basic functionality', () => {
        test('should return safe for normal Python code', () => {
            const safeCode = `
                import pandas as pd
                df = pd.DataFrame({'a': [1, 2, 3]})
                print(df.head())
            `;
            expect(checkForBlacklistedWords(safeCode)).toEqual({ safe: true });
        });

        test('should handle empty string', () => {
            expect(checkForBlacklistedWords('')).toEqual({ safe: true });
        });
    });

    // File System Operations
    describe('file system operations', () => {
        describe('unix commands', () => {
            test('should detect rm -rf command', () => {
                const code = 'rm -rf /some/path';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a command (rm -rf) that could recursively delete files and directories from your system"
                });
            });

            test('should detect rmdir command', () => {
                const code = 'rmdir /some/directory';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a command (rmdir) that could delete directories from your system"
                });
            });
        });

        describe('Python file operations', () => {
            test('should detect Python os.remove', () => {
                const code = 'os.remove("file.txt")';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a Python command (os.remove) that could delete files from your system"
                });
            });

            test('should detect shutil.rmtree', () => {
                const code = 'shutil.rmtree("/path/to/dir")';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a Python command (shutil.rmtree) that could recursively delete directories and their contents"
                });
            });
        });

        describe('Node.js file operations', () => {
            test('should detect fs.rmdir', () => {
                const code = 'fs.rmdir("/path/to/dir")';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a Node.js command (fs.rmdir) that could delete directories from your system"
                });
            });

            test('should detect fs.unlink', () => {
                const code = 'fs.unlink("file.txt")';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a Node.js command (fs.unlink) that could delete files from your system"
                });
            });
        });
    });

    // Database Operations
    describe('database operations', () => {
        describe('SQL DELETE operations', () => {
            test('should detect DELETE FROM command', () => {
                const code = 'DELETE FROM users WHERE id = 1';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains an SQL DELETE command that could remove data from your database"
                });
            });

            test('should detect lowercase delete from', () => {
                const code = 'delete from users where id = 1';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains an SQL DELETE command that could remove data from your database"
                });
            });
        });

        describe('SQL DROP operations', () => {
            test('should detect DROP TABLE command', () => {
                const code = 'DROP TABLE users';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains an SQL DROP TABLE command that could delete entire tables from your database"
                });
            });

            test('should detect DROP DATABASE command', () => {
                const code = 'DROP DATABASE myapp';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains an SQL DROP DATABASE command that could delete your entire database"
                });
            });

            test('should detect mixed case drop commands', () => {
                const code = 'DrOp TaBlE users';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains an SQL DROP TABLE command that could delete entire tables from your database"
                });
            });
        });
    });

    // System Commands
    describe('system commands', () => {
        test('should detect system() calls', () => {
            const code = 'system("some command")';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains a system() call that could execute arbitrary system commands, which is a security risk"
            });
        });

        test('should detect eval() calls', () => {
            const code = 'eval("console.log(\'Hello\')")';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains an eval() function that could execute arbitrary code, which is a security risk"
            });
        });

        test('should detect exec() calls', () => {
            const code = 'exec("print(\'Hello\')")';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains an exec() function that could execute arbitrary code, which is a security risk"
            });
        });

        test('should detect eval with different spacing', () => {
            const code = 'eval    ("code")';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains an eval() function that could execute arbitrary code, which is a security risk"
            });
        });

        test('should detect exec with different spacing', () => {
            const code = 'exec    ("code")';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains an exec() function that could execute arbitrary code, which is a security risk"
            });
        });

        test('should detect format() calls', () => {
            const code = 'format(drive)';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains a format command that could potentially format your drives or storage devices"
            });
        });
    });

    // Edge Cases and Special Scenarios
    describe('edge cases and special scenarios', () => {
        describe('partial word matches', () => {
            test('should allow word "delete" in variable names', () => {
                const code = 'const deleteButton = document.getElementById("delete-btn")';
                expect(checkForBlacklistedWords(code)).toEqual({ safe: true });
            });

            test('should allow word "drop" in variable names', () => {
                const code = 'const dropdown = document.getElementById("drop-down")';
                expect(checkForBlacklistedWords(code)).toEqual({ safe: true });
            });

            test('should allow "delete" in comments without "from"', () => {
                const code = '# This is a comment about delete functionality';
                expect(checkForBlacklistedWords(code)).toEqual({ safe: true });
            });

            test('should allow "format" in variable names', () => {
                const code = 'const dateFormat = "YYYY-MM-DD"';
                expect(checkForBlacklistedWords(code)).toEqual({ safe: true });
            });

            test('show allow "format" used in pandas datetime', () => {
                const code = 'pd.to_datetime("2024-01-01", format="%Y-%m-%d")';
                expect(checkForBlacklistedWords(code)).toEqual({ safe: true });
            });

            test('show allow "format" used in pandas datetime with a space', () => {
                const code = 'pd.to_datetime("2024-01-01", format = " %Y-%m-%d")';
                expect(checkForBlacklistedWords(code)).toEqual({ safe: true });
            });

            test('show allow "format" used in pandas datetime with parentheses', () => {
                const code = 'pd.to_datetime("2024-01-01", format = ( " %Y-%m-%d"))';
                expect(checkForBlacklistedWords(code)).toEqual({ safe: true });
            });
            
        });

        describe('whitespace handling', () => {
            test('should detect SQL commands even with extra spaces', () => {
                const code = 'DELETE    FROM    users';
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains an SQL DELETE command that could remove data from your database"
                });
            });
        });

        describe('multiple violations', () => {
            test('should detect first violation in code with multiple blacklisted words', () => {
                const code = `
                    rm -rf /some/path
                    DROP DATABASE myapp
                `;
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a command (rm -rf) that could recursively delete files and directories from your system"
                });
            });
        });

        describe('comments handling', () => {
            test('should handle code with comments containing blacklisted words', () => {
                const code = `
                    # This is a comment about rm -rf (not actually running it)
                    print("Hello, World!")
                `;
                expect(checkForBlacklistedWords(code)).toEqual({
                    safe: false,
                    reason: "This code contains a command (rm -rf) that could recursively delete files and directories from your system"
                });
            });
        });
    });
}); 