'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddUserAccessPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        serverIps: '',
        users: [{ username: '', email: '' }]
    });

    const [result, setResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);

        try {
            const response = await fetch('/api/operations/aws/prod/adduser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIpChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, serverIps: value }));
    };

    const handleUserChange = (index, field, value) => {
        const newUsers = [...formData.users];
        newUsers[index][field] = value;
        setFormData(prev => ({ ...prev, users: newUsers }));
    };

    const addUser = () => {
        setFormData(prev => ({
            ...prev,
            users: [...prev.users, { username: '', email: '' }]
        }));
    };

    const removeUser = (index) => {
        if (formData.users.length === 1) return;
        const newUsers = formData.users.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, users: newUsers }));
    };

    if (result) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully</h2>
                    <p className="text-gray-600 mb-6">{result.message}</p>

                    <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-100 mb-6 font-mono text-sm leading-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-700">Accounts ({result.details.users.length}):</h4>
                                <ul className="list-disc pl-5 text-gray-600">
                                    {result.details.users.map((u, i) => (
                                        <li key={i}>{u.username} <span className="text-gray-400 text-xs">({u.email})</span></li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700">Servers ({result.details.servers.length}):</h4>
                                <ul className="list-disc pl-5 text-gray-600">
                                    {result.details.servers.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p><span className="font-semibold">Job ID:</span> {result.details.jobId}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setResult(null);
                            setFormData({ serverIps: '', users: [{ username: '', email: '' }] });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                        New Request
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Add User Access (Prod)</h1>
                    <p className="text-gray-600 mt-1">Request access for specific accounts on one or more servers.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="serverIps" className="block text-sm font-medium text-gray-700 mb-1">
                            Server IPs (One per line) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="serverIps"
                            name="serverIps"
                            required
                            rows={4}
                            placeholder="e.g. 10.241.11.12&#10;10.241.15.13"
                            value={formData.serverIps}
                            onChange={handleIpChange}
                            className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">List the IP addresses where access should be granted.</p>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">User Accounts</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-5">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Account / Username <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <div className="col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Requester Email <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <div className="col-span-1"></div>
                            </div>

                            {formData.users.map((user, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-start">
                                    <div className="col-span-5">
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. sipparush.la"
                                            value={user.username}
                                            onChange={(e) => handleUserChange(index, 'username', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div className="col-span-6">
                                        <input
                                            type="email"
                                            required
                                            placeholder="e.g. sipparush@jventures.co.th"
                                            value={user.email}
                                            onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1 pt-1 flex justify-center">
                                        {index === 0 ? (
                                            <button
                                                type="button"
                                                onClick={addUser}
                                                className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                title="Add another user"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => removeUser(index)}
                                                className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 focus:outline-none transition-colors"
                                                title="Remove user"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
