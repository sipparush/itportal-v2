'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CreateEC2Page() {
    const [projectName, setProjectName] = useState('');
    const [instanceName, setInstanceName] = useState('');
    const [instanceType, setInstanceType] = useState('t3.micro');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleCreateInstance = async () => {
        setLoading(true);
        setResult(null);
        try {
            const response = await fetch('/api/operations/aws/nonprod/createec2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName, instanceName, instanceType })
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Create EC2 Instance on AWS-NonProd</h1>



            <div className="mb-4">
                <label className="block mb-2">Project Name</label>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="border p-2 w-full"
                    placeholder="e.g. non-Mean-ekyc , chg-Kidd-join , non-all-charge"
                />
            </div>
            {/* <div className="mb-4">
                <label className="block mb-2">Project Name</label>
                <div className="flex items-center">
                    <input className='mx-2'
                        type="radio" name='changeable'
                    /> Charge &nbsp;&nbsp;
                    <input className='mx-2'
                        type="radio" name='changeable'
                    /> Charge
                </div>
            </div>
            <div className="mb-4">
                <label className="block mb-2">Owner</label>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="border p-2 w-full"
                    placeholder="e.g. non-Mean-ekyc , chg-Kidd-join , non-all-charge"
                />
            </div> */}
            <div className="mb-4">
                <label className="block mb-2">Instance Name</label>
                <input
                    type="text"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    className="border p-2 w-full"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-2">Instance Type</label>
                <input
                    type="text"
                    value={instanceType}
                    onChange={(e) => setInstanceType(e.target.value)}
                    className="border p-2 w-full"
                />
            </div>
            <button
                onClick={handleCreateInstance}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Create Instance'}
            </button>
            <div className='my-5'>
                <Link href='https://ap-southeast-1.console.aws.amazon.com/ec2/home?region=ap-southeast-1#Instances:v=3;$case=tags:true%5C,client:false;$regex=tags:false%5C,client:false'>For Advace configuration</Link>
            </div>

            {result && (
                <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className="font-semibold">{result.message}</p>

                    {result.details && result.details.privateIp && (
                        <div className="mt-2 p-3 bg-white rounded border border-green-200">
                            <span className="text-gray-600 font-medium">Private IP: </span>
                            <span className="text-xl font-bold text-green-700 ml-2">{result.details.privateIp}</span>
                        </div>
                    )}

                    {result.details && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-1">Raw Details:</p>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-60 border">{JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
