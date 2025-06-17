// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'react-hooks'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // Prevent forgotten awaits
    '@typescript-eslint/no-floating-promises': 'error',
    // Enforce explicit function return types
    '@typescript-eslint/explicit-function-return-type': ['error',
      {
        // These options make the rule more practical in real-world use
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true
      }
    ],
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',
    // Other helpful TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow empty interfaces that extend types (useful for future extension)
    '@typescript-eslint/no-empty-interface': 'off',
    // CI uses a different name for the same rule
    '@typescript-eslint/no-empty-object-type': 'off',
    // Coding style
    'indent': 'off'
  }
};
