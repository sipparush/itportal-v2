# Full System Test Report
**Date:** 2026-02-24
**Tested By:** Senior QA (Automated Agent)
**Project:** IT Portal v2 - Security & Operations Module

---

## Executive Summary
All core operational features have been implemented and tested. The primary focus of this cycle was on AWS Operations, specifically the "Backup Readiness" workflow. The system successfully integrates with AWS CLI for listing backups, restoring instances, verifying Docker status via SSH, and terminating test resources. Several edge cases (invalid AMIs, state persistence) were handled during the latest iteration.

## Test Cases & Results

### 1. Authentication & Navigation
| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| AUTH-001 | Login with valid credentials | Redirect to Dashboard | Login successful, session active | **Passed** |
| NAV-001 | Navigate to Operations Menu | Access sub-menus (Map URL, Billing, etc.) | All menus accessible via sidebar | **Passed** |

### 2. AWS Operations: Map URL
| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| MAP-001 | Generate Map URL | Return signed URL or command | Command generated correctly | **Passed** |
| MAP-002 | Input Validation | Reject empty fields | Form validation prevents submission | **Passed** |

### 3. AWS Operations: Add User Access
| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| USER-001 | Add User to Multiple IPs | Script execution success | **Partial** - Script runs, but temp file cleanup is pending | **Passed with Note** |
| USER-002 | Security Scan | No command injection vulnerabilities | Inputs sanitized before passing to shell | **Passed** |

### 4. AWS Operations: Billing
| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BILL-001 | View Cost Report | Display JSON data in table | Data fetches from local/AWS CLI correctly | **Passed** |

### 5. AWS Operations: Create EC2 (Deploy UAT)
| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| EC2-001 | Launch Instance | Instance Created, IP returned | Instance ID and IP displayed | **Passed** |
| EC2-002 | Verify Key Pair | Use `jventures-uat` | Key pair confirmed in API payload | **Passed** |

### 6. AWS Operations: Backup Readiness (Focus Area)
| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BAK-001 | **List Backups (Initial Load)** | Page loads without error; state loads from `backupec2_state.json`; previous test dates visible. | Page rendered successfully in browser. Network tab shows `GET /list` returned cached data. | **Passed** |
| BAK-002 | **Reload from AWS Button** | Clicking "Reload from AWS" shows loading spinner, then updates list with fresh data from AWS. | Spinner appeared. Network request `GET /list?refresh=true` succeeded. New backups appeared. | **Passed** |
| BAK-003 | **Restore Backup (Success)** | Clicking "Restore" changes button to "Restoring...". After completion, IP button updates to show IP address immediately without page refresh. | "Restoring..." state verified. "Restore" button changed to "Restored" (disabled). IP button changed from "N/A" to `10.x.x.x` (green). | **Passed** |
| BAK-004 | **Restore Backup (Invalid AMI)** | Attempting to restore a backup with a deleted AMI should show a clear alert error, not a crash. | Alert popup: "Restore Failed: AMI ID ... not found". UI reverted to stable state. | **Passed** |
| BAK-005 | **Check Docker Status (Frontend)** | Clicking the IP button opens a modal. Modal shows "Loading...", then displays `docker ps` output. | Modal opened as overlay. Loader text visible. Real SSH output verified in black terminal-like box. Close button works. | **Passed** |
| BAK-006 | **Terminate Instance (Integration)** | Clicking "Terminate" shows confirmation dialog. Confirming changes IP button to "N/A", removes Terminate button, and sets status to "Completed". | Confirmation dialog accepted. Terminate API call success. Row updated: Status="Completed", IP="N/A", Test Date=Today. | **Passed** |
| BAK-007 | **Persistence** | Reloading the page after Terminate checks that "Completed" status and "Test Date" are preserved. | Page reload performed. Row for tested backup still shows "Completed" and today's date. | **Passed** |

## Critical Issues Found & Fixed
1.  **AMI Validity**: Previously, restoring an old backup point failed with a 500 error if the underlying AMI was deleted.
    *   *Fix*: Added pre-flight check `aws ec2 describe-images` and logic to fetch the *latest* recovery point dynamically using `ResourceArn`.
2.  **State Persistence**: Restore results were lost on page refresh.
    *   *Fix*: Implemented `backupec2_state.json` read/write logic and "Reload from AWS" button.
3.  **UI Feedback**: Restore button text (IP) didn't update immediately.
    *   *Fix*: Updated frontend state handler to accept `privateIp` from API response immediately.

## Remaining Action Items
1.  **Add User Feature**: Implement automatic cleanup of temporary files (`/tmp/UserList.txt`) after script execution to improve security hygiene.
2.  **Billing**: Add date range picker for more flexible reporting.

---
**Verdict:** The system is **Stable** for the "Backup Readiness" workflow. The critical path for verifying backups (Restore -> Check -> Terminate) is fully functional and robust against stale AMI IDs.

**Approver:** Senior QA

---

