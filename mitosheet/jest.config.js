module.exports = {
    roots: ["<rootDir>/src"],
    transform: {
        // Jest transformations -- this adds support for TypeScript
        // using ts-jest
        "^.+\\.tsx?$": "ts-jest",
        // This supports css imports as well
        ".*\.(css|styl|less|sass|scss)$": "jest-css-modules-transform"
    },

    // Test spec file resolution pattern
    // Matches parent folder `__tests__` and filename
    // should contain `test` or `spec`.
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",

    // Module file extensions for importing
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", 'css']
};