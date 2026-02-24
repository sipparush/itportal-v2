# แผนการดำเนินการ Implement Features (Implementation Plan)

เอกสารนี้แสดงรายละเอียดแผนงานสำหรับการพัฒนาระบบ IT Portal v2 ตามคำขอ โดยเน้นเรื่องความปลอดภัยและการตรวจสอบสถานะของงาน

## สถานะปัจจุบัน
วันที่: 25 กุมภาพันธ์ 2026
ผู้ดำเนินการ: GitHub Copilot

## Request ล่าสุด: ปัญหา JS ไม่โหลดหลัง Mapping URL (Approved)

สถานะ: 🚧 In Progress

### หลักฐานที่รันแล้ว (2026-02-24)
- [x] `curl -sS -D - -o /tmp/ip.body http://10.240.1.202:3000`
- [x] `curl -sS -D - -o /tmp/domain.body https://itportal.jfin.network`
- [x] `curl -vkI https://itportal.jfin.network`
- [x] `openssl s_client ... | openssl x509 ...`
- [x] ตรวจสถานะไฟล์ JS ที่อ้างอิงจากหน้า HTML แล้ว (`/_next/static/chunks/*.js`) ตอบกลับ `200` ครบ

### ข้อค้นพบสำคัญ (Root Cause Candidate)
- [x] หน้า `https://itportal.jfin.network` ตอบกลับ `HTTP/2 200`
- [x] TLS certificate ถูกต้องกับโดเมนย่อย (`*.jfin.network` ครอบคลุม `itportal.jfin.network`)
- [x] ค่า `Cache-Control` ของหน้า HTML เป็น `s-maxage=31536000` (cache ยาวมาก)
- [x] สาเหตุที่เป็นไปได้สูง: Edge/Proxy cache หน้า HTML เก่านานเกินไป ทำให้หลัง deploy เกิดการอ้างอิงชื่อ chunk JS คนละเวอร์ชันและโหลดไม่ขึ้นบางช่วงเวลา

### แผนแก้ไขที่ดำเนินการแล้ว
- [x] ปรับ `next.config.mjs` ให้ตั้ง `Cache-Control: no-store` สำหรับหน้า non-static เพื่อลดปัญหา stale HTML

### Checklist รอบถัดไป (ต้องทำ)
- [ ] Deploy เวอร์ชันใหม่หลังแก้ header policy
- [ ] Purge cache ที่ CDN/Proxy (Cloudflare/Kong) สำหรับหน้า HTML หลัก
- [ ] Senior QA ทำ full test รอบใหม่ และบันทึกใน `full_test_result.md`
- [ ] ยืนยันว่าไม่มี JS chunk load error หลัง deploy ใหม่
- [ ] หากยังพบปัญหา ให้เก็บ Network HAR + Console error เพื่อวิเคราะห์ route/rewrite ต่อ

## Checklist การดำเนินการ

- [x] **1. เตรียมโครงสร้าง Project (Project Structure Setup)**
    - [x] สร้าง Next.js App
    - [x] ติดตั้ง Tailwind CSS
    - [x] สร้าง Layout หลักและ Global CSS

- [x] **2. หน้า Login (Login Page)**
    - [x] สร้าง UI/UX สำหรับ Login
    - [x] Mock Authentication (admin/password)
    - [x] จัดการ Session/State เบื้องต้น

- [x] **3. หน้า Dashboard (Main Dashboard)**
    - [x] Sidebar Navigation
    - [x] Topbar (UserInfo, Logout)
    - [x] Breadcrumbs Navigation

- [x] **4. ฟีเจอร์ Operations: Map URL (AWS Non-Prod)**
    - [x] สร้างหน้า Form UI (`src/app/operations/aws/nonprod/mapurl/page.js`)
    - [x] สร้าง API Route สำหรับประมวลผล (`src/app/api/operations/aws/nonprod/mapurl/route.js`)
    - [x] เชื่อมต่อ Frontend กับ Backend API
    - [x] แสดงผลลัพธ์ Command ที่ Generate ได้
    - [x] เพิ่ม Input Validation ฝั่ง Frontend
    - [x] เพิ่ม Input Validation ฝั่ง Backend

- [x] **5. ฟีเจอร์ Operations: Add User Access (AWS Non-Prod)**
    - [x] สร้างหน้า Form UI (`src/app/operations/aws/nonprod/adduser/page.js`)
    - [x] สร้าง API Route สำหรับประมวลผล (`src/app/api/operations/aws/nonprod/adduser/route.js`)
    - [x] Execute Shell Script (`adduservendor.sh`) ด้วย `child_process`
    - [x] จำลองการสร้าง Email content
    - [x] ส่งผลลัพธ์ (StdOut/StdErr) กลับไปยัง Frontend

