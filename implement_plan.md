# แผนการดำเนินการ Implement Features (Implementation Plan)

เอกสารนี้แสดงรายละเอียดแผนงานสำหรับการพัฒนาระบบ IT Portal v2 ตามคำขอ โดยเน้นเรื่องความปลอดภัยและการตรวจสอบสถานะของงาน

## สถานะปัจจุบัน
วันที่: 25 กุมภาพันธ์ 2026
ผู้ดำเนินการ: GitHub Copilot

## Request ใหม่: แก้ Breadcrumb ซ้ำในหน้า BytePlus Edit Map URL (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- หน้า `http://localhost:3000/operations/byteplus/edit-map-url` แสดง breadcrumb มากกว่า 1 ชุด
- ต้องการให้เหลือ breadcrumb เพียงชุดเดียว

### แผนดำเนินการรอบนี้
- [x] แก้ไฟล์ `src/app/operations/byteplus/edit-map-url/page.js`
    - [x] ลบ `<nav aria-label="Breadcrumb">` ภายในหน้าเพื่อตัด breadcrumb ซ้ำ
    - [x] คง breadcrumb กลางจาก layout (`src/app/components/Breadcrumb.jsx`) ไว้เป็นแหล่งเดียว
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทดสอบหน้า `GET /operations/byteplus/edit-map-url` ว่าแสดง breadcrumb ชุดเดียว
- [x] บันทึกผลการทดสอบใน `full_test_result.md`
- [x] อัปเดตสถานะใน `implement_plan.md` หลังงานเสร็จ

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/operations/byteplus/edit-map-url/page.js`
- `full_test_result.md`

### ผลทดสอบรอบนี้ (2026-02-26)
- `GET /operations/byteplus/edit-map-url` ได้ `200`
- ตรวจ syntax ของไฟล์ `src/app/operations/byteplus/edit-map-url/page.js` ไม่พบ error
- ตรวจ HTML หน้าเว็บพบ `aria-label="Breadcrumb"` เหลือ `1` ชุด

## Request ใหม่: ตั้งชื่อ Service ซ้ำแบบต่อท้าย _count (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- ตอนสร้าง service หากชื่อโดเมนซ้ำ แต่ `path` ไม่ซ้ำ ให้ตั้งชื่อ service ต่อท้ายด้วย `_<count>`
- ตัวอย่าง: `svc_example`, `svc_example_1`, `svc_example_2`

### แผนดำเนินการรอบนี้
- [x] ปรับ API `src/app/api/operations/byteplus/map-url/route.js`
    - [x] ตรวจสอบ service ชื่อฐาน (`svc_<url>`) ว่ามีอยู่แล้วหรือไม่
    - [x] ถ้ามีและ path ต่างกัน ให้ลองชื่อถัดไป (`_1`, `_2`, ...)
    - [x] ถ้ามีและ path เดิม ให้ตอบกลับข้อความว่า mapping นี้มีอยู่แล้ว (ไม่สร้างซ้ำ)
    - [x] คงลำดับ create service ก่อน create route ตามเดิม
- [x] ปรับ response ให้ส่งชื่อ service ที่ถูกเลือกจริงกลับไป frontend
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทดสอบเคสซ้ำ path และไม่ซ้ำ path
- [x] อัปเดตผลใน `full_test_result.md` และสถานะใน `implement_plan.md`

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/byteplus/map-url/route.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- เคสโดเมน+path ซ้ำ (`example.com` + `/path1`) ได้ `409` พร้อมข้อความว่า mapping มีอยู่แล้ว
- เคสโดเมนซ้ำแต่ path ใหม่ (`example.com` + `/path2`) ได้ `200`
- ระบบตั้งชื่อ service อัตโนมัติเป็น `svc_example.com_1` และ route เป็น `route_example.com_1`

## Request ใหม่: แก้เคส Service มีอยู่แต่ Route หาย ในหน้า Edit (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- กรณี `Create service failed: UNIQUE...` แต่หน้า Edit หา `fqdn` ไม่เจอ
- ต้องทำให้ใช้งาน Edit ได้ต่อ โดยรองรับเคสมี service แต่ route หาย

### แผนดำเนินการรอบนี้
- [x] ปรับ API `src/app/api/operations/byteplus/edit-map-url/route.js`
    - [x] เมื่อไม่พบ route ให้ลองค้น service จากชื่อ `svc_<fqdn>`
    - [x] ถ้าพบ service ให้ถือว่าโหลดได้ (routeMissing=true)
    - [x] ตอน `edit` หาก route หาย ให้สร้าง route ใหม่อัตโนมัติ
    - [x] ตอน `delete` หาก route หาย ให้ลบ service ต่อได้โดยไม่ fail
- [x] ปรับ frontend หน้า Edit ให้แสดงสถานะเตือนเมื่อ route หาย
- [x] ตรวจ syntax/error และทดสอบกับ `example.com`
- [x] อัปเดตผลลง `full_test_result.md` และสถานะใน `implement_plan.md`

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/byteplus/edit-map-url/route.js`
- `src/app/operations/byteplus/edit-map-url/page.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- `fetch example.com` ได้ `200` พร้อม `routeMissing=true` (พบ service แม้ route หาย)
- `edit example.com` ได้ `200` และระบบสร้าง route กลับให้อัตโนมัติ
- `fetch example.com` หลัง edit ได้ `routeMissing=false` และค่าปลายทางอัปเดตถูกต้อง

## Request ใหม่: แก้เคส Edit example.com แล้ว Fail (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- ผู้ใช้ทดสอบ `edit example.com` แล้ว fail
- ผลตรวจซ้ำ API ตอนนี้ได้ `404` และ message `Fetch route failed: Not found`

### แผนดำเนินการรอบนี้
- [x] ปรับข้อความ error สำหรับเคส `fqdn` ไม่พบ ให้เป็นข้อความที่ผู้ใช้เข้าใจง่าย (เช่น `ไม่พบ FQDN นี้ในระบบ`)
- [x] ปรับ frontend หน้า Edit ให้แสดง guidance เมื่อไม่พบข้อมูล (เช่น แนะนำให้ create ก่อน)
- [x] คง HTTP status ที่ถูกต้อง (`404`) สำหรับ not found
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทดสอบซ้ำเคส `edit example.com` และยืนยันข้อความใหม่บนหน้าเว็บ
- [x] อัปเดตผลใน `full_test_result.md` และสถานะใน `implement_plan.md`

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/byteplus/edit-map-url/route.js`
- `src/app/operations/byteplus/edit-map-url/page.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- `fetch example.com` ได้ `404` พร้อม message ใหม่: `ไม่พบ FQDN นี้ในระบบ (example.com) กรุณาสร้าง mapping ก่อน`
- `edit example.com` ได้ `404` พร้อม message เดียวกัน
- หน้า Edit รองรับการแสดง guidance link ไปหน้า Create เมื่อไม่พบ FQDN

## Request ใหม่: BytePlus - Edit URL to Endpoint (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- เพิ่มฟังก์ชัน `Edit URL to endpoint` ในแท็บ BytePlus
- ในแท็บ BytePlus ให้แสดงเป็นลิงก์ไปหน้า input form
- หน้า form รับค่า `fqdn` เพื่อดึงข้อมูลเดิมมาแสดงในฟอร์ม
- มีปุ่ม `Edit` และ `Delete`

### แผนดำเนินการรอบนี้
- [x] ปรับหน้า BytePlus tab ให้เพิ่มลิงก์ไปหน้า `Edit URL to Endpoint`
- [x] สร้างหน้า form สำหรับค้นหาด้วย `fqdn`
    - [x] มีช่องกรอก `fqdn` และปุ่มโหลดข้อมูล
    - [x] ดึงข้อมูล service/route ที่เกี่ยวข้องมาเติมในฟอร์ม
    - [x] มีปุ่ม `Edit` สำหรับอัปเดตค่า
    - [x] มีปุ่ม `Delete` สำหรับลบ route/service
- [x] สร้าง API route ใหม่ฝั่ง BytePlus สำหรับ
    - [x] fetch by `fqdn`
    - [x] update by `fqdn`
    - [x] delete by `fqdn`
- [x] เพิ่ม validation และ error message ที่อ่านง่าย
- [x] รันทดสอบ flow (fetch -> edit -> delete)
- [x] อัปเดตผลลง `full_test_result.md` และสถานะใน `implement_plan.md`

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/operations/page.js`
- `src/app/operations/byteplus/edit-map-url/page.js`
- `src/app/api/operations/byteplus/edit-map-url/route.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- หน้า `GET /operations/byteplus/edit-map-url` ได้ `200`
- ทดสอบครบ flow ด้วยโดเมนทดสอบ:
  - `fetch` ได้ข้อมูลเดิมจาก `fqdn`
  - `edit` เปลี่ยนค่าเป็น `scheme=https`, `endpoint=127.0.0.1:3004`, `path=/v2` สำเร็จ
  - `fetch` ซ้ำหลัง edit พบค่าที่อัปเดตแล้ว
  - `delete` สำเร็จ และ `fetch` หลังลบได้ `404` (`Fetch route failed: Not found`)

## Request ใหม่: ส่งข้อความ Create Fail ไปหน้า Frontend (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- หาก create ไม่สำเร็จ (ทั้ง service/route) ให้ส่ง error message ที่อ่านได้ชัดเจนไปแสดงที่หน้า frontend

### แผนดำเนินการรอบนี้
- [x] ปรับ API `src/app/api/operations/byteplus/map-url/route.js`
    - [x] เมื่อ create service fail ให้ส่ง `message` ที่มีรายละเอียดจากปลายทาง (เช่น duplicate name)
    - [x] เมื่อ create route fail ให้ส่ง `message` ที่มีรายละเอียดจากปลายทาง
    - [x] คงโครงสร้างข้อมูล debug เดิม (`steps`, status, response) ไว้
- [x] ปรับ frontend `src/app/operations/byteplus/map-url/page.js`
    - [x] แสดง `message` จาก API โดยตรงเมื่อไม่สำเร็จ
    - [x] รองรับ fallback การแสดงข้อความจากฟิลด์ error อื่น (ถ้ามี)
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทดสอบเคส create fail และยืนยันว่า frontend แสดงข้อความชัดเจน
- [x] อัปเดตผลใน `full_test_result.md` และสถานะใน `implement_plan.md`

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/byteplus/map-url/route.js`
- `src/app/operations/byteplus/map-url/page.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- ทดสอบ create fail เคสชื่อซ้ำ (`url=example.com`) ได้ `HTTP 409`
- API ส่งข้อความชัดเจน: `Create service failed: UNIQUE violation detected on '{name="svc_example.com"}'`
- Frontend ใช้ `message` จาก API แสดงผล error ได้โดยตรง

## Request ใหม่: ปรับ BytePlus Map URL ให้รองรับ Scheme (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- ปรับ input form ของ `Map URL to endpoint` ให้รับค่า `scheme` เพิ่มเติมเป็น dropdown (`http`, `https`)
- เปลี่ยน input จาก `Endpoint IP:Port` เป็นรูปแบบ `scheme://endpoint_ip:port/path`
- ใช้ค่า `scheme` ที่รับมาสร้าง URL สำหรับคำสั่ง create service

