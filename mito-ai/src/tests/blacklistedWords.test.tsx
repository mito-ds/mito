import { checkForBlacklistedWords } from '../utils/blacklistedWords';

describe('checkForBlacklistedWords', () => {
    // Test safe code
    test('should return safe for normal Python code', () => {
        const safeCode = `
            import pandas as pd
            df = pd.DataFrame({'a': [1, 2, 3]})
            print(df.head())
        `;
        expect(checkForBlacklistedWords(safeCode)).toEqual({ safe: true });
    });

    // Test file deletion commands
    describe('file deletion commands', () => {
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

    // Test database operations
    describe('database operations', () => {
        test('should detect DELETE FROM command', () => {
            const code = 'DELETE FROM users WHERE id = 1';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains an SQL DELETE command that could remove data from your database"
            });
        });

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
    });

    // Test system commands
    describe('system commands', () => {
        test('should detect system() calls', () => {
            const code = 'system("some command")';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains a system() call that could execute arbitrary system commands, which is a security risk"
            });
        });
    });

    // Test format commands
    describe('format commands', () => {
        test('should detect format() calls', () => {
            const code = 'format(drive)';
            expect(checkForBlacklistedWords(code)).toEqual({
                safe: false,
                reason: "This code contains a format command that could potentially format your drives or storage devices"
            });
        });
    });

    // Test Node.js specific commands
    describe('Node.js commands', () => {
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

    // Test code with multiple violations
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

    // Test edge cases
    describe('edge cases', () => {
        test('should handle empty string', () => {
            expect(checkForBlacklistedWords('')).toEqual({ safe: true });
        });

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