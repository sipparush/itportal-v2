'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ByteplusCreateVpnPage() {
    const [vpnName, setVpnName] = useState('');
    const [vpnEmail, setVpnEmail] = useState('');
    const [vpnLoading, setVpnLoading] = useState(false);
    const [vpnError, setVpnError] = useState('');
    const [vpnSuccess, setVpnSuccess] = useState('');
    const [vpnDownloadName, setVpnDownloadName] = useState('');
    const [vpnDownloadBase64, setVpnDownloadBase64] = useState('');

    const downloadOvpn = (fileName, fileContentBase64) => {
        const binary = atob(fileContentBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'application/x-openvpn-profile' });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
    };

    const handleCreateVpnAccount = async (e) => {
        e.preventDefault();
        setVpnError('');
        setVpnSuccess('');
        setVpnDownloadName('');
        setVpnDownloadBase64('');

        if (!vpnName.trim() || !vpnEmail.trim()) {
            setVpnError('กรุณากรอกข้อมูล Name และ Email ให้ครบถ้วน');
            return;
        }

        setVpnLoading(true);

        try {
            const response = await fetch('/api/operations/byteplus/create-vpn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: vpnName.trim(),
                    email: vpnEmail.trim(),
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setVpnError(result.message || 'ไม่สามารถสร้าง VPN account ได้');
                return;
            }

            setVpnDownloadName(result.fileName);
            setVpnDownloadBase64(result.fileContentBase64);
            downloadOvpn(result.fileName, result.fileContentBase64);

            setVpnSuccess(`สร้าง VPN account สำเร็จ และดาวน์โหลดไฟล์ ${result.fileName} แล้ว`);
        } catch (error) {
            setVpnError(error.message || 'เกิดข้อผิดพลาดระหว่างสร้าง VPN account');
        } finally {
            setVpnLoading(false);
        }
    };

    const handleDownloadVpnFile = () => {
        if (!vpnDownloadBase64 || !vpnDownloadName) {
            return;
        }

        downloadOvpn(vpnDownloadName, vpnDownloadBase64);
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
                                <span className="text-gray-500 font-medium text-sm">Create VPN Account</span>
                            </div>
                        </li>
                    </ol>
                </div>
            </nav>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">BytePlus - Create VPN Account</h1>
                <p className="text-gray-600">กรอกข้อมูลผู้ใช้งานเพื่อสร้างไฟล์ VPN profile (.ovpn)</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <form onSubmit={handleCreateVpnAccount} className="space-y-4">
                    <div>
                        <label htmlFor="vpn-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            id="vpn-name"
                            type="text"
                            value={vpnName}
                            onChange={(e) => setVpnName(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="เช่น somchai"
                            disabled={vpnLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="vpn-email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="vpn-email"
                            type="email"
                            value={vpnEmail}
                            onChange={(e) => setVpnEmail(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="name@company.com"
                            disabled={vpnLoading}
                        />
                    </div>

                    {vpnError && <div className="text-sm text-red-600">{vpnError}</div>}
                    {vpnSuccess && <div className="text-sm text-green-600">{vpnSuccess}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={vpnLoading}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {vpnLoading ? 'กำลังสร้าง...' : 'Create VPN Account'}
                        </button>

                        {vpnDownloadBase64 && vpnDownloadName && (
                            <button
                                type="button"
                                onClick={handleDownloadVpnFile}
                                className="ml-2 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                            >
                                Download {vpnDownloadName}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
