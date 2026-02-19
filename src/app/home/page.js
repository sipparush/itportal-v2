'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    // Protected Route Check
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            router.push('/login');
        } else {
            setUsername(localStorage.getItem('username') || 'User');
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    สวัสดีคุณ {username}
                </h1>
                <p className="text-gray-600">
                    ยินดีต้อนรับสู่ IT Portal แดชบอร์ดของคุณพร้อมใช้งานแล้ว
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Ticket Status - Active */}
                {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">งานแจ้งซ่อมของฉัน</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            กำลังดำเนินงาน (1)
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-md text-sm border border-gray-100">
                            <p className="font-medium text-gray-900">คอมพิวเตอร์เปิดไม่ติด</p>
                            <p className="text-gray-500 text-xs mt-1">แจ้งเมื่อ: 19 ก.พ. 2569</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                            ดูรายการทั้งหมด &rarr;
                        </Link>
                    </div>
                </div> */}

                {/* IT Operations */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">IT Operations</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-6">
                        จัดการและตรวจสอบสถานะ Cloud Infrastructure (AWS, BytePlus, Huawei, GCP)
                    </p>
                    <div className="grid grid-cols-1">
                        <Link
                            href="/operations"
                            className="flex items-center justify-center px-4 py-2 border border-blue-200 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                            ไปที่ Operations Dashboard
                        </Link>
                    </div>
                </div>

                {/* New Request */}
                {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">แจ้งปัญหาใหม่</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-6">
                        พบปัญหาการใช้งานอุปกรณ์ หรือซอฟต์แวร์ สามารถแจ้งเรื่องได้ทันที
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium !text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                            แจ้งซ่อม
                        </button>
                        <button className="flex items-center justify-center px-4 py-2 border border-blue-200 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                            ขออุปกรณ์
                        </button>
                    </div>
                </div> */}

                {/* Knowledge Base */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">คู่มือแนะนำ</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li>
                            <a href="#" className="hover:text-blue-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                วิธีตั้งค่า VPN สำหรับ Work from Home
                            </a>
                        </li>
                        <li>
                            <a href="#" className="hover:text-blue-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                การเปลี่ยนรหัสผ่านอีเมลบริษัท
                            </a>
                        </li>
                        <li>
                            <a href="#" className="hover:text-blue-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                ติดตั้ง Printer ชั้น 3
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
