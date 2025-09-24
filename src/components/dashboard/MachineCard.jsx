const MachineCard = ({ machineData }) => {
    const state = machineData.machineState?.toLowerCase() || "stopped";
    const bagCount = machineData.bagCount || 0;
    const bagsPerMinute = machineData.bagsPerMinute || 0;
    const uptime = machineData.uptimePercentage || 0;

    const statusColors = {
        running: "bg-green-500",
        paused: "bg-orange-500",
        stopped: "bg-red-500",
    };

    return (
        <div className="w-[566px] h-[340px] bg-white shadow rounded-2xl p-6 flex flex-col">
            <h2 className="text-lg font-semibold">{machineData.deviceId || "Machine"}</h2>
            <p className="text-sm text-gray-500 mb-4">Form Fill & Seal Bagging Machine</p>

            {/* Status lights */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${statusColors[state]}`} />
                    <span className="text-sm capitalize">{state}</span>
                </div>
            </div>

            {/* Total Bags */}
            <div className="mb-4">
                <p className="text-sm font-medium">Total Bags</p>
                <p className="text-xl font-bold">{bagCount.toLocaleString()}</p>
            </div>

            {/* Current Rate */}
            <div className="mb-4">
                <p className="text-sm font-medium">Bags/Min</p>
                <p className="text-xl font-bold">{bagsPerMinute}</p>
            </div>

            {/* Uptime */}
            <div className="mt-auto">
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-xl font-bold">{uptime}%</p>
            </div>
        </div>
    );
};

export default MachineCard;
