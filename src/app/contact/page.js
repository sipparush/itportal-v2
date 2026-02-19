export default function ContactPage() {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">ติดต่อฝ่ายไอที (IT Support)</h1>
                <p className="text-gray-600 text-lg">
                    หากพบปัญหาการใช้งาน หรือต้องการความช่วยเหลือ สามารถติดต่อทีมงานได้ตามข้อมูลด้านล่าง
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Contact Information Card */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center border-b pb-4">
                        <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        ทีมงานดูแลระบบ (IT Team)
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                T
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Thitithan Bumroongchok</h3>
                                <p className="text-sm text-blue-600 font-medium">Response domain: IT Compliance</p>
                                <div className="mt-2 flex items-center text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    <a href="mailto:thitithan@jventures.co.th" className="hover:text-blue-600 hover:underline">
                                        thitithan@jventures.co.th
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                S
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Sipparush Laekan</h3>
                                <p className="text-sm text-blue-600 font-medium">Response domain: IT Operations/Consult/Systems</p>
                                <div className="mt-2 flex items-center text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    <a href="mailto:sipparush@jventure.co.th" className="hover:text-blue-600 hover:underline">
                                        sipparush@jventure.co.th
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                C
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Chokanan Pangket</h3>
                                <p className="text-sm text-blue-600 font-medium">Response domain: IT Operations/Consult/Security</p>
                                <div className="mt-2 flex items-center text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    <a href="mailto:chokanan@jventures.co.th" className="hover:text-blue-600 hover:underline">
                                        chokanan@jventures.co.th
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Office Hours & Location */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center border-b pb-4">
                            <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            เวลาทำการ (Working Hours)
                        </h2>
                        <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-100">
                            <span className="font-medium text-gray-700">จันทร์ - ศุกร์</span>
                            <span className="font-bold text-green-700 text-lg">09:00 - 18:00</span>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            * นอกเวลาทำการ กรุณาส่งอีเมลทิ้งไว้ ทีมงานจะรีบติดต่อกลับในวันทำการถัดไป
                        </p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                        <h3 className="text-blue-800 font-semibold mb-2">แจ้งปัญหาเร่งด่วน (Urgent Case)</h3>
                        <p className="text-blue-600 text-sm mb-4">
                            กรณีระบบล่ม หรือไม่สามารถทำงานได้ ติดต่อ Hotline
                        </p>
                        <a href="tel:021234567" className="bg-blue-600 !text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-sm">
                            โทร 02-xxx-xxxx
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