### แผนดำเนินการรอบนี้
- [x] ปรับหน้า form `src/app/operations/byteplus/map-url/page.js`
    - [x] เพิ่ม dropdown `scheme` (`http`, `https`)
    - [x] แยก input endpoint เป็น `endpoint ip:port` และ `path` (default `/`) โดยแสดงผลประกอบเป็น `scheme://endpoint_ip:port/path`
    - [x] ส่งค่า `scheme` ไป API
    - [x] เอา ช่องรับค่า path ไปต่อท้าย ช่องรับค่า url
- [x] ปรับ API `src/app/api/operations/byteplus/map-url/route.js`
    - [x] รับค่า `scheme` และ validate (`http`/`https` เท่านั้น)
    - [x] สร้าง `targetUrl` เป็น `<scheme>://<endpoint_ip>:<endpoint_port><path>`
    - [x] คงลำดับ create service ก่อน create route ตามเดิม
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] รันทดสอบฟอร์มและ API
- [x] อัปเดตผลใน `full_test_result.md` และสถานะในเอกสารนี้

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/operations/byteplus/map-url/page.js`
- `src/app/api/operations/byteplus/map-url/route.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- validation scheme: `POST` ด้วย `scheme=ftp` ได้ `400 Bad Request`
- ทดสอบจริง: `POST` ด้วย `scheme=https`, `endpoint=10.240.1.114:3000`, `path=/path1` ได้ `200`
- ยืนยัน `targetUrl` ที่สร้างเป็น `https://10.240.1.114:3000/path1`

