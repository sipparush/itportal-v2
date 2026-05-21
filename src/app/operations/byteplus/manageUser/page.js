'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'byteplus-manage-user-records-v1';
const PAGE_SIZE = 5;

const emptyForm = {
    id: null,
    account: '',
    remoteIps: ''
};

function normalizeRemoteIps(rawValue) {
    return Array.from(
        new Set(
            String(rawValue)
                .split(/[\n,]/)
                .map((value) => value.trim())
                .filter(Boolean)
        )
    );
}

function buildRemoteIpTextarea(vmAccess) {
    return vmAccess.map((entry) => entry.ip).join('\n');
}

export default function ManageUserPage() {
    const [records, setRecords] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [formData, setFormData] = useState(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return;
        }

        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                setRecords(parsed);
            }
        } catch {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }, [records]);

    const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const pagedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        return records.slice(startIndex, startIndex + PAGE_SIZE);
    }, [currentPage, records]);

    const openCreateModal = () => {
        setFormMode('create');
        setFormData(emptyForm);
        setFeedback(null);
        setIsModalOpen(true);
    };

    const openEditModal = (record) => {
        setFormMode('update');
        setFormData({
            id: record.id,
            account: record.account,
            remoteIps: buildRemoteIpTextarea(record.vmAccess)
        });
        setFeedback(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (isSubmitting) {
            return;
        }

        setIsModalOpen(false);
        setFormData(emptyForm);
    };

    const handleDownloadKey = (entry) => {
        if (!entry.downloadUrl) {
            setFeedback({
                type: 'error',
                message: `ไม่พบไฟล์ key สำหรับ ${entry.ip}`
            });
            return;
        }

        window.open(entry.downloadUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDeleteRecord = (recordId) => {
        const confirmed = window.confirm('ลบรายการนี้ออกจากหน้าจัดการหรือไม่? การลบนี้จะลบเฉพาะรายการในหน้าเว็บ ยังไม่ลบ user ออกจากเครื่องปลายทาง');

        if (!confirmed) {
            return;
        }

        setRecords((current) => current.filter((record) => record.id !== recordId));
        setFeedback({
            type: 'success',
            message: 'ลบรายการออกจากหน้าจัดการแล้ว'
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const remoteIps = normalizeRemoteIps(formData.remoteIps);
        if (!formData.account.trim() || remoteIps.length === 0) {
            setFeedback({
                type: 'error',
                message: 'กรุณากรอก account และ remote IP อย่างน้อย 1 รายการ'
            });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            const response = await fetch('/api/operations/byteplus/manageUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: formMode,
                    account: formData.account,
                    remoteIps
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Manage user failed');
            }

            const nextRecord = {
                id: formMode === 'update' ? formData.id : data.record.id,
                account: data.record.account,
                vmAccess: data.record.vmAccess,
                updatedAt: data.record.updatedAt,
                executionSummary: data.record.executionSummary
            };

            setRecords((current) => {
                if (formMode === 'update') {
                    return current.map((record) => (
                        record.id === formData.id ? nextRecord : record
                    ));
                }

                return [nextRecord, ...current];
            });

            setFeedback({
                type: 'success',
                message: data.message
            });
            setIsModalOpen(false);
            setFormData(emptyForm);
            setCurrentPage(1);
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 print:max-w-none">
            <section className="rounded-2xl border-4 border-gray-900 bg-white px-6 py-8 shadow-sm print:border-0 print:shadow-none sm:px-10">
                <div className="mb-6 flex flex-col gap-4 border-b-4 border-gray-900 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">User Access BytePlus</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            กรอก account และ remote IP เพื่อให้ระบบเรียกสคริปต์เพิ่มสิทธิ์ใช้งานบนเครื่องปลายทาง
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 print:hidden">
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="border-4 border-gray-900 bg-lime-400 px-5 py-2 text-lg font-black text-gray-900 transition hover:bg-lime-300"
                        >
                            Add User
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="border-4 border-gray-900 bg-sky-100 px-5 py-2 text-lg font-black text-gray-900 transition hover:bg-sky-200"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>

                {feedback ? (
                    <div
                        className={`mb-6 border-2 px-4 py-3 text-sm font-semibold ${feedback.type === 'success'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                            : 'border-red-700 bg-red-50 text-red-900'
                            }`}
                    >
                        {feedback.message}
                    </div>
                ) : null}

                <div className="overflow-x-auto">
                    <table className="min-w-full border-4 border-gray-900 text-left text-lg">
                        <thead>
                            <tr className="bg-sky-200 text-gray-900">
                                <th className="border-r-4 border-gray-900 px-4 py-4 font-black">account</th>
                                <th className="border-r-4 border-gray-900 px-4 py-4 font-black">VM access</th>
                                <th className="px-4 py-4 text-center font-black">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-10 text-center text-base font-semibold text-gray-500">
                                        ยังไม่มีรายการผู้ใช้ กด Add User เพื่อเริ่มเพิ่ม account และ remote IP
                                    </td>
                                </tr>
                            ) : (
                                pagedRecords.map((record) => (
                                    <tr key={record.id} className="align-top even:bg-gray-50">
                                        <td className="border-r-4 border-t-4 border-gray-900 px-4 py-5 font-black text-gray-900">
                                            <div>{record.account}</div>
                                            <div className="mt-3 text-xs font-medium text-gray-500">
                                                Updated: {new Date(record.updatedAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="border-r-4 border-t-4 border-gray-900 px-4 py-5">
                                            <div className="space-y-3">
                                                {record.vmAccess.map((entry) => (
                                                    <div key={`${record.id}-${entry.ip}`} className="flex flex-wrap items-center gap-3">
                                                        <span className="min-w-[180px] font-black text-gray-900">{entry.ip}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadKey(entry)}
                                                            className="border-4 border-gray-900 bg-amber-100 px-3 py-1 text-base font-black text-gray-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                                                            disabled={!entry.downloadUrl}
                                                        >
                                                            Key
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="border-t-4 border-gray-900 px-4 py-5">
                                            <div className="flex flex-col items-center gap-4 print:hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(record)}
                                                    className="min-w-[90px] border-4 border-gray-900 bg-amber-100 px-4 py-1 font-black text-gray-900 transition hover:bg-amber-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRecord(record.id)}
                                                    className="min-w-[90px] border-4 border-gray-900 bg-orange-400 px-4 py-1 font-black text-gray-900 transition hover:bg-orange-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex flex-col gap-4 text-lg font-black text-gray-900 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex items-center gap-3 print:hidden">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="border-4 border-indigo-500 bg-cyan-100 px-4 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {'<<'}
                        </button>
                        <span>{currentPage}</span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                            className="border-4 border-indigo-500 bg-cyan-100 px-4 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {'>>'}
                        </button>
                    </div>
                    <span>{records.length} users</span>
                </div>

                <p className="mt-6 text-sm text-gray-500 print:hidden">
                    หมายเหตุ: ปุ่ม Delete จะลบเฉพาะรายการในหน้าจอนี้ เนื่องจากสคริปต์ปัจจุบันรองรับการสร้าง user และ key เท่านั้น ยังไม่รองรับการลบ user บนเครื่องปลายทาง
                </p>
            </section>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
                    <div className="w-full max-w-2xl rounded-2xl border-4 border-gray-900 bg-white p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">
                                    {formMode === 'create' ? 'Add User Access' : 'Edit User Access'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    ระบบจะส่ง account และ remote IP ไปที่สคริปต์ `/home/sipparush/adduservendorbp.sh`
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-sm font-bold text-gray-500 hover:text-gray-800"
                            >
                                Close
                            </button>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="account" className="mb-2 block text-sm font-bold text-gray-700">
                                    Account
                                </label>
                                <input
                                    id="account"
                                    type="text"
                                    required
                                    value={formData.account}
                                    onChange={(event) => setFormData((current) => ({
                                        ...current,
                                        account: event.target.value
                                    }))}
                                    placeholder="เช่น sipparush.la-jvc"
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500"
                                />
                                <p className="mt-2 text-xs text-gray-500">ใช้ได้เฉพาะตัวอักษร ตัวเลข `_` และ `-` โดยห้ามมีช่องว่าง</p>
                            </div>

                            <div>
                                <label htmlFor="remoteIps" className="mb-2 block text-sm font-bold text-gray-700">
                                    Remote IP
                                </label>
                                <textarea
                                    id="remoteIps"
                                    required
                                    rows={6}
                                    value={formData.remoteIps}
                                    onChange={(event) => setFormData((current) => ({
                                        ...current,
                                        remoteIps: event.target.value
                                    }))}
                                    placeholder={'เช่น 10.244.100.21\n10.244.100.23'}
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-3 font-mono text-base text-gray-900 outline-none transition focus:border-blue-500"
                                />
                                <p className="mt-2 text-xs text-gray-500">กรอกได้หลาย IP โดยแยกบรรทัดหรือคั่นด้วย comma</p>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border-2 border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-md border-2 border-gray-900 bg-lime-400 px-5 py-2 text-sm font-black text-gray-900 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Processing...' : formMode === 'create' ? 'Run Script' : 'Update Access'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}