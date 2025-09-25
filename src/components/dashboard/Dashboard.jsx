import React, { useState, useEffect } from 'react';
import GaugeComponent from 'react-gauge-component';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ user, token, onLogout }) => {
    const [telemetryData, setTelemetryData] = useState({
        bagCount: 1108, // Test data to match your screenshot
        machineState: 'RUNNING',
        currentRate: 12, // 12 bags/min (below optimal for red indicator)
        machineRunTime: 0 // Actual machine running time in minutes
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

    const [loading, setLoading] = useState(false); // Set to false for immediate display
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Shift Configuration - Adjustable for different shifts
    const SHIFT_START_HOUR = 7; // 7 AM
    const SHIFT_END_HOUR = 17; // 5 PM
    const SHIFT_DURATION_HOURS = SHIFT_END_HOUR - SHIFT_START_HOUR; // 10 hours
    const SHIFT_DURATION_MINUTES = SHIFT_DURATION_HOURS * 60; // 600 minutes

    // Constants for B&C 4080DN specifications
    const TARGET_BAGS_PER_SHIFT = 14400; // 24 bags/min * 600 minutes (10 hours)
    const OPTIMAL_RATE = 24; // bags per minute

    // Real-time clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second

        return () => clearInterval(timer);
    }, []);

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
                console.log('API Response:', data);

                setTelemetryData({
                    bagCount: data.bagCount || 0,
                    machineState: data.machineState || 'STOPPED',
                    currentRate: data.currentRate || data.bagsPerMinute || 0,
                    machineRunTime: data.machineRunTime || 0 // Machine actual running time
                });

                setLoading(false);
            } catch (err) {
                console.error('API Error:', err);
                // Don't set error for demo - keep test data
                setLoading(false);
            }
        };

        // Uncomment for real API calls
        // fetchData();
        // const interval = setInterval(fetchData, 5000);
        // return () => clearInterval(interval);
    }, [token, onLogout]);

    // Calculate real-time shift progress
    const getShiftProgress = () => {
        const now = currentTime;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if we're within shift hours
        if (currentHour < SHIFT_START_HOUR || currentHour >= SHIFT_END_HOUR) {
            return {
                isActiveShift: false,
                minutesIntoShift: 0,
                shiftProgress: 0,
                timeDisplay: '00:00:00',
                remainingTime: '00:00:00'
            };
        }

        // Calculate minutes into the shift
        const minutesIntoShift = (currentHour - SHIFT_START_HOUR) * 60 + currentMinute;
        const shiftProgress = Math.min((minutesIntoShift / SHIFT_DURATION_MINUTES) * 100, 100);

        // Format time displays
        const hours = Math.floor(minutesIntoShift / 60);
        const mins = minutesIntoShift % 60;
        const seconds = now.getSeconds();
        const timeDisplay = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Calculate remaining time
        const remainingMinutes = Math.max(0, SHIFT_DURATION_MINUTES - minutesIntoShift);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        const remainingTime = `${remainingHours.toString().padStart(2, '0')}:${remainingMins.toString().padStart(2, '0')}:00`;

        return {
            isActiveShift: true,
            minutesIntoShift,
            shiftProgress,
            timeDisplay,
            remainingTime
        };
    };

    // Calculate machine runtime progress and display
    const getMachineRunTime = () => {
        const runTimeMinutes = telemetryData.machineRunTime; // From API
        const runTimeProgress = Math.min((runTimeMinutes / SHIFT_DURATION_MINUTES) * 100, 100);

        const hours = Math.floor(runTimeMinutes / 60);
        const mins = runTimeMinutes % 60;
        const timeDisplay = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;

        // Calculate efficiency (machine time vs shift time)
        const shiftInfo = getShiftProgress();
        const efficiency = shiftInfo.minutesIntoShift > 0
            ? (runTimeMinutes / shiftInfo.minutesIntoShift) * 100
            : 0;

        return {
            runTimeMinutes,
            runTimeProgress,
            timeDisplay,
            efficiency: Math.min(efficiency, 100)
        };
    };

    // Calculate percentages for progress bars
    const shiftInfo = getShiftProgress();
    const machineInfo = getMachineRunTime();
    const bagsProgress = Math.min((telemetryData.bagCount / TARGET_BAGS_PER_SHIFT) * 100, 100);

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
                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            TELEMETRIX
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <h2 className="text-xl font-semibold text-gray-700">WISE-4050-Test</h2>
                            <span className="text-sm text-gray-500">Form Fill Bagging Machine</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm">Running</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm">Paused</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                <span className="text-sm">Stopped</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Welcome back</p>
                            <p className="font-medium">{user?.name || 'Rodrigo Pesenti'}</p>
                            <p className="text-xs text-gray-500">INCAS Operations</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-6">
                {/* Main Content - Responsive Flex Grid with Equal Height Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Left Card - Production Metrics */}
                    <div className="bg-white rounded-lg shadow-sm p-6 h-auto flex flex-col">
                        <div className="space-y-6 flex-1">
                            {/* Real-Time Shift Progress */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-700">
                                        Shift Progress ({SHIFT_START_HOUR}:00 - {SHIFT_END_HOUR}:00)
                                    </span>
                                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
                                        {shiftInfo.shiftProgress.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-lg font-semibold text-gray-900">
                                        {shiftInfo.timeDisplay}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {shiftInfo.isActiveShift ? `${shiftInfo.remainingTime} remaining` : 'Outside shift hours'}
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${shiftInfo.shiftProgress}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {shiftInfo.isActiveShift ? 'Live shift tracking' : 'Shift not active'}
                                </div>
                            </div>

                            {/* Machine Runtime vs Shift Time */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-700">Machine Runtime</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 bg-green-100 px-2 py-1 rounded">
                                            {machineInfo.efficiency.toFixed(1)}% efficiency
                                        </span>
                                        <span className="text-sm text-gray-600 bg-purple-100 px-2 py-1 rounded">
                                            {machineInfo.runTimeProgress.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-lg font-semibold text-gray-900">
                                        {machineInfo.timeDisplay}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Running time vs {shiftInfo.timeDisplay} elapsed
                                    </div>
                                </div>
                                <div className="relative">
                                    {/* Background bar showing shift progress */}
                                    <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                                        <div
                                            className="bg-blue-300 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${shiftInfo.shiftProgress}%` }}
                                        ></div>
                                    </div>
                                    {/* Machine runtime bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-1000 ${machineInfo.efficiency >= 90 ? 'bg-green-600' :
                                                    machineInfo.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${machineInfo.runTimeProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Shift elapsed (blue) vs Machine runtime (colored)</span>
                                    <span>Target: {SHIFT_DURATION_HOURS}h runtime</span>
                                </div>
                            </div>

                            {/* Total Bags */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-700">Total Bags</span>
                                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
                                        {bagsProgress.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="text-lg font-semibold text-gray-900 mb-2">
                                    {telemetryData.bagCount.toLocaleString()}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${bagsProgress}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    Target: {TARGET_BAGS_PER_SHIFT.toLocaleString()} bags per shift
                                </div>
                            </div>

                            {/* Production Efficiency Gauge */}
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                        Production
                                    </h3>
                                    <div className="flex justify-center items-center gap-2 mb-2">
                                        <span className="text-sm text-gray-600">
                                            {telemetryData.currentRate.toFixed(1)} bags/min (Target: 24 bags/min)
                                        </span>
                                    </div>
                                    <div className="flex justify-center items-center gap-2">
                                        <span className="text-sm font-medium text-red-600">Below Optimal</span>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <div style={{ width: '280px', height: '200px' }}>
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
                                                        limit: 83,
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
                                                color: gaugeValue >= 83 ? '#5BE12C' : gaugeValue >= 50 ? '#F5CD19' : '#EA4228',
                                                length: 0.8,
                                                width: 15
                                            }}
                                            labels={{
                                                valueLabel: {
                                                    formatTextValue: value => `${value.toFixed(0)}%`,
                                                    style: {
                                                        fontSize: '28px',
                                                        fontWeight: 'bold',
                                                        fontFamily: 'Outfit, sans-serif',
                                                        fill: gaugeValue >= 83 ? '#5BE12C' : gaugeValue >= 50 ? '#F5CD19' : '#EA4228'
                                                    }
                                                },
                                                tickLabels: {
                                                    type: 'outer',
                                                    defaultTickValueConfig: {
                                                        formatTextValue: value => `${value}%`,
                                                        style: { fontSize: '11px', fill: '#6b7280' }
                                                    }
                                                }
                                            }}
                                            value={gaugeValue}
                                            minValue={0}
                                            maxValue={100}
                                        />
                                    </div>
                                </div>

                                {/* Status Buttons */}
                                <div className="flex justify-center gap-3 mt-4">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md text-sm">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        Running
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-600 rounded-md text-sm">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        Paused
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-600 rounded-md text-sm">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        Stopped
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Card - Weekly Trends */}
                    <div className="bg-white rounded-lg shadow-sm p-6 h-auto flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Weekly Trends
                            </h2>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-orange-500"></div>
                                    <span className="text-gray-600">Expected Target</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-0.5 bg-blue-500"></div>
                                    <span className="text-gray-600">Actual</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={{ stroke: '#e5e7eb' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={{ stroke: '#e5e7eb' }}
                                        domain={['dataMin - 200', 'dataMax + 200']}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '12px'
                                        }}
                                        formatter={(value, name) => [
                                            `${value.toLocaleString()} bags`,
                                            name === 'expected' ? 'Expected Target' : 'Actual'
                                        ]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expected"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        strokeDasharray="8 4"
                                        dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#f97316' }}
                                        name="expected"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="actual"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                        activeDot={{ r: 8, fill: '#3b82f6' }}
                                        name="actual"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Footer Information */}
                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>Last updated: 12.26.31 pm</p>
                </div>

                {/* Logout Button */}
                <div className="fixed bottom-6 left-6">
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