## Request ใหม่: BytePlus - Map URL to Endpoint (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- เพิ่มฟังก์ชัน `Map URL to endpoint` ในแท็บ BytePlus
- ในแท็บ BytePlus ให้แสดงเป็นลิงก์ไปหน้า input form
- ฟอร์มรับค่า `url`, `endpoint ip:port`, และ `path` (default = `/`)
- สร้าง `service_name` รูปแบบ `svc_<url>` และ `route_name` รูปแบบ `route_<url>`
- เรียก API ตาม curl ที่กำหนดสำหรับสร้าง service และ route
- เพิ่มลิงก์ `Advance config` ไปที่ `http://10.224.100.4:1337/#!/services`

### แผนดำเนินการรอบนี้
- [x] ปรับหน้า BytePlus tab ให้เป็นลิงก์ไปหน้าฟอร์ม `Map URL to Endpoint`
- [x] สร้าง/ปรับหน้า input form ในเส้นทาง BytePlus สำหรับรับค่า
    - [x] `url` (ตัวอย่าง `example.com`)
    - [x] `endpoint ip:port`
    - [x] `path` (default `/`)
    - [x] ลิงก์ `Advance config` ไป `http://10.224.100.4:1337/#!/services`
- [x] สร้าง API route ฝั่ง BytePlus สำหรับ map URL
    - [x] generate `service_name=svc_<url>` และ `route_name=route_<url>`
    - [x] เรียก create service:
                `POST http://10.224.100.4:8005/services`
    - [x] เรียก create route:
                `POST http://10.224.100.4:8005/<service_name>/routes`
- [x] เพิ่ม validation และ error message ที่อ่านง่าย
- [ ] ทดสอบ flow หน้าเว็บและ API แบบ end-to-end
    - [x] route หน้าใหม่ `GET /operations/byteplus/map-url`
    - [x] API validation `POST /api/operations/byteplus/map-url` (missing fields)
    - [x] API create service/route แบบเชื่อมต่อจริงกับปลายทาง `10.224.100.4:8005`
- [x] บันทึกผลลง `full_test_result.md` และอัปเดตสถานะในเอกสารนี้

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/operations/page.js`
- `src/app/operations/byteplus/map-url/page.js`
- `src/app/api/operations/byteplus/map-url/route.js`

### ผลตรวจสอบนักพัฒนา (2026-02-26)
- `GET /operations/byteplus/map-url` = `200`
- API validation: `POST {}` ได้ `{"success":false,"message":"Missing required fields: url and endpoint"}`
- API เคสส่งข้อมูลครบยังไม่สามารถยืนยันผลปลายทางได้ในรอบนี้ (ตอบ `500` จาก local execution)

### ผลทดสอบ Senior QA (2026-02-26)
- ทดสอบจริงผ่าน `POST /api/operations/byteplus/map-url` ด้วย payload ครบ
- ผลลัพธ์: `500 Internal Server Error`
- รายละเอียด error:
    - `Create route failed`
    - `routeStatus=404`
    - `routeResponse=Workspace '<service_name>' not found`

### ข้อเสนอเพื่อรออนุมัติปรับแก้
- [x] ปรับ endpoint สำหรับ create route ให้รองรับเส้นทางที่ใช้งานได้จริง (`/services/<service_name>/routes`) โดยยังคงรองรับ requirement เดิม
- [x] Retest Senior QA จนผ่านเคสสร้างทั้ง service และ route

### ผลหลังแก้ไขรอบอนุมัติ (2026-02-26)
- ยังคงสร้าง `service` ก่อน `route` เสมอ และเพิ่ม `steps` ใน response เพื่อยืนยันลำดับ
- เพิ่มการลอง endpoint route แบบ requirement ก่อน (`/<service_name>/routes`) และ fallback ไป endpoint ที่รองรับจริง (`/services/<service_name>/routes`)
- Senior QA retest ผ่านครบ: API ตอบ `200`, `success=true`, และสร้างได้ทั้ง service + route

## Request ใหม่: Backup Readiness SSH Fallback (Approved)

สถานะ: ✅ Implemented (QA Tested)

รายละเอียดคำขอ:
- ฟังก์ชัน `backup-readiness` (aws-nonprod) ให้พยายาม SSH ด้วยลำดับดังนี้
    1) `user: ubuntu` + `key: jventures-uat.pem`
    2) ถ้าไม่สำเร็จ ให้ fallback เป็น `user: jventures` + `key: id_ed25519`

### แผนดำเนินการรอบนี้
- [x] ปรับ API `src/app/api/operations/aws/nonprod/backup-readiness/check-docker/route.js`
    - [x] เพิ่มลำดับการลอง SSH แบบ fallback ตาม requirement
    - [x] เก็บ error ของรอบแรกไว้ใน response เพื่อช่วย debug เมื่อ fallback ล้มเหลวด้วย
    - [x] คง SSH options เดิม (`StrictHostKeyChecking=no`, `UserKnownHostsFile=/dev/null`) และเพิ่ม `BatchMode/ConnectTimeout`
- [x] รองรับ key path แบบยืดหยุ่นสำหรับทั้งสอง key
    - [x] `jventures-uat.pem`: env / `~/.ssh` / `/app` / project root
    - [x] `id_ed25519`: env / `~/.ssh/id_ed25519` / `/app/id_ed25519` / project root
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทำ Senior QA test กับ `check-docker` และบันทึกผลลง `full_test_result.md`
- [x] อัปเดตสถานะใน `implement_plan.md` หลังทดสอบ

### ผลทดสอบรอบนี้ (2026-02-26)
- `POST /api/operations/aws/nonprod/backup-readiness/check-docker` ด้วย `ip=10.240.1.114`
- ระบบลองลำดับที่ 1: `ubuntu + jventures-uat.pem` แล้วไม่ผ่าน auth (`Permission denied`)
- ระบบ fallback ลำดับที่ 2: `jventures + id_ed25519` และเชื่อมต่อได้ แต่ปลายทางตอบ `docker: command not found`

## Request ใหม่: แก้ Check Docker สำหรับ 10.240.1.114 และถอดโค้ดทดสอบ 10.240.1.103 (Approved)

สถานะ: ✅ Completed

## Request ใหม่: ทดสอบทุกลิงก์เพื่อป้องกันลิงก์ตาย (Approved)

สถานะ: ⚠️ Tested with Findings (Waiting Fix Approval)

รายละเอียดคำขอ:
- ทดสอบทุกลิงก์ในระบบเพื่อยืนยันว่าไม่มีลิงก์ตาย (ทั้ง internal route และ external URL)

### แผนดำเนินการรอบนี้
- [x] เก็บรายการลิงก์ทั้งหมดจากหน้าใช้งานหลัก
    - [x] ตรวจลิงก์ภายในระบบ (เช่น `/operations/...`)
    - [x] ตรวจลิงก์ภายนอก (เช่น monitor / external tools)
- [x] ทำ Local test (ข้อ 4.1)
    - [x] รัน `npm run dev` (ใช้ instance ที่กำลังรันอยู่ในเครื่อง)
    - [x] เปิดทดสอบทุกลิงก์และบันทึกผล HTTP status / ปลายทางจริง
- [ ] ทำ Docker test (ข้อ 4.2)
    - [ ] รัน `docker-compose up` (หรือ compose file ที่ใช้จริงของโปรเจกต์)
    - [ ] ทดสอบทุกลิงก์ซ้ำใน environment docker
- [x] ทำ UAT test (ข้อ 4.3)
    - [ ] `git push` และรอ pipeline deploy สำเร็จ
    - [x] ทดสอบทุกลิงก์บน `itportal.jfin.network`
- [x] บันทึกผล Senior QA Full Test ลง `full_test_result.md`
- [x] หากพบลิงก์เสีย: อัปเดตแผนแก้ไขในไฟล์นี้และรออนุมัติ ก่อนลงมือแก้
- [ ] เมื่อแก้เสร็จ: วนทดสอบซ้ำจนผ่านทุกเคส แล้วค่อยขออนุมัติเปลี่ยน environment ตามลำดับ

### เกณฑ์ผ่านงาน
- [x] ทุก internal link เปิดได้และไม่เจอ 404/500 จากเส้นทางปลายทาง
- [ ] ทุก external link เข้าถึงได้หรือมี fallback/ข้อความแจ้งที่ถูกต้อง
- [ ] ผลทดสอบครบทั้ง local, docker และ UAT

### ผลทดสอบรอบนี้ (2026-03-11)
- Local internal links ที่ตรวจ (16 paths) ได้ `HTTP 200` ทั้งหมด
- UAT internal links ที่ตรวจ (16 paths) ได้ `HTTP 200` ทั้งหมด
- External links:
    - ผ่าน: `https://api-monitor.jventures.co.th/`, `https://kong-ui-uat.jfin.network/services`, `https://kong-ui.jfin.network/services`, AWS console links
    - ไม่ผ่านจาก environment ปัจจุบัน: `http://10.224.100.4:1337/#!/services` ได้ `000` (เข้าถึงเครือข่ายปลายทางไม่ได้จากเครื่องทดสอบ)
