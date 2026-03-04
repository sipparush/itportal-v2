'use client';

import { useState } from 'react';
import Link from 'next/link';

function extractApiErrorMessage(data) {
    if (!data) return 'ไม่สามารถสร้าง service/route ได้';

    if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
    }

    const rawCandidates = [data.serviceResponse, data.routeResponse]
        .filter((item) => typeof item === 'string' && item.trim());

    for (const raw of rawCandidates) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.message) return parsed.message;
        } catch {
            return raw;
        }
    }

    return 'ไม่สามารถสร้าง service/route ได้';
}

export default function ByteplusMapUrlPage() {
    const [scheme, setScheme] = useState('http');
    const [url, setUrl] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [pathValue, setPathValue] = useState('/');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setResult(null);

        if (!url.trim() || !endpoint.trim()) {
            setError('กรุณากรอก URL และ Endpoint IP:Port ให้ครบ');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/operations/byteplus/map-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheme,
                    url: url.trim(),
                    endpoint: endpoint.trim(),
                    path: pathValue.trim() || '/',
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(extractApiErrorMessage(data));
                return;
            }

            setSuccess('สร้าง service และ route สำเร็จ');
            setResult(data);
        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาดระหว่างเรียก API');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <nav className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200 mb-6" aria-label="Breadcrumb">
                <div className="max-w-7xl mx-auto">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <Link href="/home" className="text-gray-500 hover:text-blue-600 font-medium text-sm flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                                แดชบอร์ด
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                </svg>
                                <Link href="/operations" className="text-gray-500 hover:text-blue-600 font-medium text-sm">
                                    IT Operations
                                </Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                </svg>
                                <span className="text-gray-500 font-medium text-sm">BytePlus</span>
                            </div>
                        </li>
                        <li aria-current="page">
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                </svg>
                                <span className="text-gray-500 font-medium text-sm">Map URL to Endpoint</span>
                            </div>
                        </li>
                    </ol>
                </div>
            </nav>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">BytePlus - Map URL to Endpoint</h1>
                <p className="text-gray-600">กรอกข้อมูลเพื่อสร้าง service และ route ผ่าน BytePlus Gateway</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="map-scheme" className="block text-sm font-medium text-gray-700 mb-1">Scheme</label>
                        <select
                            id="map-scheme"
                            value={scheme}
                            onChange={(e) => setScheme(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={isSubmitting}
                        >
                            <option value="http">http</option>
                            <option value="https">https</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="map-url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        <input
                            id="map-url"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="example.com"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label htmlFor="map-endpoint" className="block text-sm font-medium text-gray-700 mb-1">Endpoint IP:Port</label>
                        <input
                            id="map-endpoint"
                            type="text"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            placeholder="10.10.10.10:8080"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label htmlFor="map-path" className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                        <input
                            id="map-path"
                            type="text"
                            value={pathValue}
                            onChange={(e) => setPathValue(e.target.value)}
                            placeholder="/"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Target preview: {scheme}://{endpoint || '127.0.0.1:8080'}{(pathValue || '/').startsWith('/') ? (pathValue || '/') : `/${pathValue || ''}`}
                        </p>
                    </div>

                    <div>
                        <a
                            href="http://10.224.100.4:1337/#!/services"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Advance config
                        </a>
                    </div>

                    {error && <div className="text-sm text-red-600">{error}</div>}
                    {success && <div className="text-sm text-green-600">{success}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'กำลังสร้าง...' : 'Create Service + Route'}
                        </button>
                    </div>
                </form>

                {result && (
                    <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                        <div><span className="font-medium">Service:</span> {result.serviceName}</div>
                        <div><span className="font-medium">Route:</span> {result.routeName}</div>
                        <div><span className="font-medium">Target URL:</span> {result.targetUrl}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
