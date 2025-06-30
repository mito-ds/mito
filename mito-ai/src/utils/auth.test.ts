/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { 
    isUserAuthenticated, 
    getJWTToken, 
    setJWTToken, 
    removeJWTToken,
    _validate_jwt_token_logic 
} from './auth';

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

    test('should validate JWT token format', () => {
        // Valid JWT format (header.payload.signature)
        expect(_validate_jwt_token_logic('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')).toBe(true);
        
        // Invalid formats
        expect(_validate_jwt_token_logic('')).toBe(false);
        expect(_validate_jwt_token_logic('invalid-token')).toBe(false);
        expect(_validate_jwt_token_logic('header.payload')).toBe(false);
        expect(_validate_jwt_token_logic('header.payload.signature.extra')).toBe(false);
        expect(_validate_jwt_token_logic('placeholder-jwt-token')).toBe(false);
    });
}); 