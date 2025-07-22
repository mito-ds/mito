/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
    isUserAuthenticated,
    getJWTToken,
    setJWTToken,
    removeJWTToken,
} from '../../Extensions/AppBuilder/auth';

// Mock document.cookie for testing
const mockCookie = {
    get: () => '',
    set: (value: string) => {
        mockCookie.get = () => value;
    },
    clear: () => {
        mockCookie.get = () => '';
    }
};

Object.defineProperty(document, 'cookie', {
    get: () => mockCookie.get(),
    set: (value: string) => mockCookie.set(value),
    configurable: true
});

describe('Authentication Utilities', () => {
    beforeEach(() => {
        mockCookie.clear();
    });

    test('should return false when no JWT token is present', () => {
        expect(isUserAuthenticated()).toBe(false);
    });

    test('should return true when JWT token is present', () => {
        setJWTToken('test-token');
        expect(isUserAuthenticated()).toBe(true);
    });

    test('should get JWT token from cookies', () => {
        setJWTToken('test-token');
        expect(getJWTToken()).toBe('test-token');
    });

    test('should remove JWT token from cookies', () => {
        setJWTToken('test-token');
        expect(getJWTToken()).toBe('test-token');

        removeJWTToken();
        expect(getJWTToken()).toBeNull();
    });
});