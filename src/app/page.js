import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-1/">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
          ศูนย์บริการไอทีครบวงจร
          <span className="block text-blue-600 mt-2">เพื่อพนักงานทุกคน</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed">
          แจ้งปัญหา ขออุปกรณ์ หรือค้นหาข้อมูลช่วยเหลือเบื้องต้นได้ที่นี่
          เราพร้อมดูแลระบบไอทีเพื่อให้การทำงานของคุณราบรื่นที่สุด
        </p>
        <div className="flex justify-center gap-4 pt-4">

          <Link
            href="/contact"
            className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-8 py-3 rounded-lg text-lg font-medium shadow-sm hover:shadow transition-all"
          >
            ติดต่อเรา
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="grid md:grid-cols-3 gap-8 px-4">
        {/* Card 1 */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">แจ้งปัญหาระบบ (Incident request)</h3>
          <p className="text-gray-600 leading-relaxed">
            คอมพิวเตอร์ช้า, ปริ้นไม่ออก, หรือโปรแกรมมีปัญหา แจ้งเราได้ทันที
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">แจ้งขอเปลี่ยนแปลง (Change request)</h3>
          <p className="text-gray-600 leading-relaxed">
            เบิกเม้าส์, คีย์บอร์ด, จอภาพ หรืออุปกรณ์ต่อพ่วงอื่นๆ สำหรับการทำงาน
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">คลังความรู้ (KB)</h3>
          <p className="text-gray-600 leading-relaxed">
            คู่มือการใช้งาน, วิธีแก้ไขปัญหาเบื้องต้นด้วยตนเอง, และทริคไอที
          </p>
        </div>
      </section>
    </div>
  );
}
