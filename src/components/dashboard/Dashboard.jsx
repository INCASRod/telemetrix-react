import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Play, Pause, Square, LogOut, BarChart3, Settings, FileText, HeadphonesIcon } from 'lucide-react';

const Dashboard = ({ user, onLogout, getAccessToken }) => {
    // Machine data from Azure APIs
    const [machineData, setMachineData] = useState({});
    const [historicalData, setHistoricalData] = useState([]);
    const [productionHistory, setProductionHistory] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // UI state derived from real data
    const [shiftTime, setShiftTime] = useState(0);

    const API_BASE = 'https://incas-functions-dev-b8djeyakc7d0hwa3.australiasoutheast-01.azurewebsites.net/api';

    // Fetch current telemetry data
    const fetchMachineData = async () => {
        if (!getAccessToken) return;

        try {
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

                // Update production history for live chart
                if (data.bagsPerMinute) {
                    setProductionHistory(prev => {
                        const newHistory = [...prev, data.bagsPerMinute];
                        return newHistory.slice(-20); // Keep last 20 data points
                    });
                }

            } else if (response.status === 401) {
                setError('Session expired. Please sign in again.');
                setTimeout(() => onLogout(), 2000);
                return;
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(`Failed to fetch data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch historical data for weekly trends
    const fetchHistoricalData = async () => {
        if (!getAccessToken) return;

        try {
            const accessToken = await getAccessToken();

            const response = await fetch(`${API_BASE}/GetHistoricalData?hours=168`, { // 7 days = 168 hours
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Process historical data into daily summaries
                const processedData = processHistoricalDataForChart(data.data || []);
                setHistoricalData(processedData);
            }
        } catch (err) {
            console.error('Historical data fetch error:', err);
        }
    };

    // Process historical data into daily summaries for the chart
    const processHistoricalDataForChart = (rawData) => {
        if (!rawData || rawData.length === 0) {
            // Return mock data if no historical data available
            return [
                { day: 'Mon', expected: 14400, actual: 12500 },
                { day: 'Tue', expected: 14400, actual: 15200 },
                { day: 'Wed', expected: 14400, actual: 13800 },
                { day: 'Thu', expected: 14400, actual: 16100 },
                { day: 'Fri', expected: 14400, actual: 14800 },
                { day: 'Sat', expected: 14400, actual: 11200 },
                { day: 'Sun', expected: 14400, actual: 13600 }
            ];
        }

        // Group data by day and calculate daily totals
        const dailyData = {};
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        rawData.forEach(item => {
            const date = new Date(item.timestamp);
            const dayName = days[date.getDay()];

            if (!dailyData[dayName]) {
                dailyData[dayName] = { day: dayName, expected: 14400, actual: 0, count: 0 };
            }
            dailyData[dayName].actual = Math.max(dailyData[dayName].actual, item.bagCount || 0);
        });

        // Return last 7 days
        return days.slice(-7).map(day => dailyData[day] || { day, expected: 14400, actual: 0 });
    };

    // Initialize data fetch
    useEffect(() => {
        if (user && getAccessToken) {
            fetchMachineData();
            fetchHistoricalData();

            // Set up polling for real-time data
            const interval = setInterval(fetchMachineData, 13000); // Every 13 seconds
            return () => clearInterval(interval);
        }
    }, [user, getAccessToken]);

    // Simulate shift time based on machine running state
    useEffect(() => {
        if (machineData.machineState === 'RUNNING') {
            const interval = setInterval(() => {
                setShiftTime(prev => Math.min(prev + 1, 600)); // max 10 hours
            }, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [machineData.machineState]);

    // Helper functions
    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
    };

    const getMachineStatus = () => {
        if (!machineData.machineState) return 'stopped';

        switch (machineData.machineState.toLowerCase()) {
            case 'running':
            case 'operational':
                return 'running';
            case 'stopped':
            case 'offline':
                return 'stopped';
            default:
                return 'paused';
        }
    };

    const getProductionStatus = () => {
        const rate = machineData.bagsPerMinute || 0;
        if (rate >= 24) return { status: 'Optimal', color: 'text-green-500' };
        if (rate >= 20) return { status: 'OK', color: 'text-orange-500' };
        return { status: 'Below Optimal', color: 'text-red-500' };
    };

    const currentStatus = getMachineStatus();
    const currentOutput = machineData.bagsPerMinute || 0;
    const totalBags = machineData.bagCount || 0;
    const customerName = machineData.customerInfo?.customerName || machineData.customerName || 'INCAS Telemetrix';
    const userName = machineData.customerInfo?.userName || user?.name || 'User';

    // Loading state
    if (loading && !machineData.bagCount) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-sm flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">TELEMETRIX</h1>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="p-4 border-b bg-gray-50">
                    <div className="text-sm text-gray-600">Welcome back</div>
                    <div className="font-medium text-gray-900">{userName}</div>
                    <div className="text-xs text-gray-500">{customerName}</div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <div className="space-y-2">
                        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600">
                            <BarChart3 className="w-5 h-5" />
                            <span className="font-medium">Dashboard</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                            <BarChart3 className="w-5 h-5" />
                            <span>Analytics</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                            <FileText className="w-5 h-5" />
                            <span>Reports</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                            <HeadphonesIcon className="w-5 h-5" />
                            <span>Support</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </a>
                    </div>
                </nav>

                {/* Status */}
                {lastUpdate && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="text-xs text-gray-500 mb-1">Last updated</div>
                        <div className="text-sm text-gray-900">{lastUpdate}</div>
                    </div>
                )}

                {/* Logout */}
                <div className="p-4">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-8">

                        {/* Left Column - Machine Status */}
                        <div className="col-span-2">
                            <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ height: '360px' }}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {machineData.deviceId || 'B&C CV3080P'}
                                        </h2>
                                        <p className="text-gray-500">Form Fill Bagging Machine</p>
                                    </div>

                                    {/* Status Indicators */}
                                    <div className="flex space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${currentStatus === 'running' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-sm text-gray-600">Running</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${currentStatus === 'paused' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-sm text-gray-600">Paused</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${currentStatus === 'stopped' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-sm text-gray-600">Stopped</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bars */}
                                <div className="space-y-6">
                                    {/* Shift Time */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-700 font-medium">Total Shift Time: {formatTime(shiftTime)}</span>
                                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                {Math.round((shiftTime / 600) * 100)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${(shiftTime / 600) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Total Bags */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-700 font-medium">Total Bags: {totalBags.toLocaleString()}</span>
                                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                {Math.round((totalBags / 14400) * 100)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((totalBags / 14400) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Production Bar */}
                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-700 font-medium">Production</span>
                                        <span className={`font-medium ${getProductionStatus().color}`}>
                                            {getProductionStatus().status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                        {currentOutput.toFixed(1)} bags/min (Target: 24 bags/min)
                                    </div>

                                    {/* Live Production Bar */}
                                    <div className="h-16 bg-gray-100 rounded-lg overflow-hidden relative">
                                        <div className="flex h-full items-end space-x-1 px-2">
                                            {productionHistory.slice(-20).map((value, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex-1 rounded-t transition-all duration-300 ${value >= 24 ? 'bg-green-500' : value >= 20 ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ height: `${(value / 30) * 100}%` }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Display (Read-only) */}
                                <div className="flex space-x-4 mt-6">
                                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentStatus === 'running' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        <Play className="w-4 h-4" />
                                        <span>Running</span>
                                    </div>
                                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentStatus === 'paused' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        <Pause className="w-4 h-4" />
                                        <span>Paused</span>
                                    </div>
                                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentStatus === 'stopped' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        <Square className="w-4 h-4" />
                                        <span>Stopped</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Weekly Trends */}
                        <div className="col-span-1">
                            <div className="bg-gray-800 text-white rounded-2xl p-6 shadow-sm" style={{ height: '360px' }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold">Weekly Trends</h3>
                                    <div className="flex space-x-4 text-xs">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-0.5 bg-orange-500 rounded"></div>
                                            <span className="text-orange-400">Expected Target</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-0.5 bg-blue-400 rounded"></div>
                                            <span className="text-blue-400">Actual</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ height: '260px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historicalData}>
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                                domain={[0, 'dataMax + 2000']}
                                                tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="expected"
                                                stroke="#F59E0B"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#60A5FA"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#60A5FA' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;