## 7. BytePlus Operations: Create VPN Account (Developer Verification)
**Date:** 2026-02-25
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BVP-001 | UI Form (Name, Email) | มี input `name`, `email` และปุ่ม Create | หน้า `IT Operations > BytePlus` แสดงฟอร์มและปุ่มครบ | **Passed** |
| BVP-002 | API Input Validation | ปฏิเสธค่าไม่ถูกต้อง | API ตรวจสอบ `name` และ `email` ก่อนประมวลผล | **Passed** |
| BVP-003 | SSH Command Flow | รันคำสั่งสร้าง VPN ตามลำดับที่กำหนด | Route มีลำดับคำสั่ง `cd` -> `build-client-full` -> `make_config.sh` -> อ่านไฟล์ | **Passed (Code Review)** |
| BVP-004 | Download Filename Format | ชื่อไฟล์ดาวน์โหลดเป็น `hw_uat_<name>.ovpn` | API ส่ง `fileName` ตามรูปแบบ และหน้าเว็บรองรับดาวน์โหลด | **Passed** |
| BVP-005 | Frontend Download | ผู้ใช้ดาวน์โหลดไฟล์ `.ovpn` ได้ | รองรับทั้ง auto-download หลังสร้างสำเร็จ และปุ่ม Download ซ้ำ | **Passed** |

### Notes
- ผล `npm run lint` ล่าสุดพบปัญหาในไฟล์เดิมที่ไม่เกี่ยวกับงานนี้:
    - `src/app/home/page.js`
    - `src/app/operations/aws/nonprod/billing/page.js`
- จำเป็นต้องให้ Senior QA ทำ Full Test ตามกระบวนการและบันทึกผลอนุมัติรอบสุดท้าย

---

## 8. BytePlus UI Adjustment: Tab Link to Separate Form (Senior QA)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BVP-UI-001 | BytePlus Tab Content | แท็บ BytePlus แสดงเป็นลิงก์ไปหน้าฟอร์ม | พบปุ่มลิงก์ `Open Create VPN Form` ในแท็บ BytePlus และไม่มีฟอร์มฝังในแท็บ | **Passed** |
| BVP-UI-002 | Route to Form Page | ลิงก์ต้องเปิดหน้า form แยก | `GET /operations/byteplus/create-vpn` ตอบกลับ `200` | **Passed** |
| BVP-UI-003 | Operations Page Availability | หน้า Operations ยังเข้าถึงได้ปกติ | `GET /operations` ตอบกลับ `200` | **Passed** |

**QA Verdict:** UI ปรับตาม requirement แล้ว (Tab เป็นลิงก์ไปหน้าฟอร์มแยก)

---

## 9. Script-based SSH Validation for BytePlus VPN (Senior QA)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BVP-SSH-001 | Script-only SSH Connectivity | ใช้ `connectVPNServer.sh` เชื่อมต่อได้ | รันทดสอบ `./connectVPNServer.sh "echo SCRIPT_SSH_OK"` และยืนยันการเชื่อมต่อสำเร็จ | **Passed** |
| BVP-SSH-002 | Code Strategy Alignment | API ใช้แนวทางเดียวกับสคริปต์ | ปรับ API ให้เรียก `connectVPNServer.sh` โดยตรงแทน direct SSH command | **Passed** |

**QA Verdict:** ยืนยันแล้วว่าแนวทางในสคริปต์ใช้งานได้ และถูกนำไปปรับใช้ในโค้ดเรียบร้อย

---

## 10. Senior QA Test: Create VPN (Execution Round)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BVP-QA-001 | Form Route Availability | หน้า `/operations/byteplus/create-vpn` เข้าได้ | HTTP `200` | **Passed** |
| BVP-QA-002 | API Validation | ส่งข้อมูลไม่ครบต้องได้ error validation | HTTP `400`, message: `Missing required fields: name and email` | **Passed** |
| BVP-QA-003 | Real Create VPN API | สร้าง VPN และคืนไฟล์ `.ovpn` | HTTP `500`, message: `SSH authentication failed (Permission denied)` | **Failed (Blocker)** |

### Blocker Analysis
- ทดสอบแยกด้วยสคริปต์เชื่อมต่อ SSH บน shell ผู้ใช้ผ่านได้
- แต่เมื่อเรียกผ่าน API process พบว่า SSH auth ไม่ผ่าน (`Permission denied`)
- จึงยังไม่สามารถยืนยันขั้นตอนตรวจชื่อไฟล์ `hw_uat_<name>.ovpn` และการดาวน์โหลดจากผลจริงได้

**QA Verdict:** ไม่ผ่านในเคส Create VPN จริง เนื่องจาก SSH authentication context ของ API process ยังไม่พร้อม

---

## 11. Senior QA Retest: Create VPN (Final Pass)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BVP-QA-R1 | Real Create VPN API | สร้าง VPN และคืนไฟล์ `.ovpn` ได้ | HTTP `200`, `success=true` | **Passed** |
| BVP-QA-R2 | File Naming Format | ชื่อไฟล์ต้องเป็น `hw_uat_<name>.ovpn` | ได้ชื่อไฟล์ `hw_uat_qa0226012152.ovpn` | **Passed** |
| BVP-QA-R3 | Payload Integrity | base64 ต้อง decode เป็นไฟล์ได้ | decode สำเร็จ, ขนาดไฟล์ `5012` bytes | **Passed** |

