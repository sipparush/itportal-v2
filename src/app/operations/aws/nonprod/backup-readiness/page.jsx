'use client';
import React, { useState, useEffect } from 'react';

function BackupReadinessPage() {
    const [backups, setBackups] = useState([]);
    const [restoredIps, setRestoredIps] = useState({});
    const [loading, setLoading] = useState({});
    const [popupOpen, setPopupOpen] = useState(false);
    const [currentDockerInfo, setCurrentDockerInfo] = useState('');
    const [loadingList, setLoadingList] = useState(false);

    const loadBackups = (refresh = false) => {
        setLoadingList(true);
        fetch(`/api/operations/aws/nonprod/backup-readiness/list${refresh ? '?refresh=true' : ''}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setBackups(data);
                }
            })
            .catch(err => console.error('Failed to load backup list', err))
            .finally(() => setLoadingList(false));
    };

    const saveBackupsState = async (newBackups) => {
        try {
            await fetch('/api/operations/aws/nonprod/backup-readiness/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBackups)
            });
        } catch (error) {
            console.error('Failed to save state', error);
        }
    };

    useEffect(() => {
        // Fetch backup list
        loadBackups();

        // Load initial state from backend file
        fetch('/api/operations/aws/nonprod/backup-readiness/restore')
            .then(res => res.json())
            .then(data => {
                if (data && typeof data === 'object') {
                    setRestoredIps(data);
                }
            })
            .catch(err => console.error('Failed to load state', err));
    }, []);

    const handleRestore = async (backup) => {
        const backupName = backup.name;
        setLoading(prev => ({ ...prev, [backupName]: true }));
        try {
            const res = await fetch('/api/operations/aws/nonprod/backup-readiness/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instanceName: backupName,
                    recoveryPointArn: backup.recoveryPointArn,
                    resourceArn: backup.resourceArn // Send Resource ARN to enable fresh lookup
                })
            });
            const data = await res.json();

            if (data.success) {
                setRestoredIps(prev => ({ ...prev, [backupName]: { instanceId: data.instanceId, privateIp: data.privateIp } }));
                // Update specific row status if needed
                const updatedBackups = backups.map(b =>
                    b.name === backupName ? { ...b, status: 'Completed', testDate: new Date().toISOString().split('T')[0] } : b
                );
                setBackups(updatedBackups);
                saveBackupsState(updatedBackups);
            } else {
                alert(`Restore Failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Restore Error:', error);
            alert('Failed to restore');
        } finally {
            setLoading(prev => ({ ...prev, [backupName]: false }));
        }
    };

    const handleTerminate = async (backupName) => {
        if (!confirm(`Are you sure you want to terminate the restored instance for: ${backupName}?`)) return;

        setLoading(prev => ({ ...prev, [backupName]: true }));
        try {
            const restoredData = restoredIps[backupName];
            const instanceIdToDelete = (typeof restoredData === 'object') ? restoredData.instanceId : null;

            const res = await fetch('/api/operations/aws/nonprod/backup-readiness/restore', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instanceName: backupName,
                    instanceId: instanceIdToDelete
                })
            });
            const data = await res.json();

            if (data.success) {
                // Keep the date and status 'Completed' in the main list so it doesn't disappear
                const updatedBackups = backups.map(b =>
                    b.name === backupName
                        ? { ...b, status: 'Completed', testDate: new Date().toISOString().split('T')[0] }
                        : b
                );
                setBackups(updatedBackups);
                saveBackupsState(updatedBackups);

                setRestoredIps(prev => {
                    const next = { ...prev };
                    delete next[backupName];
                    return next;
                });
                // When terminating, we KEEP the 'Completed' status in the table (backup.status)
                // so the user knows this backup WAS tested today, even if the instance is gone.
                // The 'Action' button will revert to 'Restore' (enabled) if they want to do it again?
                // Or should it stay disabled? "change button name from (IP) to N/A. and keep other column's value"
                // The IP button becomes N/A (done).
                // The Restore Status column should stay 'Completed'.
            } else {
                alert(`Terminate Failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Terminate Error:', error);
            alert('Failed to terminate');
        } finally {
            setLoading(prev => ({ ...prev, [backupName]: false }));
        }
    };

    const getIp = (backupName) => {
        const data = restoredIps[backupName];
        if (!data) return null;
        return typeof data === 'object' ? data.privateIp : data; // Handle both new object and old string format
    };

    const handleShowDocker = async (ip) => {
        setPopupOpen(true);
        setCurrentDockerInfo('Loading docker status...');

        try {
            const res = await fetch('/api/operations/aws/nonprod/backup-readiness/check-docker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });

            const data = await res.json();

            if (data.success) {
                setCurrentDockerInfo(data.output);
            } else {
                setCurrentDockerInfo(`Failed to get docker info:\n${data.message}\n${data.details || ''}`);
            }
        } catch (error) {
            console.error('Docker Check Error:', error);
            setCurrentDockerInfo('Error connecting to backend.');
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Backup Readiness</h1>
                    <p className="text-gray-600">EC2 backup readiness dashboard showing restore status and verification.</p>
                </div>
                <button
                    onClick={() => loadBackups(true)}
                    disabled={loadingList}
                    className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${loadingList ? 'opacity-70 cursor-wait' : ''}`}
                >
                    <svg className={`w-5 h-5 ${loadingList ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    {loadingList ? 'Refreshing...' : 'Reload from AWS'}
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backup Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restore Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Restore Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Docker</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {backups.map((backup, index) => (
                            <tr key={backup.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{backup.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${(restoredIps[backup.name] || backup.status === 'Completed') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {restoredIps[backup.name] ? 'Restored' : backup.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {/* Keep test date if it exists, otherwise show today if currently restored */}
                                    {backup.testDate && backup.testDate !== '-' ? backup.testDate : (restoredIps[backup.name] ? new Date().toISOString().split('T')[0] : '-')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleRestore(backup)}
                                        disabled={loading[backup.name] || restoredIps[backup.name]}
                                        className={`w-32 px-4 py-2 rounded text-white font-medium transition-colors
                                            ${(loading[backup.name] || restoredIps[backup.name])
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {/* If loading, 'Restoring...'. If currently active IP, 'Restored'. 
                                            If NO active IP but status is Completed (terminated previously), show 'Restore' again? 
                                            Or keep showing 'Restored'? User said "change button name from (IP) to N/A".
                                            Did not specify the Restore button. Assuming it becomes enabled again. */}
                                        {loading[backup.name] ? 'Restoring...' : (restoredIps[backup.name] ? 'Restored' : 'Restore')}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const ip = getIp(backup.name);
                                            if (ip) handleShowDocker(ip);
                                        }}
                                        disabled={!restoredIps[backup.name]}
                                        className={`px-4 py-2 rounded font-medium transition-colors min-w-[120px]
                                            ${restoredIps[backup.name]
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {getIp(backup.name) || 'N/A'}
                                    </button>

                                    {restoredIps[backup.name] && (
                                        <button
                                            onClick={() => handleTerminate(backup.name)}
                                            className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 border border-red-200 text-xs font-semibold uppercase tracking-wider"
                                            title="Terminate restored instance"
                                        >
                                            Terminate
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {popupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-3/4 max-w-2xl shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Docker Status</h2>
                            <button onClick={() => setPopupOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96 whitespace-pre">
                            {currentDockerInfo}
                        </div>
                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setPopupOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BackupReadinessPage