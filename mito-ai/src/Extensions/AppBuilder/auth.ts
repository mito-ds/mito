/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { requestAPI } from '../../restAPI/utils';


const domain_dev = 'https://mito-app-auth.auth.us-east-1.amazoncognito.com'
const client_id = '6ara3u3l8sss738hrhbq1qtiqf'

// Change this to domain_dev for dev deployments
const active_domain = domain_dev

const currentUrl: string = window.location.href;
let redirectUrl: string;

// As of now we only support localhost:8888 because we have only allowed this redirect url on AWS conito
// We can modify the redirect to include other ports in the future
if (currentUrl.includes('localhost')) {
    redirectUrl = 'http://localhost:8888/lab';
} else if (currentUrl.includes('trymito')) {
    redirectUrl = 'https://launch.trymito.io';
} else {
    redirectUrl = currentUrl;
}
console.log("currentUrl: ", currentUrl)

// AWS Cognito configuration
const COGNITO_CONFIG = {
    SIGNUP_URL: `${active_domain}/signup?client_id=${client_id}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUrl}`,
    SIGNIN_URL: `${active_domain}/login?client_id=${client_id}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUrl}`,
    JWT_COOKIE_NAME: 'mito-auth-token',
    JWT_COOKIE_EXPIRY_HOURS: 1
};

/**
 * Check if user is authenticated by looking for JWT token in cookies
 */
export const isUserAuthenticated = (): boolean => {
    const token = getJWTToken();
    return token !== null && token !== undefined && token !== '';
};

/**
 * Get JWT token from cookies
 */
export const getJWTToken = (): string | null => {
    const cookies = document.cookie.split(';');
    const jwtCookie = cookies.find(cookie => cookie.trim().startsWith(`${COGNITO_CONFIG.JWT_COOKIE_NAME}=`));
    if (jwtCookie) {
        const token = jwtCookie.split('=')[1];
        return token || null;
    }
    return null;
};

/**
 * Set JWT token as a cookie
 */
export const setJWTToken = (token: string): void => {
    const date = new Date();
    date.setTime(date.getTime() + (COGNITO_CONFIG.JWT_COOKIE_EXPIRY_HOURS * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    
    // Set cookie for all subdomains of trymito.io (production)
    document.cookie = `${COGNITO_CONFIG.JWT_COOKIE_NAME}=${token}; ${expires}; path=/; domain=.trymito.io; SameSite=Lax; Secure`;
    
    // For localhost development
    if (window.location.hostname === 'localhost') {
        document.cookie = `${COGNITO_CONFIG.JWT_COOKIE_NAME}=${token}; ${expires}; path=/`;
    }
};

/**
 * Remove JWT token from cookies
 */
export const removeJWTToken = (): void => {
    // Delete for current domain
    document.cookie = `${COGNITO_CONFIG.JWT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Delete for all subdomains
    document.cookie = `${COGNITO_CONFIG.JWT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.trymito.io;`;
};

/**
 * Exchange authorization code for JWT tokens
 */
export const exchangeCodeForTokens = async (code: string): Promise<boolean> => {
    try {
        const response = await requestAPI('auth/token', {
            method: 'POST',
            body: JSON.stringify({ code })
        });

        if (response.error) {
            console.error('Failed to exchange code for tokens:', response.error);
            return false;
        }

        if (response.data) {
            const data = response.data as { access_token?: string; id_token?: string };
            const { access_token } = data;
            // Store the access token as the JWT token
            if (access_token) {
                setJWTToken(access_token);
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        return false;
    }
};

/**
 * Redirect user to AWS Cognito signup page
 */
export const redirectToSignup = (): void => {
    window.location.href = COGNITO_CONFIG.SIGNUP_URL;
};

/**
 * Redirect user to AWS Cognito signin page
 */
export const redirectToSignin = (): void => {
    window.location.href = COGNITO_CONFIG.SIGNIN_URL;
};

/**
 * Handle authentication check and redirect if needed
 * Returns true if user is authenticated, false if redirected
 */
export const checkAuthenticationAndRedirect = async (): Promise<boolean> => {
    if (!isUserAuthenticated()) {
        // Check if there's a code parameter in the URL (indicating return from Cognito)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // User has returned from Cognito with authorization code
            console.log('Received authorization code from Cognito:', code);
            
            // Exchange the code for JWT tokens
            const success = await exchangeCodeForTokens(code);
            
            if (success) {
                // Clean up URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
                return true;
            } else {
                // Failed to exchange code, redirect to signup
                redirectToSignup();
                return false;
            }
        } else {
            // No token and no code, redirect to signup
            redirectToSignup();
            return false;
        }
    }
    
    return true;
};

/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
    const token = getJWTToken();
    if (token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }
    return {};
}; 