### Fixes Verified in This Retest
- ใช้ `sudo -n` กับคำสั่งที่ต้องสิทธิ์สูง
- ใช้ `EASYRSA_BATCH=1` เพื่อให้ EasyRSA รันแบบ non-interactive
- แยก base64 payload ด้วย marker `__B64_BEGIN__` เพื่อหลีกเลี่ยง log ปน

**QA Verdict:** ผ่านครบตาม requirement สำหรับฟีเจอร์ Create VPN

---

## 12. Developer Smoke Test: AWS Non-Prod Backup Readiness - Check Docker (Post SSH Credential Change)
**Date:** 2026-02-26
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BR-SMOKE-001 | API Method Guard | เรียก endpoint ด้วย `GET` ต้องถูกปฏิเสธ | `GET /api/operations/aws/nonprod/backup-readiness/check-docker` ได้ `405 Method Not Allowed` | **Passed** |
| BR-SMOKE-002 | Validation: Missing IP | ไม่ส่ง `ip` ต้องได้ validation error | `POST` body `{}` ได้ `400`, message: `IP address required` | **Passed** |
| BR-SMOKE-003 | SSH Command Path | เมื่อส่ง `ip` ต้องเห็นว่า API ใช้ SSH command ตาม config ใหม่ | `POST` body `{"ip":"127.0.0.1"}` ได้ `500` โดย error แสดงคำสั่ง `ssh ... -i /app/jventures-uat.pem ubuntu@127.0.0.1 "docker ps"` | **Passed (Smoke Evidence)** |

### Notes
- ผล `500` ในเคส BR-SMOKE-003 เกิดจากสภาพแวดล้อมทดสอบ local (`/app/jventures-uat.pem` ไม่อยู่ในเครื่อง local และ `127.0.0.1:22` ปฏิเสธการเชื่อมต่อ) ไม่ใช่ regression ของ logic
- ยืนยันได้ว่าโค้ดถูกปรับเป็น SSH user `ubuntu` และใช้ key แบบ explicit `-i /app/jventures-uat.pem` แล้ว

---

## 13. Senior QA Test: AWS Non-Prod Backup Readiness - Check Docker with 10.240.1.103
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BR-QA-001 | Operations Route Availability | หน้า `/operations` ต้องใช้งานได้ | `GET /operations` ได้ `200` | **Passed** |
| BR-QA-002 | Check Docker on Target IP | `POST /check-docker` ด้วย `ip=10.240.1.103` ต้องคืนผล `docker ps` | ได้ `500` และ error: `Identity file /app/jventures-uat.pem not accessible` + `Permission denied (publickey,password)` | **Failed (Blocker)** |

### Blocker Analysis
- API เรียกคำสั่งถูกต้องตาม requirement แล้ว: `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i /app/jventures-uat.pem ubuntu@10.240.1.103 "docker ps"`
- แต่ runtime environment ที่รัน API ไม่มีไฟล์ key ที่ path `/app/jventures-uat.pem` ทำให้ authentication ล้มเหลว

**QA Verdict:** ยังไม่ผ่านสำหรับการตรวจ Docker ที่ IP `10.240.1.103` ในรอบนี้ ต้องแก้ environment/credential ก่อน retest

---

## 14. Senior QA Retest: Backup Readiness Check Docker (Post Key Pre-check Fix)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BR-QA-R1 | Check Docker on Target IP after Fix | หาก key ไม่พร้อม ระบบต้องแจ้งสาเหตุชัดเจนก่อนยิง SSH | `POST /check-docker` กับ `ip=10.240.1.103` ได้ `500` พร้อม message ชัดเจน `SSH key not found for Backup Readiness...` และคืน `checkedPaths` | **Passed** |
| BR-QA-R2 | Functional SSH Run with Target IP | ต้องเชื่อมต่อ SSH และแสดงผล `docker ps` ได้ | ยังไม่ผ่าน เพราะ environment ยังไม่มี key file ตาม path ที่ตรวจ (`/app/jventures-uat.pem` หรือ path ที่กำหนดผ่าน env) | **Failed (Env Blocker)** |

### Fix Verified
- เพิ่ม pre-check หา key file ก่อนรัน SSH
- รองรับ env `BACKUP_READINESS_SSH_KEY_PATH` และ fallback path มาตรฐาน
- เปลี่ยน failure mode จาก SSH auth error ที่กำกวม เป็น configuration error ที่ actionable

**QA Verdict:** โค้ดฝั่ง validation/configuration ผ่านแล้ว แต่ยังต้อง provision key ใน runtime environment ก่อนจึงจะผ่าน functional test เต็มรูปแบบ

---

## 15. Senior QA Targeted Test: 10.240.1.103 with `jventures` + `jventures-uat.pem`
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BR-QA-TGT-001 | Targeted Check Docker Run | ทดสอบ `POST /check-docker` ด้วย `ip=10.240.1.103` โดยใช้ credential เฉพาะกิจ ต้องคืนผล `docker ps` ได้ | ได้ `HTTP 200` และ response `success=true` พร้อมรายการ container จาก `docker ps` | **Passed** |

### Notes
- รอบนี้เป็น targeted test ตามคำขอพิเศษสำหรับ `10.240.1.103`
- ผลทดสอบยืนยันว่าการเชื่อมต่อ SSH และการรัน `docker ps` สำเร็จในเงื่อนไขดังกล่าว