- [x] **6. ฟีเจอร์ Operations: Billing (AWS Non-Prod)**
    - [x] สร้างหน้า Dashboard UI (`src/app/operations/aws/nonprod/billing/page.js`)
    - [x] ดึงข้อมูล JSON จากไฟล์ `raw-data` มาแสดงผล
    - [x] สร้างตาราง Sortable Table
    - [x] สร้าง API Route (`src/app/api/operations/aws/nonprod/billing/route.js`) เพื่อเรียก AWS CLI
    - [x] แสดงผลลัพธ์ JSON ในหน้า Frontend ได้อย่างถูกต้อง

- [x] **7. ฟีเจอร์ Operations: Create EC2 Instance (AWS Non-Prod)**
    - [x] สร้างหน้า Form UI (`src/app/operations/aws/nonprod/deploy-uat/page.js`)
    - [x] สร้าง API Route (`src/app/api/operations/aws/nonprod/createec2/route.js`)
    - [x] กำหนดค่า Default Infrastructure (AMI, SG, Subnet)
    - [x] แสดง Private IP ของ Instance ที่สร้างเสร็จแล้วบนหน้า UI
    - [x] ยืนยัน AMI ID สำหรับ `jvc_base_ubuntu24-img-2`

- [x] **8. ฟีเจอร์ Operations: AWS Backup Readiness (AWS Non-Prod)**
    - [x] สร้างหน้า Dashboard UI (`src/app/operations/aws/nonprod/backup-readiness/page.jsx`)
    - [x] สร้าง API Route List Backups (`src/app/api/operations/aws/nonprod/backup-readiness/list/route.js`)
    - [x] สร้าง API Route Restore Backup (`src/app/api/operations/aws/nonprod/backup-readiness/restore/route.js`)
    - [x] เชื่อมต่อ Frontend กับ Backend API (List/Restore/Terminate)
    - [x] **Check Docker**: ตรวจสอบสถานะ Docker Container ผ่าน SSH
    - [x] **State Persistence**: บันทึกสถานะการทดสอบลงไฟล์ `backupec2_state.json`
    - [x] **AMI Pre-check**: ตรวจสอบ ResourceArn เพื่อหา AMI ล่าสุดก่อน Restore
    - [x] **QA Verification**: ทดสอบ Frontend Flow (List -> Restore -> Check -> Terminate) ผ่านทั้งหมด

- [x] **9. การ Deploy ด้วย Docker (Containerization)**
    - [x] **Dockerfile**: สร้าง Image สำหรับ Next.js App (Alpine Node 20)
    - [x] **Docker Compose**: จัดการ Container การรันและ Volume Mounts
    - [x] **Credentials Management**:
        - [x] เปลี่ยนจากการ Hardcode เป็น Environment Variables
        - [x] สร้าง `docker-entrypoint.sh` เพื่อ Config AWS Profile ตอนรัน
    - [x] **State Persistence**: Mount `backupec2_state.json` จาก Host
    - [x] **Permission Fix**: แก้ไขสิทธิ์ไฟล์ `backupec2_state.json` โดยใช้ `chmod 666` บน Host
    - [ ] **Final Verification**: ทดสอบระบบทั้งหมดบน Docker Container อีกครั้ง

## Security Guidelines (ข้อควรระวังด้านความปลอดภัย)

1.  **Input Validation**: ตรวจสอบ Input ทุก API Route ป้องกันการส่งค่าว่างหรือรูปแบบผิด
2.  **Authentication & Authorization**: ใช้ Mock Login ในปัจจุบัน (ควร Implement NextAuth.js ในอนาคต)
3.  **Command Injection Prevention**: Sanitize argument ที่ส่งเข้า `child_process`
4.  **Credential Security**: ไม่เก็บ AWS Key ใน Code, ใช้ Environment Variables และ IAM Roles
5.  **Least Privilege**:
    - Container รันด้วย User `nextjs` (Non-root)
    - ไฟล์บน Host ต้องกำหนดสิทธิ์ให้เหมาะสมกับการเขียนจาก Container

## ขั้นตอนต่อไป (Next Actions)

- [ ] Restart Docker Container
- [ ] ทดสอบ Backup Readiness Flow (Restore -> Check -> Terminate) บน Docker
- [ ] เมื่อทดสอบผ่าน ให้บันทึกผลลง `full_test_result.md`
