import React, { useState, useEffect } from 'react';
import GaugeComponent from 'react-gauge-component';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ user, token, onLogout }) => {
    const [telemetryData, setTelemetryData] = useState({
        bagCount: 0,
        machineState: 'STOPPED',
        currentRate: 0,
        shiftTime: 0
    });

    const [weeklyData, setWeeklyData] = useState([
        { day: 'Mon', expected: 14400, actual: 13200 },
        { day: 'Tue', expected: 14400, actual: 14100 },
        { day: 'Wed', expected: 14400, actual: 13800 },
        { day: 'Thu', expected: 14400, actual: 14200 },
        { day: 'Fri', expected: 14400, actual: 13900 },
        { day: 'Sat', expected: 14400, actual: 14000 },
        { day: 'Sun', expected: 14400, actual: 13500 }
    ]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Constants for B&C 4080DN specifications
    const TARGET_BAGS_PER_SHIFT = 14400; // 24 bags/min * 600 minutes (10 hours)
    const OPTIMAL_RATE = 24; // bags per minute
    const MAX_SHIFT_TIME = 600; // 10 hours in minutes

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/GetCurrentStatus`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        onLogout();
                        return;
                    }
                    throw new Error('Failed to fetch telemetry data');
                }

                const data = await response.json();
                setTelemetryData({
                    bagCount: data.bagCount || 0,
                    machineState: data.machineState || 'STOPPED',
                    currentRate: data.currentRate || 0,
                    shiftTime: data.shiftTime || 0
                });

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token, onLogout]);

    // Calculate percentages for progress bars
    const bagsProgress = Math.min((telemetryData.bagCount / TARGET_BAGS_PER_SHIFT) * 100, 100);
    const timeProgress = Math.min((telemetryData.shiftTime / MAX_SHIFT_TIME) * 100, 100);

    // Calculate gauge value (0-100) based on current rate vs optimal rate
    const gaugeValue = Math.min((telemetryData.currentRate / OPTIMAL_RATE) * 100, 100);

    const getStatusColor = () => {
        if (telemetryData.machineState === 'RUNNING' && telemetryData.currentRate >= OPTIMAL_RATE) return '#5BE12C';
        if (telemetryData.machineState === 'RUNNING' && telemetryData.currentRate >= 20) return '#F5CD19';
        return '#EA4228';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Production Dashboard
                        </h1>
                        <p className="text-gray-600">B&C 4080DN - WISE-4050 Telemetry</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Welcome back</p>
                            <p className="font-medium">{user?.name || 'User'}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-6">
                {/* Status Indicators */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${telemetryData.machineState === 'RUNNING' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">Machine: {telemetryData.machineState}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: getStatusColor() }}></div>
                        <span className="text-sm font-medium">Rate: {telemetryData.currentRate} bags/min</span>
                    </div>
                </div>

                {/* Main Content - Responsive Flex Grid */}
                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    {/* Left Card - Production Metrics */}
                    <div className="bg-white rounded-lg shadow-sm p-6 flex-1" style={{ width: 'auto' }}>
                        <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Current Shift Progress
                        </h2>

                        <div className="space-y-6">
                            {/* Total Bags Progress */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Total Bags</span>
                                    <span className="text-sm text-gray-600">
                                        {telemetryData.bagCount.toLocaleString()} / {TARGET_BAGS_PER_SHIFT.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${bagsProgress}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {bagsProgress.toFixed(1)}% Complete
                                </div>
                            </div>

                            {/* Shift Time Progress */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Shift Time</span>
                                    <span className="text-sm text-gray-600">
                                        {Math.floor(telemetryData.shiftTime / 60)}h {telemetryData.shiftTime % 60}m / 10h
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-green-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${timeProgress}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {timeProgress.toFixed(1)}% Complete
                                </div>
                            </div>

                            {/* Production Rate Gauge */}
                            <div>
                                <h3 className="text-lg font-medium mb-4 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Production Efficiency
                                </h3>
                                <div className="flex justify-center">
                                    <GaugeComponent
                                        type="semicircle"
                                        arc={{
                                            colorArray: ['#EA4228', '#F5CD19', '#5BE12C'],
                                            padding: 0.02,
                                            subArcs: [
                                                {
                                                    limit: 50,
                                                    color: '#EA4228',
                                                    showTick: true,
                                                    tooltip: { text: 'Below Optimal - Need Attention' }
                                                },
                                                {
                                                    limit: 80,
                                                    color: '#F5CD19',
                                                    showTick: true,
                                                    tooltip: { text: 'Acceptable Rate' }
                                                },
                                                {
                                                    color: '#5BE12C',
                                                    showTick: true,
                                                    tooltip: { text: 'Optimal Bag Processing!' }
                                                }
                                            ]
                                        }}
                                        pointer={{
                                            type: "blob",
                                            elastic: true,
                                            animationDelay: 0,
                                            animationDuration: 2000,
                                            color: gaugeValue >= 80 ? '#5BE12C' : '#EA4228'
                                        }}
                                        labels={{
                                            valueLabel: {
                                                formatTextValue: value => `${value.toFixed(1)}%`,
                                                style: {
                                                    fontSize: '24px',
                                                    fontWeight: 'bold',
                                                    fontFamily: 'Outfit, sans-serif'
                                                }
                                            },
                                            tickLabels: {
                                                type: 'outer',
                                                defaultTickValueConfig: {
                                                    formatTextValue: value => `${value}%`,
                                                    style: { fontSize: '12px' }
                                                }
                                            }
                                        }}
                                        value={gaugeValue}
                                        minValue={0}
                                        maxValue={100}
                                    />
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-sm text-gray-600">
                                        Current Rate: <span className="font-medium">{telemetryData.currentRate} bags/min</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Target: {OPTIMAL_RATE} bags/min
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Card - Weekly Trends */}
                    <div className="bg-white rounded-lg shadow-sm p-6 flex-1" style={{ width: 'auto' }}>
                        <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Weekly Production Trends
                        </h2>

                        <div className="h-64 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 12 }}
                                        style={{ fontFamily: 'Outfit, sans-serif' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        style={{ fontFamily: 'Outfit, sans-serif' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontFamily: 'Outfit, sans-serif'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expected"
                                        stroke="#6b7280"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Expected"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="actual"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        name="Actual"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Week Average</p>
                                <p className="text-lg font-semibold text-blue-600">
                                    {Math.round(weeklyData.reduce((sum, day) => sum + day.actual, 0) / weeklyData.length).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">Target Achievement</p>
                                <p className="text-lg font-semibold text-green-600">
                                    {((weeklyData.reduce((sum, day) => sum + day.actual, 0) / weeklyData.reduce((sum, day) => sum + day.expected, 0)) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Progress Bar - Updated Design */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Today's Production Status
                                </h3>
                                <span className="text-sm text-gray-600">
                                    {telemetryData.bagCount} / {TARGET_BAGS_PER_SHIFT} bags
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                                <div
                                    className="h-4 rounded-full transition-all duration-1000 relative"
                                    style={{
                                        width: `${bagsProgress}%`,
                                        background: bagsProgress >= 80
                                            ? 'linear-gradient(90deg, #10b981, #059669)'
                                            : bagsProgress >= 60
                                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                                : 'linear-gradient(90deg, #ef4444, #dc2626)'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0</span>
                                <span className="font-medium">{bagsProgress.toFixed(1)}%</span>
                                <span>{TARGET_BAGS_PER_SHIFT.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                                <p className="text-gray-600">Machine Status</p>
                                <p className={`font-semibold ${telemetryData.machineState === 'RUNNING' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {telemetryData.machineState}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-600">Current Rate</p>
                                <p className="font-semibold" style={{ color: getStatusColor() }}>
                                    {telemetryData.currentRate} bpm
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;