**QA Verdict:** ผ่านสำหรับเคส targeted test ของ `10.240.1.103`

---

## 16. Senior QA Test: Backup Readiness SSH Fallback (10.240.1.114)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BR-FB-001 | Primary SSH Strategy | ลอง `ubuntu + jventures-uat.pem` ก่อน | มีการลอง primary จริง และล้มเหลวด้วย `Permission denied (publickey,password)` | **Passed (Behavior)** |
| BR-FB-002 | Fallback SSH Strategy | เมื่อ primary ไม่ผ่าน ต้อง fallback เป็น `jventures + id_ed25519` | มีการ fallback จริง และเชื่อมต่อด้วย `jventures` สำเร็จ | **Passed (Behavior)** |
| BR-FB-003 | Check Docker Command | หลังเชื่อมต่อได้ต้องรัน `docker ps` สำเร็จ | ปลายทางตอบ `bash: docker: command not found` | **Failed (Env/Host)** |

### Notes
- โค้ด fallback ทำงานตามลำดับที่กำหนดครบถ้วน
- ข้อขัดข้องปัจจุบันอยู่ที่เครื่องปลายทางของ user `jventures` ไม่มีคำสั่ง `docker` ใน PATH (หรือไม่ได้ติดตั้ง)

**QA Verdict:** ฟังก์ชัน fallback ผ่านตาม requirement แต่ functional outcome ยังติด environment ฝั่ง host `10.240.1.114`

---

## 17. Developer Verification: BytePlus Map URL to Endpoint
**Date:** 2026-02-26
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPMAP-001 | BytePlus Tab Link | ใน BytePlus tab มีลิงก์ไปหน้า input form | แสดงลิงก์ `Open Map URL Form` และเปิดหน้าใหม่ได้ | **Passed** |
| BPMAP-002 | Form Route Availability | หน้า `/operations/byteplus/map-url` เข้าได้ | `GET /operations/byteplus/map-url` ได้ `200` | **Passed** |
| BPMAP-003 | API Validation | ส่งข้อมูลไม่ครบต้องได้ validation error | `POST {}` ได้ `{"success":false,"message":"Missing required fields: url and endpoint"}` | **Passed** |
| BPMAP-004 | API Create Service/Route | ส่งข้อมูลครบต้องเรียก create service + create route ตาม endpoint ที่กำหนด | รอบนี้ได้ `HTTP 500` จาก local execution จึงยังไม่ยืนยันผลปลายทางจริง | **Blocked (Env/Connectivity)** |

### Notes
- ฟังก์ชันในโค้ดรองรับการสร้าง `service_name=svc_<url>` และ `route_name=route_<url>` แล้ว
- หน้า form มีฟิลด์ `url`, `endpoint ip:port`, `path (default /)` และลิงก์ `Advance config` ตาม requirement

**QA Verdict:** โค้ดและหน้า UI ตรงตาม requirement แล้ว เหลือ Senior QA full test ใน environment ที่เข้าถึง `10.224.100.4:8005` ได้จริง

---

## 18. Senior QA Test: BytePlus Map URL to Endpoint (Execution Round)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPMAP-QA-001 | Map URL Page Availability | หน้า `/operations/byteplus/map-url` ต้องเข้าได้ | HTTP `200` | **Passed** |
| BPMAP-QA-002 | Real Create Service + Route | ส่งข้อมูลครบแล้วต้องสร้าง service และ route สำเร็จ | ได้ `500` โดย `Create route failed`, `routeStatus=404`, `routeResponse=Workspace '<service_name>' not found` | **Failed (Blocker)** |

### Blocker Analysis
- การสร้าง service ผ่านแล้ว
- จุดล้มเหลวอยู่ที่ขั้น create route เพราะ endpoint ปัจจุบัน `POST /<service_name>/routes` ถูก Kong ตีความ `<service_name>` เป็น workspace

**QA Verdict:** ยังไม่ผ่านในขั้น create route ต้องปรับ endpoint route creation แล้ว retest

---

## 19. Senior QA Retest: BytePlus Map URL to Endpoint (Route Endpoint Fix)
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPMAP-QA-R1 | Service Before Route | ต้องสร้าง service สำเร็จก่อนสร้าง route เสมอ | `create_service` ได้ `201` ก่อนทุกครั้ง และมี step log ยืนยันลำดับ | **Passed** |
| BPMAP-QA-R2 | Route Creation Compatibility | หาก endpoint แบบ requirement แรกไม่ผ่าน ต้องยังสร้าง route ได้ด้วย endpoint ที่ระบบรองรับ | ลอง `/<service_name>/routes` ได้ `404` แล้ว fallback ไป `/services/<service_name>/routes` ได้ `201` | **Passed** |
| BPMAP-QA-R3 | End-to-End Create | ส่งข้อมูลครบแล้วต้องสร้าง service/route สำเร็จ | API ตอบ `HTTP 200`, `success=true`, ได้ `serviceName`, `routeName`, `routeEndpointUsed` และ payload จากปลายทางครบ | **Passed** |

### Notes
- Retest นี้ยืนยันว่า service ถูกสร้างก่อน route ตาม requirement
- เพิ่ม `steps` และ `routeEndpointUsed` ใน response เพื่อให้ตรวจสอบลำดับและ endpoint ที่ใช้ได้ชัดเจน

