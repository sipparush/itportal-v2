'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function MapUrlPage() {
    const [formData, setFormData] = useState({
        fqdn: '',
        destinationIp: '',
        destinationPort: '',
        notes: ''
    });

    const [result, setResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);

        try {
            const response = await fetch('/api/operations/aws/nonprod/mapurl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setResult(data);
            } else {
                alert('Error: ' + (data.message || 'Something went wrong'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

                        {/* <div className="border-t border-gray-200 pt-4 mt-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Generated Command</h4>
                            <div className="bg-slate-800 text-green-400 p-3 rounded font-mono text-xs break-all relative group">
                                {result.details.generatedCommand}
                                <button
                                    onClick={() => navigator.clipboard.writeText(result.details.generatedCommand)}
                                    className="absolute top-2 right-2 p-1 bg-slate-700 hover:bg-slate-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copy to clipboard"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 italic">* โปรดนำคำสั่งนี้ไปรันที่ Bastion Host เพื่อดำเนินการ</p>
                        </div> */}
                    </div>

                    <button
                        onClick={() => {
                            setResult(null);
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
                    <h1 className="text-2xl font-bold text-gray-900">Map URL to Endpoint (Non-Prod)</h1>
                    <p className="text-gray-600 mt-1">กรอกข้อมูลเพื่อทำการจับคู่ URL กับ Endpoint ปลายทางสำหรับ environment AWS Non-Production</p>
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
                                placeholder="e.g. uat-api.example.com"
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

                        <Link target="_blank" href="https://kong-ui-uat.jfin.network/services" className="text-blue-600 hover:underline">For Advanced configuration.</Link>

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
