'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/login';

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Check login status on component mount
        const checkLoginStatus = () => {
            const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const user = localStorage.getItem('username');
            setIsLoggedIn(loggedIn);
            if (user) setUsername(user);
        };

        checkLoginStatus();

        // Optional: Add event listener for storage changes if you want multi-tab sync
        window.addEventListener('storage', checkLoginStatus);
        return () => window.removeEventListener('storage', checkLoginStatus);
    }, [pathname]); // Re-check on route change

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setUsername('');
        router.push('/');
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900 group flex items-center gap-2">
                            <span className="text-blue-600 group-hover:text-blue-700 transition-colors">IT</span> Portal
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex space-x-8">
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors border-b-2 py-5 ${pathname === '/' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'}`}
                        >
                            หน้าแรก
                        </Link>
                        {isLoggedIn && (
                            <Link
                                href="/home"
                                className={`text-sm font-medium transition-colors border-b-2 py-5 ${pathname === '/home' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'}`}
                            >
                                แดชบอร์ด
                            </Link>
                        )}
                        <Link
                            href="/contact"
                            className={`text-sm font-medium transition-colors border-b-2 py-5 ${pathname === '/contact' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'}`}
                        >
                            ติดต่อฝ่ายไอที
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-700 hidden sm:inline">
                                    สวัสดี, <span className="font-semibold text-gray-900">{username || 'User'}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-all"
                                >
                                    ออกจากระบบ
                                </button>
                            </div>
                        ) : (
                            !isLoginPage && (
                                <Link
                                    href="/login"
                                    className="bg-blue-600 hover:bg-blue-700 !text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow"
                                >
                                    เข้าสู่ระบบ
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