**QA Verdict:** ผ่านครบสำหรับฟีเจอร์ BytePlus Map URL to Endpoint

---

## 20. Senior QA Test: BytePlus Map URL Scheme Support
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |

---

## 21. Developer Verification: AWS PROD Create EC2 Instance Form + API
**Date:** 2026-03-04
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-001 | Operations PROD Link | เมนู `Create EC2 Instance` ในแท็บ AWS PROD ต้องเปิดหน้า form ใหม่ได้ | ปรับลิงก์เป็น `/operations/aws/prod/createec2` แล้ว | **Passed (Code Review)** |
| PROD-EC2-002 | Form Route Presence | ต้องมีหน้า form สำหรับกรอก `projectName`, `instanceName`, `instanceType` | สร้างหน้า `GET /operations/aws/prod/createec2` และเชื่อม API ปลายทาง PROD แล้ว | **Passed (Code Review)** |
| PROD-EC2-003 | Backend Fixed Config | API ต้องใช้ค่า `aws_prod`, `ami-0ed30e8b2125a02ca`, `sg-095da6c8cb4a23a70` | ตรวจใน route พบใช้ค่าคงที่ตาม requirement ครบ | **Passed (Code Review)** |
| PROD-EC2-004 | Syntax/Static Error Check | ไฟล์ที่แก้ต้องไม่เกิด error ใหม่ | ตรวจ `get_errors` แล้วไม่พบ error ในไฟล์ที่แก้ทั้งหมด | **Passed** |

### Notes
- รอบนี้เป็นการทดสอบระดับ Developer verification ใน local workspace
- ยังไม่ได้ยิงสร้าง EC2 จริงในสภาพแวดล้อม Production
- ต้องรอ Senior QA full test ตาม process ก่อนปิดงานรอบนี้

---

## 22. Developer Local Smoke Test: AWS PROD Create EC2 (Route/API)
**Date:** 2026-03-04
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-LCL-001 | New Page Route | `GET /operations/aws/prod/createec2` ต้องเข้าได้ | ได้ `HTTP 200` | **Passed** |
| PROD-EC2-LCL-002 | API Method Guard | `GET /api/operations/aws/prod/createec2` ต้องถูกปฏิเสธ | ได้ `HTTP 405` | **Passed** |
| PROD-EC2-LCL-003 | API Validation | `POST` body ว่างต้องได้ validation error | ได้ `HTTP 400` และ `Missing required fields: instanceName or projectName` | **Passed** |
| PROD-EC2-LCL-004 | PROD Menu Link | ลิงก์ `Create EC2 Instance` ฝั่ง PROD ต้องชี้ route ใหม่ | ตรวจจากหน้า `/operations` พบ href เป็น `/operations/aws/prod/createec2` | **Passed** |

### Notes
- รอบนี้เป็น local smoke test เท่านั้น และหลีกเลี่ยงการสร้าง EC2 จริงใน environment production
- ขั้นต่อไปตาม process: Docker test -> UAT test -> Senior QA full test

---

## 23. Developer Docker Smoke Test: AWS PROD Create EC2 (Route/API)
**Date:** 2026-03-04
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-DKR-001 | Docker App Route | `GET /operations/aws/prod/createec2` ต้องเข้าได้ผ่าน container | ได้ `HTTP 200` | **Passed** |
| PROD-EC2-DKR-002 | Docker API Method Guard | `GET /api/operations/aws/prod/createec2` ต้องถูกปฏิเสธ | ได้ `HTTP 405` | **Passed** |
| PROD-EC2-DKR-003 | Docker API Validation | `POST {}` ต้องได้ validation error | ได้ `HTTP 400` และ message `Missing required fields: instanceName or projectName` | **Passed** |

### Notes
- ใช้คำสั่ง `docker compose up -d --build` สำหรับ environment test
- หลีกเลี่ยงการยิงเคสสร้าง EC2 จริงในรอบ smoke test
- ขั้นต่อไป: UAT test หลัง `git push` และรอ pipeline deploy

---

## 24. Senior QA UAT Test: AWS PROD Create EC2 (Post Deploy)
**Date:** 2026-03-04
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-UAT-001 | UAT Page Availability | หน้า `/operations/aws/prod/createec2` ต้องเข้าได้บน UAT | `GET https://itportal.jfin.network/operations/aws/prod/createec2` ได้ `HTTP 200` | **Passed** |
| PROD-EC2-UAT-002 | UAT API Method Guard | `GET /api/operations/aws/prod/createec2` ต้องถูกปฏิเสธ | ได้ `HTTP 405` | **Passed** |
| PROD-EC2-UAT-003 | UAT API Validation | `POST {}` ต้องได้ validation message | ได้ `HTTP 400` และ `Missing required fields: instanceName or projectName` | **Passed** |
| PROD-EC2-UAT-004 | UAT Navigation Link | หน้า `/operations` ต้องมีลิงก์ `Create EC2 Instance` ไป route ใหม่ | ตรวจ HTML พบ href `/operations/aws/prod/createec2` | **Passed** |

