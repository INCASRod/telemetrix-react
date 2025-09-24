import React from "react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const TrendsCard = () => {
    const weeklyData = [
        { day: "Mon", expected: 12000, actual: 10000 },
        { day: "Tue", expected: 15000, actual: 13000 },
        { day: "Wed", expected: 18000, actual: 17000 },
        { day: "Thu", expected: 25000, actual: 21000 },
        { day: "Fri", expected: 28000, actual: 24000 },
        { day: "Sat", expected: 22000, actual: 20000 },
        { day: "Sun", expected: 26000, actual: 30000 },
    ];

    return (
        <div className="w-[566px] h-[340px] bg-[#1C2230] shadow rounded-2xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-6">Weekly Trends</h2>
            <ResponsiveContainer width="100%" height="80%">
                <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="day" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip />
                    <Line type="monotone" dataKey="expected" stroke="#FF7F50" strokeWidth={2} />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#38BDF8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-2 text-sm">
                <span className="text-orange-400">Expected Target</span>
                <span className="text-blue-300">Actual</span>
            </div>
        </div>
    );
};

export default TrendsCard;
