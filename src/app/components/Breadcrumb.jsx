'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumb() {
    const pathname = usePathname();

    // Define route mapping for prettier names
    const routeNameMap = {
        'home': 'แดชบอร์ด',
        'login': 'เข้าสู่ระบบ',
        'contact': 'ติดต่อเรา',
        'operations': 'IT Operations',
    };

    // Skip showing global breadcrumb on Operations page because it handles its own
    // to show dynamic tab breadcrumbs.
    // Also skip on Landing page (/)
    if (pathname === '/operations' || pathname === '/') return null;

    const pathSegments = pathname.split('/').filter(segment => segment);

    // If path is just /home, we can show "Dashboard" as active, or maybe nothing if it's the root of breadcrumb.
    // Let's decide: User wants "Dashboard > IT Operations > aws".
    // This implies Dashboard is the root.

    if (pathSegments.length === 0) return null;

    return (
        <nav className="flex px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
            <div className="max-w-7xl w-full mx-auto">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    {/* Root Item: Dashboard */}
                    <li className="inline-flex items-center">
                        <Link href="/home" className="text-gray-500 hover:text-blue-600 font-medium text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                            แดชบอร์ด
                        </Link>
                    </li>

                    {pathSegments.map((segment, index) => {
                        // Skip 'home' in the loop since we hardcoded it as root above
                        if (segment === 'home') return null;

                        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                        const isLast = index === pathSegments.length - 1;
                        const label = routeNameMap[segment] || segment;

                        return (
                            <li key={segment}>
                                <div className="flex items-center">
                                    <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                    </svg>
                                    {isLast ? (
                                        <span className="text-gray-500 font-medium text-sm">{label}</span>
                                    ) : (
                                        <Link href={href} className="text-gray-500 hover:text-blue-600 font-medium text-sm">
                                            {label}
                                        </Link>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
}
