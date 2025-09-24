import React, { useState, useEffect } from 'react';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';

function App() {
    const [currentView, setCurrentView] = useState('loading');
    const [user, setUser] = useState(null);
    const [msalInstance, setMsalInstance] = useState(null);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            // Load MSAL if not already loaded
            if (!window.msal) {
                const script = document.createElement('script');
                script.src = 'https://alcdn.msauth.net/browser/2.32.2/js/msal-browser.min.js';
                script.onload = () => setTimeout(setupMSAL, 100);
                document.head.appendChild(script);
            } else {
                setupMSAL();
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            setCurrentView('login');
        }
    };

    const setupMSAL = async () => {
        // Determine the correct redirect URI based on environment
        const getRedirectUri = () => {
            const origin = window.location.origin;
            console.log('Current origin:', origin);

            // For development
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return origin;
            }
            // For GitHub Pages
            if (origin.includes('github.io')) {
                return origin;
            }
            // Default fallback
            return origin;
        };

        const redirectUri = getRedirectUri();
        console.log('Using redirect URI:', redirectUri);

        const msalConfig = {
            auth: {
                clientId: "758ff3e9-e6bd-4838-90d0-50cf3ec88387",
                authority: "https://login.microsoftonline.com/common",
                redirectUri: redirectUri,
                postLogoutRedirectUri: redirectUri
            },
            cache: {
                cacheLocation: "sessionStorage",
                storeAuthStateInCookie: false
            },
            system: {
                allowNativeBroker: false,
                windowHashTimeout: 15000,
                iframeHashTimeout: 15000,
                loadFrameTimeout: 15000,
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (containsPii) return;
                        console.log(`MSAL [${level}]: ${message}`);
                    },
                    piiLoggingEnabled: false,
                    logLevel: 'Info'
                }
            }
        };

        const msal = new window.msal.PublicClientApplication(msalConfig);

        // Initialize MSAL instance
        await msal.initialize();

        setMsalInstance(msal);

        try {
            const response = await msal.handleRedirectPromise();

            let authenticatedUser = null;
            if (response) {
                authenticatedUser = response.account;
            } else {
                const accounts = msal.getAllAccounts();
                if (accounts.length > 0) {
                    authenticatedUser = accounts[0];
                }
            }

            // Check for intentional logout
            const intentionalLogout = sessionStorage.getItem('intentionalLogout');
            if (intentionalLogout) {
                sessionStorage.removeItem('intentionalLogout');
                setUser(null);
                setCurrentView('login');
                return;
            }

            if (authenticatedUser) {
                setUser(authenticatedUser);
                setCurrentView('dashboard');
            } else {
                setCurrentView('login');
            }

        } catch (error) {
            console.error('MSAL setup error:', error);
            setCurrentView('login');
        }
    };

    // Work email authentication with domain hint
    const handleWorkEmailLogin = async ({ email, loginHint }) => {
        if (!msalInstance) {
            console.error('MSAL instance not initialized');
            throw new Error('Authentication system not ready');
        }

        try {
            // Clear any previous interaction status
            sessionStorage.removeItem('msal.interaction.status');

            const domain = email.split('@')[1];

            const loginRequest = {
                scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"], // Use your constants.js scope
                loginHint: loginHint,
                domainHint: domain,
                prompt: 'select_account'
            };

            console.log('Work email login request:', loginRequest);
            const response = await msalInstance.loginPopup(loginRequest);

            if (response && response.account) {
                console.log('Work email login successful:', response.account);
                setUser(response.account);
                setCurrentView('dashboard');
            }

        } catch (error) {
            console.error('Work email login error:', error);
            // Clear any stuck interaction status
            sessionStorage.removeItem('msal.interaction.status');

            if (error.errorCode === 'user_cancelled') {
                throw new Error('Login was cancelled. Please try again.');
            } else if (error.errorCode === 'popup_window_error') {
                throw new Error('Popup was blocked. Please allow popups and try again.');
            }
            throw error;
        }
    };

    // Google authentication (requires Google federation setup in B2B)
    const handleGoogleLogin = async () => {
        if (!msalInstance) {
            console.error('MSAL instance not initialized');
            throw new Error('Authentication system not ready');
        }

        try {
            // Clear any previous interaction status
            sessionStorage.removeItem('msal.interaction.status');

            const loginRequest = {
                scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"],
                extraQueryParameters: {
                    domain_hint: "google.com"
                },
                prompt: 'select_account'
            };

            console.log('Google login request:', loginRequest);
            const response = await msalInstance.loginPopup(loginRequest);

            if (response && response.account) {
                console.log('Google login successful:', response.account);
                setUser(response.account);
                setCurrentView('dashboard');
            }

        } catch (error) {
            console.error('Google login error:', error);
            // Clear any stuck interaction status
            sessionStorage.removeItem('msal.interaction.status');

            if (error.errorCode === 'user_cancelled') {
                throw new Error('Login was cancelled. Please try again.');
            } else if (error.errorCode === 'popup_window_error') {
                throw new Error('Popup was blocked. Please allow popups and try again.');
            } else if (error.message && error.message.includes('AADB2C90273')) {
                throw new Error('Google sign-in requires additional setup. Please use your work account or Microsoft account.');
            }
            throw error;
        }
    };

    // Microsoft authentication (standard)
    const handleMicrosoftLogin = async () => {
        if (!msalInstance) {
            console.error('MSAL instance not initialized');
            throw new Error('Authentication system not ready');
        }

        try {
            // Clear any previous interaction status
            sessionStorage.removeItem('msal.interaction.status');

            const loginRequest = {
                scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"],
                prompt: 'select_account'
            };

            console.log('Microsoft login request:', loginRequest);
            console.log('MSAL redirect URI from config:', msalInstance.getConfiguration().auth.redirectUri);

            const response = await msalInstance.loginPopup(loginRequest);

            if (response && response.account) {
                console.log('Microsoft login successful:', response.account);
                setUser(response.account);
                setCurrentView('dashboard');
            }

        } catch (error) {
            console.error('Microsoft login error:', error);
            // Clear any stuck interaction status
            sessionStorage.removeItem('msal.interaction.status');

            // Provide more specific error messages
            if (error.errorCode === 'user_cancelled') {
                throw new Error('Login was cancelled. Please try again.');
            } else if (error.errorCode === 'popup_window_error') {
                throw new Error('Popup was blocked. Please allow popups and try again.');
            }
            throw error;
        }
    };

    const handleLogout = () => {
        console.log('Logout initiated');

        // Set intentional logout flag
        sessionStorage.setItem('intentionalLogout', 'true');

        if (msalInstance) {
            try {
                // Clear MSAL accounts
                msalInstance.setActiveAccount(null);
                const accounts = msalInstance.getAllAccounts();
                accounts.forEach(account => {
                    msalInstance.removeAccount(account);
                });
                console.log('MSAL accounts cleared');
            } catch (error) {
                console.error('Error clearing MSAL accounts:', error);
            }
        }

        // Clear all storage including MSAL interaction status
        sessionStorage.clear();
        localStorage.clear();

        // Force clear any stuck MSAL states
        sessionStorage.removeItem('msal.interaction.status');

        // Reset state immediately
        setUser(null);
        setCurrentView('login');

        console.log('Logout completed, redirecting to login');

        // Force a small delay to ensure state update is processed
        setTimeout(() => {
            if (window.location.hash) {
                window.location.hash = '';
            }
        }, 100);
    };

    // Get access token for API calls
    const getAccessToken = async () => {
        if (!msalInstance || !user) {
            throw new Error('User not authenticated');
        }

        try {
            const tokenRequest = {
                scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"], // Use your constants.js scope
                account: user
            };

            const response = await msalInstance.acquireTokenSilent(tokenRequest);
            return response.accessToken;
        } catch (error) {
            // Token expired, try popup
            try {
                const tokenRequest = {
                    scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"],
                    account: user
                };
                const response = await msalInstance.acquireTokenPopup(tokenRequest);
                return response.accessToken;
            } catch (popupError) {
                console.error('Token acquisition failed:', popupError);
                // Force re-login
                handleLogout();
                throw new Error('Session expired. Please sign in again.');
            }
        }
    };

    if (currentView === 'loading') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-['Outfit']">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading authentication system...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'dashboard' && user) {
        return (
            <Dashboard
                user={user}
                onLogout={handleLogout}
                getAccessToken={getAccessToken}
            />
        );
    }

    return (
        <LoginForm
            onLogin={handleWorkEmailLogin}
            onGoogleLogin={handleGoogleLogin}
            onMicrosoftLogin={handleMicrosoftLogin}
        />
    );
}

export default App;