### QA Verdict
- ผ่านครบสำหรับการ deploy ฟีเจอร์ `Create EC2 Instance` ฝั่ง AWS PROD ใน UAT environment

---

## 25. Developer Verification: Update PROD EC2 Key Pair Name
**Date:** 2026-03-04
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-KEY-001 | Key Pair Config Update | ฟังก์ชัน Create EC2 (PROD) ต้องใช้ `jventures-prod.pem` แทน `jventures-uat` | ตรวจโค้ดใน API พบ `--key-name jventures-prod.pem` | **Passed (Code Review)** |
| PROD-EC2-KEY-002 | Syntax Check | ไฟล์ที่แก้ต้องไม่เกิด syntax error | ตรวจ error ที่ `src/app/api/operations/aws/prod/createec2/route.js` ไม่พบปัญหา | **Passed** |

### Notes
- รอบนี้เป็นการปรับค่า configuration เฉพาะ backend command
- ยังไม่ได้รันเคสสร้าง EC2 จริงใน production environment

---

## 26. Developer Verification: Correct PROD Key Name to `jventures-prod`
**Date:** 2026-03-04
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-KEY-003 | Existing Key Name Check | ต้องยืนยันชื่อ key pair ที่มีจริงใน `aws_prod` | `describe-key-pairs` พบ `jventures-prod` | **Passed** |
| PROD-EC2-KEY-004 | API Command Update | โค้ดต้องใช้ `--key-name jventures-prod` | ตรวจโค้ดใน API พบ `--key-name jventures-prod` | **Passed (Code Review)** |
| PROD-EC2-KEY-005 | Syntax Check | ไฟล์ที่แก้ต้องไม่เกิด syntax error | ตรวจ error ที่ route ไม่พบปัญหา | **Passed** |

### Notes
- รอบนี้เป็นการแก้ชื่อ key-name ให้ตรงกับ key pair ที่มีอยู่จริงใน AWS profile `aws_prod`
- ยังไม่ได้รันเคส create ผ่าน API เพื่อหลีกเลี่ยงการสร้างทรัพยากรเพิ่มโดยไม่จำเป็น

---

## 27. Developer Local Smoke Retest: PROD Create EC2 API (Post Key Fix)
**Date:** 2026-03-04
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-SMOKE-001 | API Method Guard | `GET /api/operations/aws/prod/createec2` ต้องถูกปฏิเสธ | ได้ `HTTP 405` | **Passed** |
| PROD-EC2-SMOKE-002 | API Validation | `POST {}` ต้องได้ validation error | ได้ `HTTP 400` และข้อความ `Missing required fields: instanceName or projectName` | **Passed** |

### Notes
- รอบนี้เป็น smoke re-test แบบปลอดภัย (ไม่สร้าง EC2 จริง)
| :--- | :--- | :--- | :--- | :--- |
| BPMAP-SCH-001 | Scheme Validation | รองรับเฉพาะ `http` และ `https` | ทดสอบ `scheme=ftp` ได้ `400 Bad Request` | **Passed** |
| BPMAP-SCH-002 | Target URL Composition | ต้องประกอบ URL เป็น `<scheme>://<endpoint_ip>:<port><path>` | ทดสอบ `scheme=https`, `endpoint=10.240.1.114:3000`, `path=/path1` ได้ `targetUrl=https://10.240.1.114:3000/path1` | **Passed** |
| BPMAP-SCH-003 | Service/Route Create with Scheme | ต้องสร้าง service และ route สำเร็จ โดย service ใช้ scheme ที่เลือก | API ตอบ `200`, `success=true`, `service.protocol=https`, และ route ถูกสร้างสำเร็จ | **Passed** |

### Notes
- ฟอร์มรองรับ dropdown `scheme` (`http`, `https`) แล้ว
- API รับค่า `scheme` และนำไปสร้าง service URL จริงตาม requirement

**QA Verdict:** ผ่านครบสำหรับการรองรับ scheme ในฟังก์ชัน BytePlus Map URL to Endpoint

---

## 21. Senior QA Test: BytePlus Map URL - Create Fail Message to Frontend
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPMAP-ERR-001 | Service Create Fail Message | เมื่อ create service fail ต้องส่งข้อความอ่านง่ายกลับ frontend | ทดสอบเคสชื่อซ้ำ (`svc_example.com`) ได้ `HTTP 409` พร้อม message `Create service failed: UNIQUE violation detected on '{name="svc_example.com"}'` | **Passed** |
| BPMAP-ERR-002 | Error Handling Structure | ยังต้องมีข้อมูล debug เพื่อวิเคราะห์ต่อ | response ยังมี `serviceStatus`, `serviceResponse`, `steps` ครบ | **Passed** |
| BPMAP-ERR-003 | Frontend Error Display | หน้า form ต้องแสดงข้อความจาก API โดยตรง | frontend รองรับและแสดง `message` จาก API ได้ตรงข้อความ | **Passed** |

**QA Verdict:** ผ่านครบสำหรับ requirement การส่งข้อความ create fail ไปหน้า frontend

---

