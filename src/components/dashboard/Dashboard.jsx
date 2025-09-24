import React, { useState, useEffect } from 'react';

const Dashboard = ({ user, onLogout, getAccessToken }) => {
    const [machineData, setMachineData] = useState({});
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = 'https://incas-functions-dev-b8djeyakc7d0hwa3.australiasoutheast-01.azurewebsites.net/api';

    useEffect(() => {
        if (user && getAccessToken) {
            // Initial data fetch
            fetchMachineData();

            // Set up polling every 13 seconds
            const interval = setInterval(fetchMachineData, 5000);

            // Cleanup interval on unmount
            return () => clearInterval(interval);
        }
    }, [user, getAccessToken]);

    const fetchMachineData = async () => {
        if (!getAccessToken) {
            setError('Authentication system not available');
            setLoading(false);
            return;
        }

        try {
            // Get fresh access token
            const accessToken = await getAccessToken();

            const response = await fetch(`${API_BASE}/GetCurrentStatus`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMachineData(data);
                setLastUpdate(new Date().toLocaleTimeString());
                setError(null);

                // Log customer info if available (for debugging)
                if (data.customerInfo) {
                    console.log('Customer:', data.customerInfo.customerName, '| User:', data.customerInfo.userName);
                }
            } else if (response.status === 401) {
                // Token expired or invalid - force logout
                setError('Session expired. Please sign in again.');
                setTimeout(() => onLogout(), 2000);
                return;
            } else {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            console.error('Fetch error:', err);

            if (err.message.includes('Session expired')) {
                // Authentication error - trigger logout
                onLogout();
                return;
            }

            setError(`Failed to fetch data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        onLogout();
    };

    // Loading state
    if (loading && !machineData.bagCount) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center font-['Outfit']">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    // No user check (shouldn't happen but defensive)
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center font-['Outfit']">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
                    <p className="text-white mb-4">Authentication error</p>
                    <button
                        onClick={handleLogout}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    // Calculate efficiency
    const optimalBagsPerMinute = 24;
    const currentEfficiency = machineData.machineState === 'RUNNING'
        ? Math.min((machineData.bagsPerMinute / optimalBagsPerMinute) * 100, 100)
        : 0;

    const getStatusColor = (state) => {
        switch (state?.toLowerCase()) {
            case 'running':
            case 'operational':
                return 'text-green-400';
            case 'paused':
                return 'text-yellow-400';
            case 'stopped':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusDot = (state) => {
        switch (state?.toLowerCase()) {
            case 'running':
            case 'operational':
                return 'bg-green-400';
            case 'paused':
                return 'bg-yellow-400';
            case 'stopped':
                return 'bg-red-400';
            default:
                return 'bg-gray-400';
        }
    };

    // Display customer name if available
    const displayName = machineData.customerInfo?.customerName || 'Production Dashboard';
    const userName = machineData.customerInfo?.userName || user.name;
    const userEmail = machineData.customerInfo?.userEmail || user.username;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-['Outfit']">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">INCAS Telemetrix</h1>
                        <p className="text-white/70 text-sm">{displayName}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-white font-medium">{userName}</div>
                            <div className="text-white/70 text-sm">{userEmail}</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition duration-200"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Status Bar */}
                <div className="mb-8">
                    {lastUpdate && (
                        <p className="text-white/70 text-sm">Last updated: {lastUpdate}</p>
                    )}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg mt-2">
                            {error}
                        </div>
                    )}
                </div>

                {/* Machine Card */}
                <div className="grid gap-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                        {/* Machine Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {machineData.deviceId || 'CV3080P'} - Bagging & Conveyor
                            </h2>
                            <p className="text-white/70">Max: 24 bags/min • Shift Target: 14,400 bags</p>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {/* Efficiency Gauge */}
                            <div className="bg-white/5 rounded-xl p-6 text-center">
                                <div className="text-4xl font-bold text-white mb-2">
                                    {Math.round(currentEfficiency)}%
                                </div>
                                <div className="text-white/70 text-sm">Efficiency</div>
                                <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                                    <div
                                        className="bg-green-400 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${currentEfficiency}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Total Bags */}
                            <div className="bg-white/5 rounded-xl p-6 text-center">
                                <div className="text-4xl font-bold text-white mb-2">
                                    {machineData.bagCount?.toLocaleString() || '0'}
                                </div>
                                <div className="text-white/70 text-sm">Total Bags</div>
                            </div>

                            {/* Current Rate */}
                            <div className="bg-white/5 rounded-xl p-6 text-center">
                                <div className="text-4xl font-bold text-white mb-2">
                                    {machineData.bagsPerMinute || '0'}
                                </div>
                                <div className="text-white/70 text-sm">Bags/Min</div>
                            </div>

                            {/* Uptime */}
                            <div className="bg-white/5 rounded-xl p-6 text-center">
                                <div className="text-4xl font-bold text-white mb-2">
                                    {machineData.uptimePercentage || '0'}%
                                </div>
                                <div className="text-white/70 text-sm">Uptime</div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex justify-center">
                            <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full">
                                <div className={`w-3 h-3 rounded-full ${getStatusDot(machineData.machineState || machineData.status)} animate-pulse`}></div>
                                <span className={`font-medium ${getStatusColor(machineData.machineState || machineData.status)}`}>
                                    {(machineData.machineState || machineData.status || 'Unknown').charAt(0).toUpperCase() +
                                        (machineData.machineState || machineData.status || 'unknown').slice(1).toLowerCase()}
                                </span>
                            </div>
                        </div>

                        {/* Debug Info (only in development) */}
                        {process.env.NODE_ENV === 'development' && machineData.debug && (
                            <div className="mt-6 bg-white/5 rounded-xl p-4">
                                <details className="text-white/70">
                                    <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
                                    <pre className="mt-2 text-xs overflow-auto">
                                        {JSON.stringify(machineData.debug, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
