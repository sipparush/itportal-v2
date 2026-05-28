'use client';
import { useState } from 'react';
import Link from 'next/link';

function normalizePathForView(pathValue) {
    const raw = (pathValue || '/').trim();
    if (!raw) return '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
}

export default function MapUrlPage() {
    const [formData, setFormData] = useState({
        fqdn: '',
        destinationIp: '',
        destinationPort: '',
        notes: ''
    });
    const [lookupData, setLookupData] = useState({
        serviceName: '',
        routeName: ''
    });
    const [editData, setEditData] = useState({
        serviceName: '',
        routeName: '',
        fqdn: '',
        scheme: 'http',
        destinationIp: '',
        destinationPort: '',
        path: '/'
    });

    const [result, setResult] = useState(null);
    const [cfResult, setCfResult] = useState(null);
    const [editMessage, setEditMessage] = useState({ type: '', text: '' });
    const [hasLoadedMapping, setHasLoadedMapping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingToCf, setIsAddingToCf] = useState(false);
    const [isLoadingMapping, setIsLoadingMapping] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);
    const [isDeletingMapping, setIsDeletingMapping] = useState(false);

    const callMapUrlApi = async (payload) => {
        const response = await fetch('/api/operations/aws/prod/mapurl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);

        try {
            const data = await callMapUrlApi(formData);
            setResult(data);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddUrlToCf = async () => {
        if (!formData.fqdn.trim()) {
            setCfResult({
                success: false,
                message: 'กรุณากรอก FQDN ก่อนเพิ่มข้อมูลเข้า Cloudflare'
            });
            return;
        }

        setIsAddingToCf(true);
        setCfResult(null);

        try {
            const response = await fetch('/api/operations/aws/prod/managecf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fqdn: formData.fqdn,
                    proxied: true,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setCfResult({ success: true, data });
            } else {
                setCfResult({
                    success: false,
                    message: data.message || 'Cloudflare request failed',
                });
            }
        } catch (error) {
            setCfResult({ success: false, message: error.message });
        } finally {
            setIsAddingToCf(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLookupChange = (e) => {
        const { name, value } = e.target;
        setLookupData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLoadMapping = async (e) => {
        e.preventDefault();
        setEditMessage({ type: '', text: '' });
        setHasLoadedMapping(false);

        if (!lookupData.serviceName.trim() && !lookupData.routeName.trim()) {
            setEditMessage({ type: 'error', text: 'กรุณากรอก Service Name หรือ Route Name อย่างน้อยหนึ่งช่อง' });
            return;
        }

        setIsLoadingMapping(true);
        try {
            const data = await callMapUrlApi({
                action: 'fetch',
                serviceName: lookupData.serviceName.trim(),
                routeName: lookupData.routeName.trim(),
            });

            setEditData({
                serviceName: data.serviceName || lookupData.serviceName.trim(),
                routeName: data.routeName || lookupData.routeName.trim(),
                fqdn: data.fqdn || '',
                scheme: data.scheme || 'http',
                destinationIp: data.destinationIp || '',
                destinationPort: String(data.destinationPort || ''),
                path: normalizePathForView(data.path || '/'),
            });
            setHasLoadedMapping(true);
            setEditMessage({ type: 'success', text: 'โหลดข้อมูลสำเร็จ' });
        } catch (error) {
            setEditMessage({ type: 'error', text: error.message || 'ไม่สามารถดึงข้อมูลได้' });
        } finally {
            setIsLoadingMapping(false);
        }
    };

    const handleEditMapping = async () => {
        setEditMessage({ type: '', text: '' });

        if (!hasLoadedMapping) {
            setEditMessage({ type: 'error', text: 'กรุณาโหลดข้อมูลก่อน' });
            return;
        }

        if (!editData.destinationIp.trim() || !editData.destinationPort.trim()) {
            setEditMessage({ type: 'error', text: 'กรุณากรอก Destination IP และ Port' });
            return;
        }

        setIsSavingMapping(true);
        try {
            const data = await callMapUrlApi({
                action: 'edit',
                serviceName: editData.serviceName,
                routeName: editData.routeName,
                scheme: editData.scheme,
                destinationIp: editData.destinationIp.trim(),
                destinationPort: editData.destinationPort.trim(),
                path: normalizePathForView(editData.path),
            });

            setEditData((prev) => ({
                ...prev,
                path: normalizePathForView(data.path || prev.path),
            }));
            setEditMessage({ type: 'success', text: data.message || 'Edit สำเร็จ' });
        } catch (error) {
            setEditMessage({ type: 'error', text: error.message || 'ไม่สามารถแก้ไขข้อมูลได้' });
        } finally {
            setIsSavingMapping(false);
        }
    };

    const handleDeleteMapping = async () => {
        setEditMessage({ type: '', text: '' });

        if (!hasLoadedMapping) {
            setEditMessage({ type: 'error', text: 'กรุณาโหลดข้อมูลก่อน' });
            return;
        }

        const confirmed = window.confirm(`ยืนยันการลบ ${editData.serviceName} / ${editData.routeName} ?`);
        if (!confirmed) return;

        setIsDeletingMapping(true);
        try {
            const data = await callMapUrlApi({
                action: 'delete',
                serviceName: editData.serviceName,
                routeName: editData.routeName,
            });

            setHasLoadedMapping(false);
            setEditData({
                serviceName: '',
                routeName: '',
                fqdn: '',
                scheme: 'http',
                destinationIp: '',
                destinationPort: '',
                path: '/',
            });
            setLookupData({ serviceName: '', routeName: '' });
            setEditMessage({ type: 'success', text: data.message || 'Delete สำเร็จ' });
        } catch (error) {
            setEditMessage({ type: 'error', text: error.message || 'ไม่สามารถลบข้อมูลได้' });
        } finally {
            setIsDeletingMapping(false);
        }
    };

    if (result) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">บันทึกข้อมูลสำเร็จ</h2>
                    <p className="text-gray-600 mb-6">{result.message}</p>

                    <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-100 mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Task Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <span className="text-gray-500 block">Request ID:</span>
                                <span className="font-medium text-gray-900">{result.details.id}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Status:</span>
                                <span className="font-medium text-yellow-600">{result.details.status}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setResult(null);
                            setCfResult(null);
                            setFormData({ fqdn: '', destinationIp: '', destinationPort: '', notes: '' });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                        ทำรายการใหม่
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Map URL to Endpoint (Prod)</h1>
                    <p className="text-gray-600 mt-1">กรอกข้อมูลเพื่อทำการจับคู่ URL กับ Endpoint ปลายทางสำหรับ environment AWS Production</p>
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 mb-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-blue-900">Search Existing Mapping</h2>
                        <p className="text-sm text-blue-800 mt-1">ค้นหาด้วย Service Name หรือ Route Name อย่างใดอย่างหนึ่ง เพื่อโหลดข้อมูลมาแก้ไขหรือลบ</p>
                    </div>

                    <form onSubmit={handleLoadMapping} className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                                Service Name
                            </label>
                            <input
                                type="text"
                                id="serviceName"
                                name="serviceName"
                                value={lookupData.serviceName}
                                onChange={handleLookupChange}
                                placeholder="e.g. svc_api.example.com"
                                className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                disabled={isLoadingMapping || isSavingMapping || isDeletingMapping}
                            />
                        </div>

                        <div>
                            <label htmlFor="routeName" className="block text-sm font-medium text-gray-700 mb-1">
                                Route Name
                            </label>
                            <input
                                type="text"
                                id="routeName"
                                name="routeName"
                                value={lookupData.routeName}
                                onChange={handleLookupChange}
                                placeholder="e.g. route_api.example.com"
                                className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                disabled={isLoadingMapping || isSavingMapping || isDeletingMapping}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <p className="mb-3 text-xs text-blue-800">กรอกอย่างน้อยหนึ่งช่อง และถ้า service นี้มีหลาย route ระบบจะให้ระบุ Route Name เพิ่ม</p>
                        </div>

                        <div className="md:col-span-2 flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={isLoadingMapping || isSavingMapping || isDeletingMapping}
                                className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md !text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                            >
                                {isLoadingMapping ? 'กำลังโหลด...' : 'Load by Name'}
                            </button>
                        </div>
                    </form>

                    {hasLoadedMapping && (
                        <div className="rounded-md border border-white/70 bg-white p-4 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">FQDN</label>
                                    <input
                                        type="text"
                                        value={editData.fqdn}
                                        readOnly
                                        className="block w-full rounded-md border-gray-300 border bg-gray-50 p-2.5 text-sm text-gray-600"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="scheme" className="block text-sm font-medium text-gray-700 mb-1">Scheme</label>
                                    <select
                                        id="scheme"
                                        name="scheme"
                                        value={editData.scheme}
                                        onChange={handleEditChange}
                                        className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        disabled={isSavingMapping || isDeletingMapping}
                                    >
                                        <option value="http">http</option>
                                        <option value="https">https</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="editDestinationIp" className="block text-sm font-medium text-gray-700 mb-1">Destination IP</label>
                                    <input
                                        type="text"
                                        id="editDestinationIp"
                                        name="destinationIp"
                                        value={editData.destinationIp}
                                        onChange={handleEditChange}
                                        className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        disabled={isSavingMapping || isDeletingMapping}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="editDestinationPort" className="block text-sm font-medium text-gray-700 mb-1">Destination Port</label>
                                    <input
                                        type="number"
                                        id="editDestinationPort"
                                        name="destinationPort"
                                        value={editData.destinationPort}
                                        onChange={handleEditChange}
                                        className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        disabled={isSavingMapping || isDeletingMapping}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="editPath" className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                                    <input
                                        type="text"
                                        id="editPath"
                                        name="path"
                                        value={editData.path}
                                        onChange={handleEditChange}
                                        className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        disabled={isSavingMapping || isDeletingMapping}
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                Preview: {editData.scheme}://{editData.destinationIp || '127.0.0.1'}:{editData.destinationPort || '8080'}{normalizePathForView(editData.path)}
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleEditMapping}
                                    disabled={isSavingMapping || isDeletingMapping}
                                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md !text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    {isSavingMapping ? 'กำลังแก้ไข...' : 'Edit Mapping'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDeleteMapping}
                                    disabled={isSavingMapping || isDeletingMapping}
                                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md !text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    {isDeletingMapping ? 'กำลังลบ...' : 'Delete Mapping'}
                                </button>
                            </div>
                        </div>
                    )}

                    {editMessage.text && (
                        <div className={`rounded-md border p-4 text-sm ${editMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                            {editMessage.text}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="col-span-2">
                            <label htmlFor="fqdn" className="block text-sm font-medium text-gray-700 mb-1">
                                FQDN (Fully Qualified Domain Name) <span className="text-red-500">*</span>
                            </label>
                            https://
                            <input
                                type="text"
                                id="fqdn"
                                name="fqdn"
                                required
                                placeholder="e.g. api.example.com"
                                value={formData.fqdn}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">ระบุชื่อโดเมนที่ต้องการใช้งาน</p>
                        </div>

                        <div>
                            <label htmlFor="destinationIp" className="block text-sm font-medium text-gray-700 mb-1">
                                Destination IP Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="destinationIp"
                                name="destinationIp"
                                required
                                placeholder="e.g. 10.0.1.50"
                                value={formData.destinationIp}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="destinationPort" className="block text-sm font-medium text-gray-700 mb-1">
                                Destination Port <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="destinationPort"
                                name="destinationPort"
                                required
                                placeholder="e.g. 8080"
                                value={formData.destinationPort}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="col-span-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                Other Information / Notes
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={4}
                                placeholder="รายละเอียดเพิ่มเติม หรือเหตุผลในการขอใช้งาน..."
                                value={formData.notes}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="col-span-2 space-y-3">
                            <Link target="_blank" href="https://kong-ui.jfin.network/services" className="text-blue-600 hover:underline">
                                For Advanced configuration.
                            </Link>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md border border-emerald-100 bg-emerald-50 p-3">
                                <div>
                                    <p className="text-sm font-medium text-emerald-800">Cloudflare DNS</p>
                                    <p className="text-xs text-emerald-700">
                                        ปุ่มนี้จะสร้าง/อัปเดต A record ไปที่ 18.142.134.175 และเปิด proxy ให้อัตโนมัติ
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddUrlToCf}
                                    disabled={isAddingToCf || !formData.fqdn.trim()}
                                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md !text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    {isAddingToCf ? 'Adding to Cloudflare...' : 'addURLToCF'}
                                </button>
                            </div>

                            {cfResult && (
                                <div className={`rounded-md border p-4 text-sm ${cfResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                    <p className="font-semibold">
                                        {cfResult.success ? 'Cloudflare DNS updated successfully' : 'Cloudflare DNS update failed'}
                                    </p>
                                    <p className="mt-1">
                                        {cfResult.success ? cfResult.data.message : cfResult.message}
                                    </p>
                                    {cfResult.success && cfResult.data?.details && (
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                            <div>
                                                <span className="font-medium">Zone:</span> {cfResult.data.details.zoneName}
                                            </div>
                                            <div>
                                                <span className="font-medium">Status:</span> {cfResult.data.details.status}
                                            </div>
                                            <div>
                                                <span className="font-medium">Hostname:</span> {cfResult.data.details.hostname}
                                            </div>
                                            <div>
                                                <span className="font-medium">Target IP:</span> {cfResult.data.details.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md !text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล (Submit)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}