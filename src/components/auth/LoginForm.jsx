import React, { useState } from 'react';

const LoginForm = ({ onLogin, onGoogleLogin, onMicrosoftLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (email) => {
        const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        return !personalDomains.includes(domain);
    };

    const handleWorkEmailLogin = async () => {
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please use your work or school email address, not a personal email.');
            return;
        }

        if (isLoading) return; // Prevent double-clicks

        setIsLoading(true);
        setError('');

        try {
            await onLogin({ email, loginHint: email });
        } catch (error) {
            setError('Authentication failed. Please check your email and try again.');
            setIsLoading(false);
        }
        // Don't set loading false on success - parent component handles navigation
    };

    const handleSocialLogin = async (provider) => {
        if (isLoading) return; // Prevent double-clicks

        setIsLoading(true);
        setError('');

        try {
            if (provider === 'google' && onGoogleLogin) {
                await onGoogleLogin();
            } else if (provider === 'microsoft' && onMicrosoftLogin) {
                await onMicrosoftLogin();
            }
        } catch (error) {
            setError(`${provider === 'google' ? 'Google' : 'Microsoft'} authentication failed. Please try again.`);
            setIsLoading(false);
        }
        // Don't set loading false on success - parent component handles navigation
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleWorkEmailLogin();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center font-['Outfit']">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ width: '920px', height: '600px' }}>
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-600 text-lg">Redirecting to secure authentication...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center font-['Outfit'] p-5">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative" style={{ width: '920px', height: '600px' }}>
                <div className="flex h-full">
                    {/* Left Panel - Logo Area */}
                    <div
                        className="flex-shrink-0 bg-gradient-to-br from-indigo-400 to-purple-500 relative overflow-hidden rounded-2xl flex items-center justify-center"
                        style={{
                            width: '400px',
                            height: '560px',
                            margin: '20px 0 20px 20px'
                        }}
                    >
                        <div className="text-center text-white">
                            <div className="text-5xl font-bold tracking-wider mb-2">INCAS</div>
                            {/* Custom background/logo will be added here */}
                        </div>
                    </div>

                    {/* Right Panel - Login Form */}
                    <div className="flex-1 flex flex-col justify-center" style={{ padding: '60px 80px' }}>
                        <div className="max-w-md w-full">
                            <h1 className="text-5xl font-semibold text-orange-500 mb-2 leading-tight">Welcome!</h1>
                            <h2 className="text-3xl font-medium text-slate-700 mb-10 leading-tight">INCAS Telemetrix</h2>

                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Email Input */}
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full p-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-slate-700 text-base mb-4 transition-all duration-300 focus:outline-none focus:border-orange-500 focus:bg-white"
                                autoComplete="email"
                                autoFocus
                            />

                            {/* Work Account Button */}
                            <button
                                onClick={handleWorkEmailLogin}
                                disabled={isLoading}
                                className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 text-white font-medium py-4 px-5 rounded-lg transition-all duration-300 text-base mb-8 hover:-translate-y-0.5"
                            >
                                Log in with work account
                            </button>

                            {/* Divider */}
                            <div className="relative text-center mb-5">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative bg-white px-4">
                                    <span className="text-gray-500 text-sm">or sign in with</span>
                                </div>
                            </div>

                            {/* Social Login Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSocialLogin('google')}
                                    disabled={isLoading}
                                    className="flex-1 border-2 border-gray-200 bg-white hover:border-blue-400 text-slate-700 font-medium py-3.5 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </button>

                                <button
                                    onClick={() => handleSocialLogin('microsoft')}
                                    disabled={isLoading}
                                    className="flex-1 border-2 border-gray-200 bg-white hover:border-blue-600 text-slate-700 font-medium py-3.5 px-5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#F25022" d="M11.4 11.4H0V0h11.4v11.4z" />
                                        <path fill="#00A4EF" d="M24 11.4H12.6V0H24v11.4z" />
                                        <path fill="#7FBA00" d="M11.4 24H0V12.6h11.4V24z" />
                                        <path fill="#FFB900" d="M24 24H12.6V12.6H24V24z" />
                                    </svg>
                                    Microsoft
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <p className="text-gray-400 text-sm text-center">www.incasautomation.com.au</p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;