'use client';

import { useEffect, useState } from 'react';

export default function CheckSecurityPatchPage() {
    const [ipInput, setIpInput] = useState('');
    const [isScanningFarm, setIsScanningFarm] = useState(false);
    const [isScanningIp, setIsScanningIp] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isExportingHistory, setIsExportingHistory] = useState(false);

    const loadHistory = async () => {
        try {
            setIsLoadingHistory(true);
            const response = await fetch('/api/operations/aws/nonprod/check-security-patch?limit=20', {
                cache: 'no-store'
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load scan history');
            }

            setHistory(data.history || []);
        } catch (historyError) {
            setError(historyError.message);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const runScan = async (mode) => {
        setError('');
        setResult(null);

        if (mode === 'ip' && !ipInput.trim()) {
            setError('Please provide an IP address before scanning by IP.');
            return;
        }

        if (mode === 'farm') {
            setIsScanningFarm(true);
        } else {
            setIsScanningIp(true);
        }

        try {
            const response = await fetch('/api/operations/aws/nonprod/check-security-patch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mode,
                    ip: ipInput.trim()
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Security patch scan failed');
            }

            setResult(data);
            await loadHistory();
        } catch (scanError) {
            setError(scanError.message);
        } finally {
            setIsScanningFarm(false);
            setIsScanningIp(false);
        }
    };

    const exportHistoryToXlsx = async () => {
        try {
            setError('');
            setIsExportingHistory(true);

            const response = await fetch('/api/operations/aws/nonprod/check-security-patch?limit=100&format=xlsx', {
                cache: 'no-store'
            });

            if (!response.ok) {
                let message = 'Failed to export xlsx file';

                try {
                    const data = await response.json();
                    message = data.message || message;
                } catch {
                    // ignore json parse errors for binary responses
                }

                throw new Error(message);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const disposition = response.headers.get('Content-Disposition') || '';
            const fileNameMatch = disposition.match(/filename="([^"]+)"/);
            const fileName = fileNameMatch?.[1] || 'scan_security_patch.xlsx';
            const link = document.createElement('a');

            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (exportError) {
            setError(exportError.message);
        } finally {
            setIsExportingHistory(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Check Security Patch (Non-Prod)</h1>
                    <p className="text-gray-600 mt-1">
                        สแกนสถานะ security patch ของ EC2 ใน AWS Non-Production ผ่าน profile <span className="font-mono">aws_nonprod</span>
                        และเช็กผ่าน <span className="font-mono">ssh jventures@&lt;ip&gt;</span>
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <div className="space-y-4">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Scan AWS Farm</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                ดึงรายการ EC2 ที่สถานะ <span className="font-mono">running</span> จาก profile <span className="font-mono">aws_nonprod</span> แล้วเช็ก security patch ทีละ IP
                            </p>
                            <button
                                type="button"
                                onClick={() => runScan('farm')}
                                disabled={isScanningFarm || isScanningIp}
                                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium !text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isScanningFarm ? 'Scanning AWS Farm...' : 'Scan All Running EC2'}
                            </button>
                        </div>

                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Scan Specific IP</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                ป้อน IP ที่ต้องการ แล้วระบบจะพยายาม map กับ EC2 ใน profile <span className="font-mono">aws_nonprod</span> ก่อนทำการเช็ก
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="text"
                                    value={ipInput}
                                    onChange={(event) => setIpInput(event.target.value)}
                                    placeholder="e.g. 10.240.1.203"
                                    className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => runScan('ip')}
                                    disabled={isScanningFarm || isScanningIp}
                                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium !text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isScanningIp ? 'Scanning IP...' : 'Scan This IP'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Log Output</h2>
                        <p className="text-sm text-gray-600 mb-3">
                            ทุกครั้งที่สแกนสำเร็จหรือไม่สำเร็จ ระบบจะ append ลงไฟล์ <span className="font-mono">scan_security_patch_nonprod.log</span>
                        </p>
                        <p className="text-xs text-gray-500 leading-6">
                            format:
                            <br />
                            <span className="font-mono">
                                &lt;instance_id&gt; &lt;name&gt; &lt;ip&gt; &lt;check_date&gt; &lt;security_patch_version&gt; &lt;latest_status&gt;
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Scan Result</h2>
                            <p className="text-sm text-gray-600">
                                mode: <span className="font-mono">{result.mode}</span> | checked: <span className="font-mono">{result.summary.checked}</span> | success: <span className="font-mono">{result.summary.success}</span> | failed: <span className="font-mono">{result.summary.failed}</span>
                            </p>
                        </div>
                        <p className="text-sm text-gray-500">
                            log file: <span className="font-mono">{result.logFile}</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Instance</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Current Check</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Last Scan</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Patch Version</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {result.results.map((item, index) => (
                                    <tr key={`${item.instanceId}-${item.ip}-${index}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-gray-700">{item.instanceId}</td>
                                        <td className="px-4 py-3 text-gray-900">{item.name}</td>
                                        <td className="px-4 py-3 font-mono text-gray-700">{item.ip}</td>
                                        <td className="px-4 py-3 font-mono text-gray-700">{item.checkDate}</td>
                                        <td className="px-4 py-3 font-mono text-gray-500">{item.lastScanDate || '-'}</td>
                                        <td className="px-4 py-3 font-mono text-gray-700">{item.securityPatchVersion}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.latestStatus}
                                            </span>
                                            {item.error && (
                                                <p className="mt-2 text-xs text-red-600 whitespace-pre-wrap">{item.error}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Database History</h2>
                        <p className="text-sm text-gray-600">ข้อมูลล่าสุดจากตาราง <span className="font-mono">scan_security_patch</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={exportHistoryToXlsx}
                            disabled={isExportingHistory || isLoadingHistory || isScanningFarm || isScanningIp || history.length === 0}
                            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium !text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isExportingHistory ? 'Exporting...' : 'Export file to xlsx'}
                        </button>
                        <button
                            type="button"
                            onClick={loadHistory}
                            disabled={isLoadingHistory || isScanningFarm || isScanningIp}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoadingHistory ? 'Loading...' : 'Refresh History'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Instance</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">OS</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Check Date</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Patch Version</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                                        {isLoadingHistory ? 'Loading scan history...' : 'No scan history found in database'}
                                    </td>
                                </tr>
                            )}
                            {history.map((item) => (
                                <tr key={item.instanceId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-700">{item.instanceId}</td>
                                    <td className="px-4 py-3 text-gray-900">{item.name}</td>
                                    <td className="px-4 py-3 font-mono text-gray-700">{item.ip}</td>
                                    <td className="px-4 py-3 text-gray-700">{item.osName || '-'}</td>
                                    <td className="px-4 py-3 font-mono text-gray-700">{item.checkDate}</td>
                                    <td className="px-4 py-3 font-mono text-gray-700">{item.securityPatchVersion}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                            {item.latestStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