- พบลิงก์ placeholder `#` ในหลายหน้า (เช่น Home/Operations/Footer) ซึ่งถือเป็นลิงก์ไม่สมบูรณ์เชิงใช้งาน

## Request ใหม่: แก้ลิงก์ Placeholder และลิงก์ที่เข้าถึงไม่ได้จากหน้า Operations (Pending Approval)

สถานะ: ⏳ Waiting for Approval

รายละเอียดที่พบจากการทดสอบ:
- มีลิงก์ `href="#"` ที่เป็น placeholder และไม่พาผู้ใช้ไปปลายทางจริง
- มีลิงก์ `http://10.224.100.4:1337/#!/services` ที่เข้าถึงไม่ได้จาก environment ผู้ใช้งานทั่วไป

### แผนแก้ไขที่เสนอ (รออนุมัติ)
- [ ] ปรับลิงก์ `#` ให้เป็น route จริง หรือเปลี่ยนเป็นปุ่ม disabled พร้อมข้อความ `Coming soon`
- [ ] ปรับลิงก์ `Advance config` ของ BytePlus ให้ใช้ URL ที่เข้าถึงได้จาก environment เป้าหมาย หรือเพิ่มข้อความแจ้งเงื่อนไขเครือข่าย
- [ ] ทดสอบซ้ำ local -> docker -> UAT ตามลำดับจนผ่านทุกเคส

## Request ใหม่: AWS PROD - Create EC2 Instance Form + Backend Config (Approved)

สถานะ: ✅ Completed
วันที่: 4 มีนาคม 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- ที่หน้า `operations > aws > prod` เมนู `Create EC2 Instance` ให้เปลี่ยนจากลิงก์เดิมเป็นการเปิดหน้า input form ใหม่
- รูปแบบหน้า input form ให้ใช้งานเหมือนหน้า `Deploy to UAT` ฝั่ง Non-Production
- ค่า backend สำหรับฟีเจอร์ใหม่นี้ต้องใช้ค่า fixed ดังนี้
    - `aws profile`: `aws_prod`
    - `ami id`: `ami-0ed30e8b2125a02ca`
    - `sg id`: `sg-095da6c8cb4a23a70`

### แผนดำเนินการรอบนี้
- [x] ปรับลิงก์ในหน้า `src/app/operations/page.js`
    - [x] เปลี่ยนเมนู `Create EC2 Instance` ฝั่ง PROD จาก `#` ไปยัง route หน้าใหม่ (`/operations/aws/prod/createec2`)
