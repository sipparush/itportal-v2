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
