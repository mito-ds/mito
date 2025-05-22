// Mock for global fetch
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ rules: ['Data Analysis', 'Visualization', 'Machine Learning'] }) }));
// Reset mock between tests
beforeEach(() => { global.fetch.mockClear(); });
