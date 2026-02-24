# แผนการดำเนินการ Implement Features (Implementation Plan)

เอกสารนี้แสดงรายละเอียดแผนงานสำหรับการพัฒนาระบบ IT Portal v2 ตามคำขอ โดยเน้นเรื่องความปลอดภัยและการตรวจสอบสถานะของงาน

## สถานะปัจจุบัน
วันที่: 31 มกราคม 2026
ผู้ดำเนินการ: GitHub Copilot

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
    - [x] **เชื่อมต่อ Frontend กับ Backend API**
    - [x] แสดงผลลัพธ์ Command ที่ Generate ได้
    - [x] เพิ่ม Input Validation ฝั่ง Frontend (HTML5 Required)
    - [x] เพิ่ม Input Validation ฝั่ง Backend (Security check for missing fields)

- [ ] **5. ฟีเจอร์ Operations: Add User Access (AWS Non-Prod)**
    - [x] สร้างหน้า Form UI (`src/app/operations/aws/nonprod/adduser/page.js`)
        - [x] รองรับการระบุ Server IPs
        - [x] รองรับการเพิ่ม User แบบ Dynamic (Multiple Users)
        - [x] Input Validation (IP format, Username format)
    - [x] สร้าง API Route สำหรับประมวลผล (`src/app/api/operations/aws/nonprod/adduser/route.js`)
        - [x] รับข้อมูล JSON (Server IPs, User List)
        - [x] สร้าง Temporary Files สำหรับรายชื่อ IP และ User (เพื่อให้ Shell script ใช้งาน)
        - [x] Execute Shell Script (`adduservendor.sh`) ด้วย `child_process`
        - [x] จำลองการสร้าง Email content (Simulated Email Logic)
        - [x] ส่งผลลัพธ์ (StdOut/StdErr) กลับไปยัง Frontend
    - [ ] **Security & Cleanup**
        - [ ] ลบ Temporary Files ลงหลังใช้งานเสร็จ (To Do)
        - [ ] ตรวจสอบ Permission ของ Script (`chmod +x` implemented)

- [x] **6. ฟีเจอร์ Operations: Billing (AWS Non-Prod)**
    - [x] สร้างหน้า Dashboard UI (`src/app/operations/aws/nonprod/billing/page.js`)
    - [x] ดึงข้อมูล JSON จากไฟล์ `raw-data` มาแสดงผล
    - [x] สร้างตาราง Sortable Table
    - [x] อัปเดต API Route (`src/app/api/operations/aws/nonprod/billing/route.js`) เพื่อรัน AWS CLI (`aws ce get-cost-and-usage`)
    - [x] แสดงผลลัพธ์ JSON ในหน้า Frontend ได้อย่างถูกต้อง

- [x] **7. ฟีเจอร์ Operations: Create EC2 Instance (AWS Non-Prod)**
    - [x] สร้างหน้า Form UI (`src/app/operations/aws/nonprod/deploy-uat/page.js`)
    - [x] สร้าง API Route (`src/app/api/operations/aws/nonprod/createec2/route.js`) เพื่อ Execute `aws ec2 run-instances`
    - [x] กำหนดค่า Default Infrastructure (AMI, SG, Subnet)
    - [x] อัปเดต Key-Pair เป็น `jventures-uat`
    - [x] แสดง Private IP ของ Instance ที่สร้างเสร็จแล้วบนหน้า UI อย่างชัดเจน
    - [x] ยืนยัน AMI ID สำหรับ `jvc_base_ubuntu24-img-2` (Result: `ami-0d2042c6feb606ae9`)

## Security Guidelines (ข้อควรระวังด้านความปลอดภัย)

1.  **Input Validation**:
    -   ทุก API Route จะต้องตรวจสอบ input ให้ครบถ้วน (e.g. `Server IP` pattern, `Map URL` format)
    -   ป้องกันการส่ง input ว่าง หรือ input ที่ผิดรูปแบบเข้ามา

2.  **Authentication & Authorization**:
    -   (Mock) ตรวจสอบสิทธิ์ก่อนเข้าถึงหน้า Operations (ปัจจุบันใช้ Mock Login)
    -   *ในอนาคต*: ควร Implement NextAuth.js หรือ JWT จริง

3.  **Command Injection Prevention**:
    -   ใน API Route ที่มีการใช้ `child_process` ต้องระวัง Argument ที่มาจาก User Input อย่างเคร่งครัด
    -   ใช้ `JSON.stringify` หรือ sanitize input ก่อนนำไปใช้ใน command string

4.  **Secure Headers**:
    -   จัดการ HTTP Headers ให้เหมาะสม (สามารถทำได้ใน `next.config.mjs`)

## ขั้นตอนต่อไป (Next Actions)

- [ ] ทดสอบสร้าง Instance จริง (User Verification)
- [ ] Implement การลบ Temporary files ในฟีเจอร์ Add User
- [ ] ปรับปรุงหน้า Billing ให้รองรับการเลือกช่วงเวลา (Date Range)

---
**สถานะล่าสุด:** ดำเนินการ Feature 7 (Create EC2) เสร็จสิ้นตาม Requirement (Key name & IP Display)

- [x] **8. ฟีเจอร์ Operations: AWS Backup Readiness (AWS Non-Prod)**
    - [x] สร้างหน้า Dashboard UI (`src/app/operations/aws/nonprod/backup-readiness/page.jsx`)
    - [x] สร้าง API Route สำหรับ List Backups (`src/app/api/operations/aws/nonprod/backup-readiness/list/route.js`)
    - [x] สร้าง API Route สำหรับ Restore Backup (`src/app/api/operations/aws/nonprod/backup-readiness/restore/route.js`)
        - [x] รองรับ Method POST (Restore)
        - [x] รองรับ Method DELETE (Terminate)
    - [x] เชื่อมต่อ Frontend กับ Backend API
    - [x] แสดงผลลัพธ์ IP Address หลัง Restore สำเร็จ
    - [x] ปุ่ม Terminate Instance เมื่อทดสอบเสร็จสิ้น
    - [x] **Check Docker**: ตรวจสอบสถานะ Docker Container บนเครื่องที่ Restore
        - [x] สร้าง API Route (`src/app/api/operations/aws/nonprod/backup-readiness/check-docker/route.js`)
        - [x] ใช้ SSH Key `jventures-uat.pem` ในการเชื่อมต่อ
        - [x] รันคำสั่ง `ssh jventures@<IP> docker ps` และแสดงผลลัพธ์
    - [x] **Fixes & Improvements** (Added 2026-02-24)
        - [x] **State Persistence**: บันทึกสถานะการทดสอบ (Completed, Date) ลงไฟล์ `backupec2_state.json`
        - [x] **Reload Button**: ปุ่มสำหรับ force refresh ข้อมูลจาก AWS Backup
        - [x] **AMI Pre-check**: ตรวจสอบว่า AMI ID ยังมีอยู่จริงก่อนสั่ง Restore
        - [x] **Latest Snapshot**: ดึง AMI ล่าสุดจาก ResourceArn โดยอัตโนมัติ
        - [x] **UI Updates**: แก้ไขปุ่ม IP ให้แสดงผลทันทีหลัง Restore สำเร็จ
        - [x] **QA Verification**: ทดสอบ Frontend Flow (List -> Restore -> Check -> Terminate -> Persistence) ผ่านทั้งหมด

## Security Guidelines (ข้อควรระวังด้านความปลอดภัย)
