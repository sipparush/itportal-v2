'use client';

import { useState } from 'react';
import Link from 'next/link';

function normalizePathForView(pathValue) {
    const raw = (pathValue || '/').trim();
    if (!raw) return '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
}

export default function ByteplusEditMapUrlPage() {
    const [fqdn, setFqdn] = useState('');
    const [scheme, setScheme] = useState('http');
    const [endpoint, setEndpoint] = useState('');
    const [pathValue, setPathValue] = useState('/');
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [routeMissing, setRouteMissing] = useState(false);

    const callApi = async (payload) => {
        const response = await fetch('/api/operations/byteplus/edit-map-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    };

    const handleLoad = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoaded(false);
        setRouteMissing(false);

        if (!fqdn.trim()) {
            setError('กรุณากรอก FQDN');
            return;
        }

        setIsLoading(true);
        try {
            const data = await callApi({ action: 'fetch', fqdn: fqdn.trim() });
            setScheme(data.scheme || 'http');
            setEndpoint(data.endpoint || '');
            setPathValue(normalizePathForView(data.path || '/'));
            setRouteMissing(Boolean(data.routeMissing));
            setLoaded(true);
            setSuccess(Boolean(data.routeMissing) ? 'โหลดข้อมูลสำเร็จ (พบ service แต่ route หาย ระบบจะซ่อม route ตอนกด Edit)' : 'โหลดข้อมูลสำเร็จ');
        } catch (err) {
            setError(err.message || 'ไม่สามารถดึงข้อมูลได้');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async () => {
        setError('');
        setSuccess('');

        if (!loaded) {
            setError('กรุณาโหลดข้อมูลก่อน');
            return;
        }

        if (!endpoint.trim()) {
            setError('กรุณากรอก Endpoint IP:Port');
            return;
        }

        setIsSaving(true);
        try {
            const data = await callApi({
                action: 'edit',
                fqdn: fqdn.trim(),
                scheme,
                endpoint: endpoint.trim(),
                path: normalizePathForView(pathValue),
            });
            setSuccess(data.message || 'Edit สำเร็จ');
        } catch (err) {
            setError(err.message || 'ไม่สามารถแก้ไขข้อมูลได้');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setError('');
        setSuccess('');

        if (!loaded) {
            setError('กรุณาโหลดข้อมูลก่อน');
            return;
        }

        const confirmed = window.confirm(`ยืนยันการลบ ${fqdn.trim()} ?`);
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const data = await callApi({ action: 'delete', fqdn: fqdn.trim() });
            setSuccess(data.message || 'Delete สำเร็จ');
            setLoaded(false);
            setRouteMissing(false);
            setEndpoint('');
            setPathValue('/');
            setScheme('http');
        } catch (err) {
            setError(err.message || 'ไม่สามารถลบข้อมูลได้');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">BytePlus - Edit URL to Endpoint</h1>
                <p className="text-gray-600">ค้นหาด้วย FQDN เพื่อแก้ไขหรือลบ URL mapping</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <form onSubmit={handleLoad} className="space-y-4">
                    <div>
                        <label htmlFor="fqdn" className="block text-sm font-medium text-gray-700 mb-1">FQDN</label>
                        <input
                            id="fqdn"
                            type="text"
                            value={fqdn}
                            onChange={(e) => setFqdn(e.target.value)}
                            placeholder="example.com"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={isLoading || isSaving || isDeleting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isSaving || isDeleting}
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'กำลังโหลด...' : 'Load by FQDN'}
                    </button>
                </form>

                {loaded && (
                    <div className="space-y-4 border-t border-gray-100 pt-4">
                        {routeMissing && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                พบเฉพาะ service แต่ไม่พบ route ของ FQDN นี้ — เมื่อกด Edit ระบบจะสร้าง route ใหม่ให้อัตโนมัติ
                            </div>
                        )}

                        <div>
                            <label htmlFor="scheme" className="block text-sm font-medium text-gray-700 mb-1">Scheme</label>
                            <select
                                id="scheme"
                                value={scheme}
                                onChange={(e) => setScheme(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                disabled={isSaving || isDeleting}
                            >
                                <option value="http">http</option>
                                <option value="https">https</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">Endpoint IP:Port</label>
                            <input
                                id="endpoint"
                                type="text"
                                value={endpoint}
                                onChange={(e) => setEndpoint(e.target.value)}
                                placeholder="127.0.0.1:8080"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                disabled={isSaving || isDeleting}
                            />
                        </div>

                        <div>
                            <label htmlFor="path" className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                            <input
                                id="path"
                                type="text"
                                value={pathValue}
                                onChange={(e) => setPathValue(e.target.value)}
                                placeholder="/"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                disabled={isSaving || isDeleting}
                            />
                        </div>

                        <p className="text-xs text-gray-500">
                            Preview: {scheme}://{endpoint || '127.0.0.1:8080'}{normalizePathForView(pathValue)}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleEdit}
                                disabled={isSaving || isDeleting}
                                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isSaving ? 'กำลังแก้ไข...' : 'Edit'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSaving || isDeleting}
                                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                            >
                                {isDeleting ? 'กำลังลบ...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                )}

                {error && <div className="text-sm text-red-600">{error}</div>}
                {success && <div className="text-sm text-green-600">{success}</div>}

                {!loaded && error.includes('ไม่พบ FQDN นี้ในระบบ') && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        ยังไม่พบข้อมูล mapping สำหรับ FQDN นี้
                        <Link href="/operations/byteplus/map-url" className="ml-1 font-medium text-blue-700 hover:underline">
                            ไปหน้า Create URL to Endpoint
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
