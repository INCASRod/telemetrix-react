// Dashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MachineCard from "./MachineCard";
import TrendsCard from "./TrendsCard";

const Dashboard = ({ user, onLogout, getAccessToken }) => {
    const [machineData, setMachineData] = useState({});
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);

    const API_BASE = "https://incas-functions-dev-b8djeyakc7d0hwa3.australiasoutheast-01.azurewebsites.net/api";

    useEffect(() => {
        if (user && getAccessToken) {
            fetchMachineData();
            const interval = setInterval(fetchMachineData, 5000);
            return () => clearInterval(interval);
        }
    }, [user, getAccessToken]);

    const fetchMachineData = async () => {
        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_BASE}/GetCurrentStatus`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("API Error " + res.status);
            const data = await res.json();
            setMachineData(data);
            setLastUpdate(new Date().toLocaleTimeString());
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = () => onLogout();

    return (
        <div className="flex h-screen font-[Outfit] bg-gray-50">
            <Sidebar />

            <main className="flex-1 grid grid-cols-2 gap-6 p-8">
                <MachineCard machineData={machineData} />
                <TrendsCard />
            </main>
        </div>
    );
};

export default Dashboard;