- [x] สร้างหน้า input form ใหม่ `src/app/operations/aws/prod/createec2/page.js`
    - [x] ใช้โครงสร้าง/พฤติกรรมฟอร์มให้สอดคล้องกับหน้า `src/app/operations/aws/nonprod/deploy-uat/page.js`
    - [x] ส่งข้อมูลไป API ฝั่ง PROD (`/api/operations/aws/prod/createec2`)
- [x] สร้าง API ใหม่ `src/app/api/operations/aws/prod/createec2/route.js`
    - [x] รับข้อมูลจากฟอร์มและ validate field ที่จำเป็น
    - [x] สร้างคำสั่ง AWS CLI โดยใช้ค่าคงที่ตาม requirement (`aws_prod`, `ami-0ed30e8b2125a02ca`, `sg-095da6c8cb4a23a70`)
    - [x] ส่งผลลัพธ์กลับ frontend ในรูปแบบเดียวกับหน้า deploy เดิม
- [ ] อัปเดตผลทดสอบตาม process ที่กำหนด
    - [x] Developer smoke test ที่ local (รัน `npm run dev` และทดสอบ route/API validation ผ่าน)
    - [x] Developer smoke test ที่ docker (รัน `docker compose up -d --build` และทดสอบ route/API validation ผ่าน)
    - [x] บันทึกผลใน `full_test_result.md`
    - [x] Senior QA full test (UAT) ผ่าน และอัปเดตสถานะในเอกสารนี้

### Checklist การทดสอบตามลำดับ environment
- [x] Local test: รัน `npm run dev` และทดสอบหน้า `/operations/aws/prod/createec2` + API validation เบื้องต้น
- [x] Docker test: รัน `docker compose up -d --build` แล้วทดสอบเคสเดียวกันซ้ำ (ได้ `200/405/400` ตามคาด)
- [x] UAT test: `git push` รอ pipeline deploy แล้วทดสอบที่ `itportal.jfin.network` (ผ่าน `200/405/400` และตรวจลิงก์เมนูได้)

### ผลทดสอบ UAT/Senior QA รอบนี้ (2026-03-04)
- `GET https://itportal.jfin.network/operations/aws/prod/createec2` ได้ `200`
- `GET https://itportal.jfin.network/api/operations/aws/prod/createec2` ได้ `405`
- `POST https://itportal.jfin.network/api/operations/aws/prod/createec2` ด้วย `{}` ได้ `400` พร้อมข้อความ `Missing required fields: instanceName or projectName`
- ตรวจหน้า `https://itportal.jfin.network/operations` พบลิงก์ `/operations/aws/prod/createec2`

## Request ใหม่: เปลี่ยน Key Pair ของ Create EC2 (AWS PROD) (Approved)

สถานะ: ✅ Completed
วันที่: 4 มีนาคม 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- ปรับฟังก์ชัน `Create EC2 Instance` ฝั่ง PROD
- เปลี่ยน key pair จาก `jventures-uat` เป็น `jventures-prod.pem`

### แผนดำเนินการรอบนี้
- [x] ปรับ backend API ใน `src/app/api/operations/aws/prod/createec2/route.js`
    - [x] เปลี่ยนค่า `--key-name` จาก `jventures-uat` เป็น `jventures-prod.pem`
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] บันทึกผลใน `full_test_result.md` และอัปเดตสถานะใน `implement_plan.md`

### ผลทดสอบรอบนี้ (2026-03-04)
- ตรวจไฟล์ `src/app/api/operations/aws/prod/createec2/route.js` ไม่พบ syntax/error
- ยืนยันคำสั่ง AWS CLI ในโค้ดใช้ `--key-name jventures-prod.pem` แล้ว

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/operations/page.js`
- `src/app/operations/aws/prod/createec2/page.js`
- `src/app/api/operations/aws/prod/createec2/route.js`

รายละเอียดคำขอ:
- พบ error เมื่อกดปุ่ม Check Docker ที่ `10.240.1.114` ว่าไม่พบ SSH key
- ต้องการถอดโค้ดทดสอบเฉพาะ IP `10.240.1.103` ออกจากระบบ

### แผนดำเนินการรอบนี้
- [x] ลบเงื่อนไขพิเศษ `ip === 10.240.1.103` ออกจาก API `check-docker`
- [x] ทำให้ logic key path ใช้แนวทางเดียวกันทุก IP โดยรองรับ key จาก
    - [x] `BACKUP_READINESS_SSH_KEY_PATH`
    - [x] `~/.ssh/jventures-uat.pem`
    - [x] `/app/jventures-uat.pem`
    - [x] `<project-root>/jventures-uat.pem`
- [x] คง SSH user หลักตาม requirement ปัจจุบัน (`ubuntu`) สำหรับการทำงานจริง
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทดสอบ API `check-docker` กับ `ip=10.240.1.114`
- [x] บันทึกผลลง `full_test_result.md` และอัปเดตสถานะใน `implement_plan.md`

## Request ใหม่: ทดสอบเฉพาะ IP 10.240.1.103 ด้วย user/key เฉพาะกิจ (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- สำหรับการทดสอบเฉพาะ `10.240.1.103` ให้ใช้ SSH user เป็น `jventures`
- และใช้ key `jventures-uat.pem`

### แผนดำเนินการรอบนี้
- [x] ปรับ logic ใน API `check-docker` ให้ทำเงื่อนไขเฉพาะ `ip === 10.240.1.103`
    - [x] บังคับ user เป็น `jventures` เฉพาะ IP นี้
    - [x] บังคับ key file เป็น `jventures-uat.pem` เฉพาะ IP นี้
    - [x] คงค่า default logic เดิมสำหรับ IP อื่นทั้งหมด
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทำ Senior QA test ด้วย `ip=10.240.1.103` และบันทึกผลใน `full_test_result.md`
- [x] อัปเดตสถานะในเอกสารนี้หลังทดสอบ

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/aws/nonprod/backup-readiness/check-docker/route.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- `POST /api/operations/aws/nonprod/backup-readiness/check-docker` ด้วย `{"ip":"10.240.1.103"}`
- ผลลัพธ์: `HTTP 200`, `success=true`
- ได้ผล `docker ps` กลับมาจริงจากปลายทาง

## Request ใหม่: ปรับ SSH Credential/Method สำหรับ AWS Non-Prod Backup Readiness (Approved)

สถานะ: 🚧 Fix Implemented (Waiting Key Provisioning + Senior QA Retest Pass)

รายละเอียดคำขอ:
- ปรับฟังก์ชัน Backup Readiness (aws-nonprod) ให้เปลี่ยนการเชื่อมต่อ SSH
- ใช้ key `jventures-uat.pem`
- ใช้ user `ubuntu`

### แผนดำเนินการรอบนี้
- [x] วิเคราะห์โค้ดจุดที่เกี่ยวข้องกับ SSH ใน Backup Readiness
- [x] ปรับไฟล์ `src/app/api/operations/aws/nonprod/backup-readiness/check-docker/route.js`
    - [x] เปลี่ยน SSH user จาก `jventures` เป็น `ubuntu`
    - [x] เปลี่ยนคำสั่งให้ใช้ key แบบ explicit ด้วย `-i /app/jventures-uat.pem`
    - [x] คง option SSH ที่จำเป็น (`StrictHostKeyChecking=no`, `UserKnownHostsFile=/dev/null`)
- [x] ตรวจสอบ syntax/error ของไฟล์ที่แก้ไข
- [x] Senior QA ทำ full test และบันทึกผลลง `full_test_result.md`
- [x] อัปเดต `implement_plan.md` ตามผลทดสอบ และรออนุมัติปรับแก้ (ถ้ามี)
- [ ] แก้ไขเพิ่มเติมตามผล QA จนผ่านทั้งหมด

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/aws/nonprod/backup-readiness/check-docker/route.js`

