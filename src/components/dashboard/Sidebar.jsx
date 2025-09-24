import React from "react";

const Sidebar = () => {
    return (
        <aside className="w-[200px] bg-white shadow-md flex flex-col p-6">
            <h1 className="text-xl font-bold mb-10">TELEMETRIX</h1>
            <nav className="space-y-6 text-gray-600">
                <button className="flex items-center gap-3 hover:text-blue-600">Dashboard</button>
                <button className="flex items-center gap-3 hover:text-blue-600">Analytics</button>
                <button className="flex items-center gap-3 hover:text-blue-600">Reports</button>
                <button className="flex items-center gap-3 hover:text-blue-600">Support</button>
                <button className="flex items-center gap-3 hover:text-blue-600">Settings</button>
            </nav>
        </aside>
    );
};

export default Sidebar;
