import React, { useState, useEffect } from 'react';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [msalInstance, setMsalInstance] = useState(null);

    useEffect(() => {
        // Initialize MSAL
        const initMSAL = async () => {
            if (window.msal) {
                const msalConfig = {
                    auth: {
                        clientId: "758ff3e9-e6bd-4838-90d0-50cf3ec88387",
                        authority: "https://login.microsoftonline.com/organizations",
                        redirectUri: window.location.origin
                    },
                    cache: {
                        cacheLocation: "sessionStorage",
                        storeAuthStateInCookie: true
                    }
                };

                const pca = new window.msal.PublicClientApplication(msalConfig);
                await pca.initialize();
                setMsalInstance(pca);
            }
        };

        initMSAL();
    }, []);

    const handleEmailPasswordLogin = async () => {
        setIsLoading(true);
        setError('');

        try {
            if (!msalInstance) {
                throw new Error('Authentication system not initialized');
            }

            const loginRequest = {
                scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"],
                prompt: 'login',
                loginHint: email
            };

            const response = await msalInstance.loginPopup(loginRequest);

            if (response) {
                window.location.href = "https://incasrod.github.io/telemetrix/dashboard.html";
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please check your credentials and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicrosoftLogin = async () => {
        setIsLoading(true);
        setError('');

        try {
            if (!msalInstance) {
                throw new Error('Authentication system not initialized');
            }

            const loginRequest = {
                scopes: ["758ff3e9-e6bd-4838-90d0-50cf3ec88387/.default"],
                prompt: 'select_account'
            };

            const response = await msalInstance.loginPopup(loginRequest);

            if (response) {
                window.location.href = "https://incasrod.github.io/telemetrix/dashboard.html";
            }
        } catch (error) {
            console.error('Microsoft login error:', error);
            setError('Microsoft login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setError('Google login is not yet configured. Please use Microsoft login or contact support.');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center font-outfit">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ width: '920px', height: '600px' }}>
                <div className="flex h-full">
                    {/* Left container - Logo area */}
                    <div className="flex-shrink-0 bg-gradient-to-br from-teal-200 via-blue-200 to-orange-200 relative overflow-hidden" style={{ width: '400px', height: '560px', margin: '20px 0 20px 20px', borderRadius: '16px' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/70 via-blue-300/70 to-orange-300/70"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white text-2xl font-bold opacity-30">
                                INCAS Logo
                            </div>
                        </div>
                    </div>

                    {/* Right container - Login form */}
                    <div className="flex-1 p-12 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full">
                            <h1 className="text-5xl font-bold text-red-800 mb-2">Welcome!</h1>
                            <h2 className="text-2xl font-semibold text-gray-700 mb-8">INCAS Telemetrix</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        placeholder="Work Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500"
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    onClick={handleEmailPasswordLogin}
                                    disabled={isLoading || !email}
                                    className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 mt-6"
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </div>

                            <div className="flex items-center my-6">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="px-4 text-gray-500 text-sm">or sign in with</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleMicrosoftLogin}
                                    disabled={isLoading}
                                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition duration-200"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#00A4EF" d="M0 0h11.377v11.372H0z" />
                                        <path fill="#FFB900" d="M12.623 0H24v11.372H12.623z" />
                                        <path fill="#00A4EF" d="M0 12.628h11.377V24H0z" />
                                        <path fill="#00A4EF" d="M12.623 12.628H24V24H12.623z" />
                                    </svg>
                                    <span className="text-gray-700 font-medium">Microsoft</span>
                                </button>

                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition duration-200"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="text-gray-700 font-medium">Google</span>
                                </button>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Use your work email for secure access to your telemetry data
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;