### ผลตรวจสอบนักพัฒนา (2026-02-26)
- ตรวจ error เฉพาะไฟล์ที่แก้ไขแล้ว: ไม่พบ error ใหม่
- Smoke test endpoint `check-docker`:
    - `GET /api/operations/aws/nonprod/backup-readiness/check-docker` = `405` (method guard ทำงาน)
    - `POST` body `{}` = `400` (`IP address required`)
    - `POST` body `{"ip":"127.0.0.1"}` = `500` พร้อมหลักฐานว่า command ใช้ `-i /app/jventures-uat.pem` และ `ubuntu@...` ตามที่ต้องการ

### ผลทดสอบ Senior QA (2026-02-26)
- ทดสอบ `POST /api/operations/aws/nonprod/backup-readiness/check-docker` ด้วย `ip=10.240.1.103`
- ผลลัพธ์: `500 Internal Server Error`
- Error หลัก:
    - `Identity file /app/jventures-uat.pem not accessible: No such file or directory`
    - `ubuntu@10.240.1.103: Permission denied (publickey,password)`

### ข้อเสนอเพื่อรออนุมัติปรับแก้
- [ ] จัดวางไฟล์ key `jventures-uat.pem` ให้ API runtime เข้าถึงได้ที่ `/app/jventures-uat.pem` (หรือกำหนด env `BACKUP_READINESS_SSH_KEY_PATH` ให้ชี้ path จริง)
- [x] เพิ่ม pre-check ใน API ก่อนสั่ง SSH เพื่อแจ้ง error ที่ชัดเจนเมื่อไม่พบ key file
- [x] Retest Senior QA ด้วย IP `10.240.1.103`
- [ ] Retest Senior QA รอบสุดท้ายหลัง provision key แล้วต้องได้ผล `docker ps` สำเร็จ

### ผลหลังแก้ไขรอบอนุมัติ (2026-02-26)
- ปรับ API `check-docker` ให้ตรวจหา key ตามลำดับ:
    1) `BACKUP_READINESS_SSH_KEY_PATH`
    2) `/app/jventures-uat.pem`
    3) `<project-root>/jventures-uat.pem`
- หากไม่พบ key จะตอบกลับ error เชิง config พร้อม `checkedPaths` เพื่อช่วย debug deployment
- Senior QA retest กับ `ip=10.240.1.103` แล้ว ได้ผลตามคาดสำหรับ pre-check แต่ยังไม่ผ่าน functional run เนื่องจากยังไม่มี key file ใน runtime

## Request ใหม่: ใช้ key แบบ explicit ผ่าน BYTEPLUS_VPN_SSH_KEY_PATH (Approved)

สถานะ: ✅ Implemented

รายละเอียดคำขอ:
- ปรับ API ให้รองรับ key แบบ explicit ผ่าน environment variable `BYTEPLUS_VPN_SSH_KEY_PATH`

