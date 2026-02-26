'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function OperationsPage() {
    const [activeTab, setActiveTab] = useState('aws');

    const tabs = [
        { id: 'aws', label: 'AWS', icon: '☁️' },
        { id: 'byteplus', label: 'BytePlus', icon: '🔋' }, // Placeholder icon
        { id: 'huawei', label: 'Huawei Cloud', icon: '🔴' },
        { id: 'gcp', label: 'GCP', icon: '🔵' },
    ];

    return (
        <div className="space-y-6">
            {/* Custom Breadcrumb for Operations Page with Tab Support */}
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
                        <li aria-current="page">
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                </svg>
                                <span className="text-gray-500 font-medium text-sm">{tabs.find(t => t.id === activeTab)?.label}</span>
                            </div>
                        </li>
                    </ol>
                </div>
            </nav>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">IT Operations Dashboard</h1>
                <p className="text-gray-600">สถานะและเครื่องมือจัดการ Cloud Infrastructure</p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[400px]">
                {activeTab === 'aws' && (
                    <div className="space-y-8">
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">AWS Operations</h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Production Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <h3 className="font-bold text-lg text-gray-900">Production (PROD)</h3>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                    <ul className="space-y-3">
                                        <li>
                                            <a href="/operations/aws/prod/mapurl" className="flex items-center text-gray-700 hover:text-red-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                                <span className="font-medium">Map URL to Endpoint</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="/operations/aws/prod/adduser" className="flex items-center text-gray-700 hover:text-red-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                                                <span className="font-medium">Add User Access(OS or VPN)</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="flex items-center text-gray-700 hover:text-red-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                <span className="font-medium">Create EC2 Instance</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="https://api-monitor.jventures.co.th/" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-red-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                <span className="font-medium">Monitor API</span>
                                            </a>
                                        </li>

                                    </ul>
                                </div>
                            </div>

                            {/* Non-Production Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    <h3 className="font-bold text-lg text-gray-900">Non-Production (UAT/DEV)</h3>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                    <ul className="space-y-3">
                                        <li>
                                            <Link href="/operations/aws/nonprod/mapurl" className="flex items-center text-gray-700 hover:text-green-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                                <span className="font-medium">Map URL to Endpoint (Dev)</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/operations/aws/nonprod/adduser" className="flex items-center text-gray-700 hover:text-green-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                                                <span className="font-medium">Add User Access (OS or VPN)</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <a href="/operations/aws/nonprod/backup-readiness" className="flex items-center text-gray-700 hover:text-green-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                                <span className="font-medium">EC2 Backup Readiness</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="/operations/aws/nonprod/deploy-uat" className="flex items-center text-gray-700 hover:text-green-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                                <span className="font-medium">Deploy to UAT (t3.small with staging)</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="flex items-center text-gray-700 hover:text-green-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                <span className="font-medium">Create Test S3 Bucket</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="flex items-center text-gray-700 hover:text-green-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                <span className="font-medium">List EC2 Instances</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="/operations/aws/nonprod/billing" className="flex items-center text-gray-700 hover:text-green-600 transition-colors group">
                                                <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                <span className="font-medium">Billing and cost explorer</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'byteplus' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">BytePlus Operations</h2>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2">Create VPN Account</h3>
                            <p className="text-sm text-gray-600 mb-3">ไปยังหน้าสำหรับกรอกข้อมูลและสร้างไฟล์ VPN (.ovpn)</p>
                            <Link
                                href="/operations/byteplus/create-vpn"
                                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium !text-white hover:bg-blue-700"
                            >
                                Open Create VPN Form
                            </Link>
                        </div>
                    </div>
                )}

                {activeTab === 'huawei' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Huawei Cloud Operations</h2>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                            <h3 className="font-semibold text-gray-800">OBS Storage</h3>
                            <p className="text-sm text-gray-600">Total stored: 2.1 TB</p>
                        </div>
                        {/* Add Huawei Cloud specific content here */}
                    </div>
                )}

                {activeTab === 'gcp' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Google Cloud Platform Operations</h2>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                            <h3 className="font-semibold text-gray-800">BigQuery</h3>
                            <p className="text-sm text-gray-600">Last query: 2 mins ago</p>
                        </div>
                        {/* Add GCP specific content here */}
                    </div>
                )}
            </div>
        </div>
    );
}