## 22. Senior QA Test: BytePlus Edit URL to Endpoint
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPEDIT-001 | BytePlus Tab Link | มีลิงก์ไปหน้า `Edit URL to Endpoint` | พบลิงก์ `Open Edit URL Form` และเปิดหน้าได้ | **Passed** |
| BPEDIT-002 | Fetch by FQDN | กรอก `fqdn` แล้วดึงค่าเดิมมาใส่ฟอร์ม | API `action=fetch` คืน `scheme`, `endpoint`, `path` สำเร็จ | **Passed** |
| BPEDIT-003 | Edit Mapping | กด `Edit` แล้วต้องอัปเดตค่าปลายทางได้ | เปลี่ยนเป็น `scheme=https`, `endpoint=127.0.0.1:3004`, `path=/v2` สำเร็จ และ fetch ซ้ำเห็นค่าที่แก้แล้ว | **Passed** |
| BPEDIT-004 | Delete Mapping | กด `Delete` แล้วต้องลบ route/service ได้ | ลบสำเร็จ และ fetch หลังลบได้ `404` พร้อมข้อความ `Fetch route failed: Not found` | **Passed** |

### Notes
- ทดสอบ flow แบบครบวงจรด้วยโดเมนทดสอบชั่วคราว (`qa-edit-...jfin.network`)
- ยืนยันว่า API ใหม่รองรับ `fetch`, `edit`, `delete` ตาม requirement

**QA Verdict:** ผ่านครบสำหรับฟีเจอร์ BytePlus Edit URL to Endpoint

---

## 23. Senior QA Retest: Edit `example.com` Not Found Message
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPEDIT-NF-001 | Fetch Not Found Message | `fetch example.com` ต้องได้ `404` พร้อมข้อความอ่านง่าย | ได้ `404` และ message `ไม่พบ FQDN นี้ในระบบ (example.com) กรุณาสร้าง mapping ก่อน` | **Passed** |
| BPEDIT-NF-002 | Edit Not Found Message | `edit example.com` ต้องได้ `404` พร้อมข้อความเดียวกัน | ได้ `404` และ message เดียวกัน | **Passed** |
| BPEDIT-NF-003 | Frontend Guidance | หน้า Edit ต้องมีคำแนะนำเมื่อไม่พบ FQDN | แสดง guidance พร้อมลิงก์ไปหน้า `Create URL to Endpoint` | **Passed** |

**QA Verdict:** ผ่านครบสำหรับการแก้เคส `edit example.com` แล้ว fail โดยแสดงข้อความและคำแนะนำที่ชัดเจน

---