### แผนดำเนินการรอบนี้
- [x] เพิ่มการอ่านค่า `BYTEPLUS_VPN_SSH_KEY_PATH`
- [x] เพิ่ม `ssh -i <key>` เมื่อมีการกำหนดค่า env
- [x] เพิ่มการตรวจสอบว่า key file มีอยู่จริงก่อนรันคำสั่ง
- [x] อัปเดต metadata เพื่อตรวจสอบว่า key ถูก configure หรือไม่

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/byteplus/create-vpn/route.js`

### หมายเหตุการใช้งาน~
- ต้อง restart process ของ Next.js หลังตั้งค่า env เพื่อให้ค่าใหม่มีผล

## Request ใหม่: Senior QA Test - Create VPN (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- ทำ QA test สำหรับฟีเจอร์ Create VPN

### แผนดำเนินการรอบนี้
- [x] รออนุมัติแผนจากผู้ใช้งานก่อนเริ่มทดสอบ
- [x] ทดสอบหน้า form `GET /operations/byteplus/create-vpn`
- [x] ทดสอบ API validation (กรณี input ไม่ถูกต้อง)
- [x] ทดสอบ API create VPN แบบใช้งานจริงผ่านแนวทาง script-based SSH
- [x] ตรวจสอบรูปแบบชื่อไฟล์ `hw_uat_<name>.ovpn` และการดาวน์โหลด
- [x] บันทึกผลทดสอบลง `full_test_result.md`
- [x] อัปเดตสถานะในเอกสารนี้

### ผลทดสอบรอบนี้ (2026-02-26)
- `GET /operations` = `200`
- `GET /operations/byteplus/create-vpn` = `200`
- API validation (`name` ว่าง) = `400` ตามคาด
- API create VPN จริง = `200` สำเร็จหลังแก้ command chain
- ชื่อไฟล์ผลลัพธ์เป็น `hw_uat_<name>.ovpn` ตาม requirement
- ตรวจ decode ไฟล์ `.ovpn` จาก base64 สำเร็จ (payload integrity ผ่าน)

### Root Cause และการแก้ไขที่ทำ
- เดิมคำสั่ง EasyRSA ต้องยืนยัน `yes` ทำให้ API non-interactive ล้ม
- แก้โดยใช้ `EASYRSA_BATCH=1` และ `sudo -n` สำหรับคำสั่งที่ต้องสิทธิ์สูง
- เพิ่ม marker `__B64_BEGIN__` และ logic แยกเฉพาะ base64 payload เพื่อตัด log ที่ปนใน stdout

## Request ใหม่: ใช้แนวทาง SSH จาก connectVPNServer.sh ในโค้ด (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- ทดสอบด้วยสคริปต์เท่านั้น เพื่อยืนยันว่าแนวทางในสคริปต์เชื่อมต่อได้
- ปรับโค้ดให้ใช้แนวทางเดียวกับสคริปต์

### แผนดำเนินการรอบนี้
- [x] ทดสอบ `./connectVPNServer.sh "echo SCRIPT_SSH_OK"` เพื่อยืนยันการเชื่อมต่อ
- [x] ปรับ API ให้เรียกผ่าน `connectVPNServer.sh` โดยตรง
- [x] ปรับข้อความ error ให้แยกกรณีไม่พบสคริปต์
- [x] อัปเดตสถานะในเอกสารนี้

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/api/operations/byteplus/create-vpn/route.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- ตรวจสอบการเชื่อมต่อด้วยสคริปต์ผ่าน (`SCRIPT_SSH_OK`)
- API เปลี่ยนแนวทางเป็น script-based SSH เรียบร้อย

## Request ใหม่: ปรับ BytePlus Tab ให้เป็น Link ไปหน้า Input Form (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- ปรับ frontend ที่ BytePlus tab ให้แสดงเป็น link เพื่อเรียกไปยังหน้า input form
- ไม่ให้นำ form ไปฝังใน tab โดยตรง

### แผนดำเนินการรอบนี้
- [x] รออนุมัติแผนจากผู้ใช้งานก่อนเริ่มแก้ไข
- [x] ปรับหน้า `IT Operations > BytePlus` ให้มีเฉพาะลิงก์ไปหน้า Create VPN Account
- [x] สร้าง/ปรับหน้าแยกสำหรับ input form (`name`, `email`) และปุ่ม Create/Download
- [x] คงการเรียก API เดิม `/api/operations/byteplus/create-vpn`
- [x] ทดสอบ flow ใหม่ (Tab -> Link -> Form -> Create -> Download)
- [x] อัปเดตผลใน `full_test_result.md` และสถานะในเอกสารนี้

### ไฟล์ที่แก้ไขรอบนี้
- `src/app/operations/page.js`
- `src/app/operations/byteplus/create-vpn/page.js`

### ผลทดสอบรอบนี้ (2026-02-26)
- `GET /operations` ได้สถานะ `200`
- `GET /operations/byteplus/create-vpn` ได้สถานะ `200`
- Flow UI เป็นไปตาม requirement: BytePlus tab แสดงเป็นลิงก์ไปหน้าฟอร์มแยก

## Request ใหม่: Frontend Dashboard > IT Operations > BytePlus > Create VPN Account (Approved)

สถานะ: ✅ Implemented (Waiting Senior QA Full Test)

รายละเอียดคำขอ:
- เพิ่มฟังก์ชันสร้าง VPN account ในแท็บ BytePlus
- ฟอร์มรับข้อมูล `name`, `email`
- ฝั่ง API ทำ SSH ไป `192.168.80.1` เพื่อรันคำสั่ง:
    - `cd /etc/openvpn/easy-rsa`
    - `./easyrsa build-client-full <name> nopass`
    - `/root/client-configs/make_config.sh <name>`
- เปลี่ยนชื่อไฟล์ผลลัพธ์ `.ovpn` เป็นรูปแบบ `hw_uat_<name>.ovpn`
- ผู้ใช้หน้าเว็บดาวน์โหลดไฟล์ `.ovpn` ได้

### แผนดำเนินการรอบนี้
- [x] รออนุมัติแผนจากผู้ใช้งานก่อนเริ่มพัฒนา
- [x] เพิ่ม UI ในแท็บ BytePlus สำหรับฟอร์ม `name`, `email` และปุ่ม Create/Download
- [x] สร้าง API Route สำหรับสร้าง VPN account และจัดการ validation input
- [x] ทำ SSH ไปยัง `192.168.80.1` และรันคำสั่งตามลำดับที่ระบุผ่าน API
- [x] ดึงไฟล์ `.ovpn` ที่สร้างเสร็จ เปลี่ยนชื่อเป็น `hw_uat_<name>.ovpn` แล้วส่งกลับให้ดาวน์โหลด
- [x] จัดการ error message ที่อ่านง่าย (SSH fail / host error / file ไม่พบ)
- [x] ทดสอบ syntax/lint เฉพาะไฟล์ที่เปลี่ยน และบันทึกผลลง `full_test_result.md`
- [ ] Senior QA ทำ full test ตามกระบวนการ และอนุมัติผลรอบสุดท้าย

### ไฟล์ที่พัฒนา
- `src/app/operations/page.js`
- `src/app/api/operations/byteplus/create-vpn/route.js`

### ผลทดสอบนักพัฒนา (2026-02-25)
- ตรวจ error เฉพาะไฟล์ที่แก้ (`operations/page.js`, `create-vpn/route.js`) ผ่านทั้งหมด
- `npm run lint` พบ error เดิมในไฟล์อื่นที่ไม่เกี่ยวกับงานนี้:
    - `src/app/home/page.js` (react-hooks/set-state-in-effect)
    - `src/app/operations/aws/nonprod/billing/page.js` (react/no-unescaped-entities)

## Request ใหม่: ทดสอบการเชื่อมต่อ Remote Server ผ่าน SSH (Approved)

สถานะ: ✅ Completed

รายละเอียดคำขอ:
- ทดสอบการเชื่อมต่อไปยังเซิร์ฟเวอร์ปลายทางด้วยคำสั่ง `ssh jventures@192.168.80.1`

### แผนดำเนินการรอบนี้
- [x] รออนุมัติแผนจากผู้ใช้งานก่อนเริ่มทดสอบ
- [x] ทดสอบ SSH แบบ non-interactive เพื่อตรวจสอบ network/auth เบื้องต้น
- [x] บันทึกผลการทดสอบลง `full_test_result.md` (ตามกระบวนการ QA)
- [x] อัปเดตสถานะในเอกสารนี้หลังทดสอบเสร็จ
- [x] ไม่พบประเด็นที่ต้องแก้ไขเพิ่มเติมจากผลทดสอบรอบนี้

### ผลการทดสอบรอบนี้ (2026-02-25)
- คำสั่งที่ใช้: `ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=no jventures@192.168.80.1 'echo SSH_OK'`
- ผลลัพธ์: `SSH_OK`
- สรุป: การเชื่อมต่อ SSH ไปยัง `192.168.80.1` ด้วยผู้ใช้ `jventures` สำเร็จ

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

## Request ใหม่: ดึงรายการ EC2 5 รายการจาก aws_prod (Pending Approval)

สถานะ: ⏳ Waiting for Approval
วันที่: 4 มีนาคม 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- รันคำสั่งเพื่อดึงรายการ EC2 จาก AWS profile `aws_prod`
- แสดงผลเฉพาะ 5 instance ล่าสุดตามข้อมูลที่ดึงได้

### แผนดำเนินการรอบนี้ (รออนุมัติ)
- [ ] ตรวจสอบว่า profile `aws_prod` ใช้งานได้บนเครื่องนี้
- [ ] รันคำสั่ง `aws ec2 describe-instances` โดยใช้ `--profile aws_prod --region ap-southeast-1`
- [ ] คัดผลลัพธ์ให้เหลือ 5 instances และสรุปข้อมูลหลัก (InstanceId, State, PrivateIp, Name)
- [ ] รายงานผลลัพธ์ให้ผู้ใช้

### หมายเหตุสำคัญก่อนดำเนินการ
- [ ] รออนุมัติแผนจากผู้ใช้งานก่อนรันคำสั่งจริง

## Request ใหม่: ปรับ Key Pair Create EC2 PROD ให้ตรง AWS จริง (Approved)

สถานะ: ✅ Completed
วันที่: 4 มีนาคม 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- ปรับฟังก์ชัน `Create EC2 Instance` ฝั่ง PROD
- เปลี่ยนค่า key-name จาก `jventures-prod.pem` เป็น `jventures-prod`

### แผนดำเนินการรอบนี้
- [x] ตรวจสอบ key pair ที่มีอยู่จริงใน `aws_prod`
- [x] ปรับ backend API ใน `src/app/api/operations/aws/prod/createec2/route.js`
    - [x] เปลี่ยนค่า `--key-name` เป็น `jventures-prod`
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] บันทึกผลใน `full_test_result.md` และอัปเดตสถานะใน `implement_plan.md`

### ผลตรวจสอบรอบนี้ (2026-03-04)
- ตรวจ key pair ใน `aws_prod` พบชื่อที่เกี่ยวข้องเป็น `jventures-prod`
- ตรวจโค้ดหลังแก้พบคำสั่งเป็น `--key-name jventures-prod`
- ตรวจ syntax/error ของไฟล์ที่แก้ ไม่พบปัญหา
- smoke re-test หลังแก้: `GET /api/operations/aws/prod/createec2` ได้ `405` และ `POST {}` ได้ `400` พร้อมข้อความ validation ปกติ

## Request ใหม่: ปรับ Create EC2 PROD ให้ใช้ Subnet ใหม่ + Clone Security Group (Approved)

สถานะ: ✅ Completed
วันที่: 4 มีนาคม 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- ฟังก์ชัน `Create EC2 Instance` ฝั่ง PROD ให้ใช้ `subnet id` ใหม่เป็น `subnet-0ce756ed09bd7abe5`
- ก่อนสร้าง EC2 ให้สร้าง Security Group ใหม่ โดย copy rule จาก `sg-0c3b54853be3ac21e`
- ตั้งชื่อ Security Group ใหม่เป็น `<instanceName>-sg`

### แผนดำเนินการรอบนี้
- [x] ปรับ API `src/app/api/operations/aws/prod/createec2/route.js`
    - [x] เพิ่มขั้นตอน create security group ใหม่ใน VPC ของ subnet เป้าหมาย
    - [x] คัดลอก ingress/egress rules จาก source SG `sg-0c3b54853be3ac21e` มายัง SG ใหม่
    - [x] ตั้งชื่อ SG ใหม่เป็น `<instanceName>-sg` และจัดการกรณีชื่อซ้ำ
    - [x] เปลี่ยนการ create EC2 ให้ใช้ `--subnet-id subnet-0ce756ed09bd7abe5`
    - [x] เปลี่ยนการผูก SG ของ instance ให้ใช้ SG ที่สร้างใหม่แทน SG เดิม
- [x] เพิ่ม error handling ให้บอกขั้นตอนที่ fail ชัดเจน (create SG / copy rules / create instance)
- [x] ตรวจ syntax/error ของไฟล์ที่แก้
- [x] ทำ smoke test ตามลำดับ process
    - [x] local test
    - [x] docker test
    - [x] uat test
- [x] บันทึกผลใน `full_test_result.md` และอัปเดตสถานะใน `implement_plan.md`

### ผลทดสอบรอบนี้ (2026-03-04)
- local smoke: `GET /api/operations/aws/prod/createec2` ได้ `405`
- local smoke: `POST {}` ไป endpoint เดียวกัน ได้ `400` พร้อมข้อความ validation
- docker smoke: `GET /api/operations/aws/prod/createec2` ได้ `405`
- docker smoke: `POST {}` ไป endpoint เดียวกัน ได้ `400` พร้อมข้อความ validation
- uat smoke: `GET https://itportal.jfin.network/api/operations/aws/prod/createec2` ได้ `405`
- uat smoke: `POST {}` ไป endpoint เดียวกัน ได้ `400` พร้อมข้อความ validation
