'use client';

import { useState } from 'react';
import Link from 'next/link';

const DEFAULT_REGION = 'ap-southeast-1';
const ENVIRONMENT_BADGE_STYLES = {
    prod: 'bg-red-100 text-red-700 border border-red-200',
    nonprod: 'bg-green-100 text-green-700 border border-green-200'
};

function sortResults(results) {
    const environmentOrder = { nonprod: 0, prod: 1 };
    const stateOrder = { running: 0, pending: 1, stopping: 2, stopped: 3 };

    return [...results].sort((left, right) => {
        const environmentDiff = (environmentOrder[left.environment] ?? 99) - (environmentOrder[right.environment] ?? 99);
        if (environmentDiff !== 0) {
            return environmentDiff;
        }

        const stateDiff = (stateOrder[left.state] ?? 99) - (stateOrder[right.state] ?? 99);
        if (stateDiff !== 0) {
            return stateDiff;
        }

        return left.name.localeCompare(right.name);
    });
}

export default function Ec2ByTagPage() {
    const [tagValue, setTagValue] = useState('');
    const [region, setRegion] = useState(DEFAULT_REGION);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const normalizedTagValue = tagValue.trim();

        if (!normalizedTagValue) {
            setError('Please provide a tag value.');
            setResult(null);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/operations/aws/ec2-by-tag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tagValue: normalizedTagValue,
                    region: region.trim() || DEFAULT_REGION
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Search failed');
            }

            setResult(data);
        } catch (requestError) {
            setResult(null);
            setError(requestError.message);
        } finally {
            setIsLoading(false);
        }
    };

    const sortedResults = result ? sortResults(result.results || []) : [];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <nav className="text-sm text-gray-500">
                <ol className="flex items-center gap-2 flex-wrap">
                    <li><Link href="/home" className="hover:text-blue-600">แดชบอร์ด</Link></li>
                    <li>/</li>
                    <li><Link href="/operations" className="hover:text-blue-600">IT Operations</Link></li>
                    <li>/</li>
                    <li className="text-gray-700">List EC2 Instances by Tagged</li>
                </ol>
            </nav>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="border-b border-gray-200 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">List EC2 Instances by Tagged</h1>
                    <p className="text-gray-600 mt-1">
                        ค้นหา EC2 ทั้ง Production และ Non-Production จากค่า tag `project` เดียวกัน
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[2fr_1fr_auto] items-end">
                    <div>
                        <label htmlFor="tagValue" className="block text-sm font-medium text-gray-700 mb-2">
                            Tag Value
                        </label>
                        <input
                            id="tagValue"
                            type="text"
                            value={tagValue}
                            onChange={(event) => setTagValue(event.target.value)}
                            placeholder="เช่น non-Kidd-pah"
                            className="block w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                            AWS Region
                        </label>
                        <input
                            id="region"
                            type="text"
                            value={region}
                            onChange={(event) => setRegion(event.target.value)}
                            className="block w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex h-[42px] items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium !text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Searching...' : 'Search EC2'}
                    </button>
                </form>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p>Local default profiles: prod ใช้ `aws_prod`, nonprod ใช้ `aws_nonprod`</p>
                    <p>สำหรับ deploy server อื่น สามารถ override ด้วย env `AWS_PROD_PROFILE`, `AWS_NONPROD_PROFILE`, และ `AWS_EC2_TAG_SEARCH_REGION`</p>
                </div>

                {error ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                ) : null}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Result Panel</h2>
                        <p className="text-sm text-gray-600">แสดงผลลัพธ์รวมในตารางเดียว โดยค่าทุกคอลัมน์อ้างอิงจากข้อมูลจริงที่ AWS CLI คืนมา</p>
                    </div>
                    {result ? (
                        <div className="text-sm text-gray-600 text-right space-y-1">
                            <div>Total: <span className="font-semibold text-gray-900">{result.total}</span></div>
                            <div>Region: <span className="font-mono text-gray-900">{result.region}</span></div>
                            <div>Tag: <span className="font-mono text-gray-900">{result.tagValue}</span></div>
                        </div>
                    ) : null}
                </div>

                {!result ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                        ป้อน tag value แล้วกด Search EC2 เพื่อดูรายการ instance
                    </div>
                ) : result.results.length === 0 ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
                        ไม่พบ EC2 ที่ tag `project` ตรงกับค่า `{result.tagValue}` ในทั้งสอง environment
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {result.environments.map((environment) => (
                                <div key={environment.environment} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ENVIRONMENT_BADGE_STYLES[environment.environment] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                            {environment.environmentLabel}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">{environment.instances.length}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">profile <span className="font-mono text-gray-700">{environment.profile}</span></div>
                                </div>
                            ))}
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Env</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Instance ID</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Project</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">State</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Instance Type</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Availability Zone</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Private IP</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Public IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {sortedResults.map((item) => (
                                        <tr key={`${item.environment}-${item.instanceId}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ENVIRONMENT_BADGE_STYLES[item.environment] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                                    {item.environment}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-900">{item.instanceId}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.name}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.project}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.state}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.instanceType}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.availabilityZone}</td>
                                            <td className="px-4 py-3 font-mono text-gray-700">{item.privateIp}</td>
                                            <td className="px-4 py-3 font-mono text-gray-700">{item.publicIp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}