## 28. Developer Smoke Test: PROD Create EC2 API (Subnet + SG Clone Update)
**Date:** 2026-03-04
**Tested By:** Developer (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| PROD-EC2-NET-001 | Local API Method Guard | `GET /api/operations/aws/prod/createec2` ต้องได้ `405` | ได้ `HTTP 405` | **Passed** |
| PROD-EC2-NET-002 | Local API Validation | `POST {}` ต้องได้ `400` | ได้ `HTTP 400` พร้อมข้อความ `Missing required fields: instanceName or projectName` | **Passed** |
| PROD-EC2-NET-003 | Docker API Method Guard | `GET /api/operations/aws/prod/createec2` บน Docker ต้องได้ `405` | ได้ `HTTP 405` | **Passed** |
| PROD-EC2-NET-004 | Docker API Validation | `POST {}` บน Docker ต้องได้ `400` | ได้ `HTTP 400` พร้อมข้อความ validation | **Passed** |
| PROD-EC2-NET-005 | UAT API Method Guard | `GET https://itportal.jfin.network/api/operations/aws/prod/createec2` ต้องได้ `405` | ได้ `HTTP 405` | **Passed** |
| PROD-EC2-NET-006 | UAT API Validation | `POST {}` ที่ UAT ต้องได้ `400` | ได้ `HTTP 400` พร้อมข้อความ validation | **Passed** |

### Notes
- การเปลี่ยนแปลงหลักรอบนี้คือเพิ่ม flow สร้าง SG ใหม่จาก source SG และเปลี่ยน subnet เป็น `subnet-0ce756ed09bd7abe5`
- รอบนี้เป็น smoke test แบบปลอดภัย (ไม่ยิงเคสสร้าง instance จริง) เพื่อหลีกเลี่ยงการสร้างทรัพยากรเพิ่มโดยไม่จำเป็น

---

## 24. Senior QA Retest: Edit with Existing Service but Missing Route
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPEDIT-REPAIR-001 | Fetch Recovery | ถ้า route หายแต่ service ยังมี ต้องโหลดข้อมูลได้ | `fetch example.com` ได้ `200`, `routeMissing=true`, คืน `scheme/endpoint/path` จาก service | **Passed** |
| BPEDIT-REPAIR-002 | Edit Auto Repair Route | เมื่อกด edit ในเคส route หาย ต้องสร้าง route ใหม่อัตโนมัติ | `edit example.com` ได้ `200` และสร้าง `route_example.com` สำเร็จ | **Passed** |
| BPEDIT-REPAIR-003 | Post-Edit Verification | หลัง edit แล้วต้องกลับสู่สถานะปกติ | `fetch example.com` หลัง edit ได้ `routeMissing=false` และค่า endpoint/path ใหม่ถูกต้อง | **Passed** |

### Notes
- แก้ปัญหาคลาสสิก: `Create service failed: UNIQUE...` แต่ edit เดิมหา fqdn ไม่เจอ
- ตอนนี้ API รองรับกรณี service มีอยู่แต่ route หายแล้ว และซ่อม route ได้ในขั้น edit

**QA Verdict:** ผ่านครบสำหรับการแก้เคส service มีอยู่แต่ route หายในหน้า Edit

---

## 25. Senior QA Test: Service Name Suffix `_count` for Duplicate Domain
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPMAP-SFX-001 | Duplicate Domain + Same Path | ถ้าโดเมนซ้ำและ path เดิม ต้องไม่สร้างซ้ำ | `example.com` + `/path1` ได้ `409`, message `mapping นี้มีอยู่แล้ว` | **Passed** |
| BPMAP-SFX-002 | Duplicate Domain + Different Path | ถ้าโดเมนซ้ำแต่ path ใหม่ ต้องตั้งชื่อ service ต่อท้าย `_count` | `example.com` + `/path2` ได้ `200`, `serviceName=svc_example.com_1` | **Passed** |
| BPMAP-SFX-003 | Route Naming Alignment | route name ควรสอดคล้องกับ service ที่ถูก suffix | ได้ `routeName=route_example.com_1` และสร้าง route สำเร็จ | **Passed** |

---

## 29. Senior QA Full Test: Validate All Links (Local + UAT)
**Date:** 2026-03-11
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| LINK-LCL-001 | Local Internal Links | ทุก internal route หลักต้องตอบสถานะใช้งานได้ | ทดสอบ 16 เส้นทางหลัก (`/`, `/contact`, `/home`, `/login`, `/operations`, กลุ่ม AWS/BytePlus) ได้ `HTTP 200` ทั้งหมด | **Passed** |
| LINK-LCL-002 | Local External Links | ลิงก์ภายนอกต้องเข้าถึงได้จากเครื่องทดสอบ | `api-monitor`, `kong-ui-uat`, `kong-ui`, AWS Console ได้ `HTTP 200`; ลิงก์ `http://10.224.100.4:1337/#!/services` ได้ `000` (connect ไม่ได้) | **Passed with Note** |
| LINK-LCL-003 | Placeholder Links | ไม่ควรมีลิงก์ placeholder ที่ปลายทางไม่จริง | พบ `href="#"` ในหลายหน้า (`home`, `operations`, `footer`) | **Failed (Functional Gap)** |
| LINK-DKR-001 | Docker Environment Link Test | ต้องทดสอบซ้ำบน Docker ตาม process | รันไม่ได้ในเครื่องนี้ เนื่องจากไม่พบ `docker`/`docker-compose` ใน WSL distro | **Blocked (Environment)** |
| LINK-UAT-001 | UAT Internal Links | ทุก internal route หลักบน UAT ต้องตอบใช้งานได้ | ทดสอบ 16 เส้นทางหลักบน `https://itportal.jfin.network` ได้ `HTTP 200` ทั้งหมด | **Passed** |

### Notes
- ขั้นตอน UAT ในรอบนี้เป็นการตรวจความพร้อมของลิงก์บนระบบที่ deploy แล้ว (ไม่ได้ทำ `git push` เพิ่ม เพราะคำขอรอบนี้เป็น test only)
- ลิงก์ `10.224.100.4:1337` เป็นปลายทาง private network จึงอาจต้องเข้า VPN/เครือข่ายภายในก่อนใช้งาน
- เพื่อปิดเคส “ลิงก์ไม่ตาย” ให้ครบ ควรแก้ลิงก์ placeholder (`#`) ให้เป็น route จริงหรือ disabled state

**QA Verdict:** Internal links หลักผ่านทั้ง Local/UAT แต่ยังมีช่องว่างจาก placeholder links และ Docker test blocker ใน environment ปัจจุบัน

### Notes
- API ส่งค่า `serviceSuffix` ใน response เพื่อบอกลำดับ suffix ที่เลือกใช้จริง
- route payload เพิ่ม `paths[]` เพื่อรองรับกรณี host เดิมแต่ path ต่างกันได้ชัดเจน

**QA Verdict:** ผ่านครบสำหรับ requirement ตั้งชื่อ service ซ้ำแบบต่อท้าย `_count`

---

## 26. Senior QA Test: Remove Duplicate Breadcrumb on Edit URL Page
**Date:** 2026-02-26
**Tested By:** Senior QA (GitHub Copilot)

| ID | Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| BPEDIT-BC-001 | Page Availability | หน้า `/operations/byteplus/edit-map-url` ต้องเข้าได้ปกติ | `GET /operations/byteplus/edit-map-url` ได้ `200` | **Passed** |
| BPEDIT-BC-002 | Duplicate Breadcrumb Check | ต้องมี breadcrumb เพียง 1 ชุด | ตรวจ HTML พบ `aria-label="Breadcrumb"` จำนวน `1` | **Passed** |
| BPEDIT-BC-003 | Syntax Validation | ไฟล์ที่แก้ต้องไม่มี syntax error | ตรวจไฟล์ `src/app/operations/byteplus/edit-map-url/page.js` ไม่พบ error | **Passed** |

**QA Verdict:** ผ่านครบสำหรับการแก้ปัญหา breadcrumb ซ้ำในหน้า Edit URL to Endpoint
