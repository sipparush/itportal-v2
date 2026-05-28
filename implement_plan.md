# Request ใหม่: AWS Prod Map URL รองรับค้นหา Service/Route ด้วยชื่อเพื่อ Edit/Delete (Approved)

สถานะ: implement เสร็จและทดสอบ local แล้ว (อัปเดตเงื่อนไขค้นหาแล้ว)

รายละเอียดคำขอ:
- ศึกษาโครงสร้างเดิมของ `http://localhost:3000/operations/aws/prod/mapurl`
- ปรับเพิ่มให้สามารถดึง `services` และ `routes` ด้วยชื่อโดยตรง
- นำข้อมูลที่ดึงได้มาใช้สำหรับ `edit` และ `delete`

### ข้อค้นพบเบื้องต้น
- หน้า `src/app/operations/aws/prod/mapurl/page.js` ปัจจุบันรองรับเฉพาะ create flow
- route `src/app/api/operations/aws/prod/mapurl/route.js` ปัจจุบันสร้าง service/route ใหม่ผ่าน Kong admin ด้วย `curl` command เท่านั้น
- pattern ที่ใกล้เคียงที่สุดคือ `src/app/operations/byteplus/edit-map-url/page.js` และ `src/app/api/operations/byteplus/edit-map-url/route.js` ซึ่งรองรับ `fetch`, `edit`, `delete`
- รอบแรกผู้ใช้ยืนยันให้ค้นหาด้วย `service name` และ `route name` โดยตรง ไม่ใช้ FQDN เป็นตัวค้นหาหลัก
- request ล่าสุดปรับเงื่อนไขค้นหาให้ใช้ `service name` หรือ `route name` อย่างใดอย่างหนึ่งได้ ไม่ต้องกรอกทั้งคู่

### แผนดำเนินการรอบนี้
- [x] อัปเดต API `src/app/api/operations/aws/prod/mapurl/route.js` ให้รองรับ `fetch`, `edit`, `delete` โดยคง `create` เดิมไว้
- [x] เพิ่ม helper สำหรับ normalize/validate `serviceName`, `routeName`, `endpoint`, `path` และ parse response จาก Kong admin
- [x] ปรับ UI `src/app/operations/aws/prod/mapurl/page.js` ให้มีส่วน Load by Name สำหรับ `service name` และ `route name`
- [x] เพิ่ม form/state สำหรับ edit endpoint/path หลังโหลดข้อมูลสำเร็จ
- [x] เพิ่มปุ่ม delete mapping และ feedback state แยกจาก create flow เดิม
- [x] ทดสอบ validation เฉพาะจุดสำหรับไฟล์ที่แก้
- [x] ทดสอบ local flow ในส่วน page render, create validation และ fetch validation
- [x] อัปเดต `full_test_result.md` หลังได้ผลทดสอบจริง
- [x] อัปเดต `implement_plan.md` ด้วยผลการดำเนินการรอบนี้
- [ ] ทดสอบ Docker flow ของงานนี้
- [ ] ทดสอบ fetch/edit/delete กับ resource จริงบน Kong prod ตามชื่อที่อนุมัติ

### หมายเหตุ
- รอบนี้เริ่ม implement แล้วตามการอนุมัติล่าสุดจากผู้ใช้
- จะทดสอบตามลำดับ local ก่อน แล้วค่อยพิจารณา Docker ตาม workflow ของ repo

### ผลการดำเนินการ (2026-05-28)
- ปรับ `src/app/api/operations/aws/prod/mapurl/route.js` ให้รองรับ action `fetch`, `edit`, `delete` โดย resolve จาก `serviceName` หรือ `routeName` อย่างใดอย่างหนึ่งได้
- คง create flow เดิมไว้ เมื่อ request ไม่มี `action`
- เพิ่ม validation สำหรับ `serviceName`, `routeName`, `destinationIp`, `destinationPort`, `scheme` และ `path`
- ปรับ `src/app/operations/aws/prod/mapurl/page.js` ให้มีส่วน `Search Existing Mapping` และ form สำหรับ `Edit Mapping` กับ `Delete Mapping` พร้อมรองรับการกรอก `serviceName` หรือ `routeName` อย่างใดอย่างหนึ่ง
- local page `GET http://localhost:3000/operations/aws/prod/mapurl` ตอบ `200` และ render ข้อความ `Search Existing Mapping`
- local API smoke test ผ่านตามคาด:
    - `POST /api/operations/aws/prod/mapurl` ด้วย `{"action":"fetch"}` ตอบ `400 Missing required fields: provide serviceName, routeName, or both`
    - `POST /api/operations/aws/prod/mapurl` ด้วย `{"action":"fetch","serviceName":"bad name"}` ตอบ `400 Invalid serviceName or routeName format`
    - `POST /api/operations/aws/prod/mapurl` ด้วย `{"action":"fetch","serviceName":"svc_not_exists_for_smoke_test_20260528"}` ตอบ `404 Fetch service failed: Not found`
    - `POST /api/operations/aws/prod/mapurl` ด้วย `{"action":"fetch","routeName":"route_not_exists_for_smoke_test_20260528"}` ตอบ `404 Fetch route failed: Not found`
    - `POST /api/operations/aws/prod/mapurl` ด้วย payload create ที่ไม่ครบ ตอบ `400 Missing required fields`
- `npx eslint src/app/api/operations/aws/prod/mapurl/route.js src/app/operations/aws/prod/mapurl/page.js` ผ่าน
- `npm run build` ผ่าน

### ข้อจำกัดของรอบนี้
- ยังไม่ได้ทดสอบ Docker เพราะ environment ปัจจุบันไม่มีคำสั่ง `docker` ใน WSL distro นี้
- ยังไม่ได้ยิง `fetch/edit/delete` กับ resource จริงบน Kong prod เพราะต้องใช้ชื่อ resource ที่มีอยู่จริงและการทดสอบ `edit/delete` จะมีผลกับ production mapping

---

# Request ใหม่: เตรียมคำสั่ง apply ตารางเข้า PostgreSQL volume เดิม (Approved)

สถานะ: apply และ verify บน PostgreSQL volume เดิมแล้ว

รายละเอียดคำขอ:
- เตรียมคำสั่งสำหรับ apply ตาราง `scan_security_patch_prod` เข้า PostgreSQL volume เดิม
- ใช้กับกรณีที่ volume ถูกสร้างไปแล้วและ `docker-entrypoint-initdb.d` จะไม่ถูกรันซ้ำ
- ต้องการคำสั่งที่นำไปใช้ได้กับ environment ปัจจุบันของโปรเจกต์นี้

### ข้อค้นพบเบื้องต้น
- ใน `docker-compose.yml` service `postgres` ใช้ named volume `itportalv2_postgres_data` และ mount `./backend/init` ไปที่ `/docker-entrypoint-initdb.d`
- ไฟล์ `backend/init/003_scan_security_patch_prod.sql` พร้อมแล้วสำหรับสร้างตาราง `scan_security_patch_prod` และ index แบบ `IF NOT EXISTS`
- สำหรับ volume เดิม แนวทางที่ตรงที่สุดคือ execute SQL file นี้เข้า container `postgres` โดยตรงผ่าน `psql`
- จุดที่ต้องยืนยันก่อนออกคำสั่งจริงคือชื่อ database/user ที่อ่านจาก `.env` และชื่อ compose service/container ที่ใช้งานจริง

### แผนดำเนินการรอบนี้
- [x] ตรวจค่าที่เกี่ยวข้องกับ PostgreSQL connection จากไฟล์ config ที่มีอยู่ เช่น `.env` หรือ `DATABASE_URL`
- [x] จัดชุดคำสั่งสำหรับ apply `backend/init/003_scan_security_patch_prod.sql` เข้า database บน volume เดิม
- [x] แยกคำสั่งเป็นกรณี `docker compose exec postgres psql ... -f ...` และกรณี fallback หากต้องใช้ `psql` จากภายนอก container
- [x] เพิ่มคำสั่งตรวจสอบผลหลัง apply เช่น `\dt` หรือ query จาก `information_schema.tables`
- [x] อัปเดต `implement_plan.md` หลังสรุปคำสั่งพร้อมใช้งาน

### หมายเหตุ
- ระหว่างรัน `docker compose` มี warning ว่า field `version` ใน `docker-compose.yml` obsolete แต่ไม่ block การ apply SQL

### คำสั่งที่แนะนำ

ใช้จาก root ของโปรเจกต์ `itportal-v2`

1. ตรวจว่า service `postgres` ทำงานอยู่
```bash
docker compose ps postgres
```

2. apply ตาราง `scan_security_patch_prod` เข้า volume เดิมผ่าน container `postgres`
```bash
docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/003_scan_security_patch_prod.sql'
```

3. ตรวจว่าตารางถูกสร้างแล้ว
```bash
docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT tablename FROM pg_tables WHERE schemaname = '\''public'\'' AND tablename = '\''scan_security_patch_prod'\'';"'
```

4. ตรวจ index ที่เกี่ยวข้อง
```bash
docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT indexname FROM pg_indexes WHERE schemaname = '\''public'\'' AND tablename = '\''scan_security_patch_prod'\'' ORDER BY indexname;"'
```

### Fallback กรณีใช้ `psql` จาก host

หากเครื่อง host มี `psql` และต้องการยิงเข้า database โดยตรงผ่าน `DATABASE_URL`
```bash
psql "$DATABASE_URL" -f backend/init/003_scan_security_patch_prod.sql
```

ตรวจผลหลัง apply
```bash
psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scan_security_patch_prod';"
```

### ผลการดำเนินการ (2026-05-28)
- ตรวจจาก `.env` พบว่าค่าเชื่อมต่อปัจจุบันสอดคล้องกับ `POSTGRES_USER`, `POSTGRES_DB` และ `DATABASE_URL` ที่ใช้กับโปรเจกต์นี้
- ยืนยันจาก `docker-compose.yml` ว่า service ที่ต้องใช้คือ `postgres` และไฟล์ SQL ถูก mount เข้า container ที่ path `/docker-entrypoint-initdb.d/003_scan_security_patch_prod.sql`
- สรุปคำสั่งหลักสำหรับ apply ผ่าน `docker compose exec -T postgres ... psql -f ...`
- สรุปคำสั่ง fallback สำหรับกรณีใช้ `psql` จาก host ผ่าน `DATABASE_URL`
- รัน `docker compose exec -T postgres ... psql -f /docker-entrypoint-initdb.d/003_scan_security_patch_prod.sql` กับ volume เดิมจริง และ PostgreSQL ตอบ `CREATE TABLE`, `CREATE INDEX`, `CREATE INDEX`, `CREATE INDEX`
- รัน query ตรวจสอบหลัง apply แล้วพบตาราง `scan_security_patch_prod` ใน schema `public`
- รัน query ตรวจ index หลัง apply แล้วพบ `scan_security_patch_prod_pkey`, `idx_scan_security_patch_prod_ip`, `idx_scan_security_patch_prod_check_date`, และ `idx_scan_security_patch_prod_latest_status`

---

# Request ใหม่: เพิ่มคำสั่งเตรียมฐานข้อมูลกรณีไม่มี table ไว้ใน backend/init (Approved)

สถานะ: ดำเนินการแล้ว และตรวจ validation เฉพาะจุดแล้ว

รายละเอียดคำขอ:
- เพิ่มคำสั่งสำหรับเตรียม database กรณีที่ยังไม่มี table
- วางไว้ในโฟลเดอร์ `backend/init`
- ต้องรองรับการ bootstrap database ตอน container เริ่มทำงาน

### ข้อค้นพบเบื้องต้น
- ปัจจุบันใน `backend/init` มี `002_scan_security_patch.sql` ที่สร้างเฉพาะตาราง `scan_security_patch`
- ใน `docker-compose.yml` service `postgres` mount โฟลเดอร์ `./backend/init` ไปที่ `/docker-entrypoint-initdb.d` ดังนั้นไฟล์ SQL ในโฟลเดอร์นี้จะถูกรันเฉพาะตอน PostgreSQL data directory ถูกสร้างใหม่
- ถ้าต้องรองรับกรณี database มีอยู่แล้วแต่ยังขาดบาง table คำสั่งใน init script ต้องเป็นแบบ `IF NOT EXISTS` เพื่อรันซ้ำได้อย่างปลอดภัย
- สมมติฐานการแก้: เพิ่ม SQL script ใน `backend/init` สำหรับ table ที่จำเป็นแต่ยังอาจไม่มี โดยใช้ `CREATE TABLE IF NOT EXISTS` และ `CREATE INDEX IF NOT EXISTS`

### แผนดำเนินการรอบนี้
- [x] ตรวจว่าฟีเจอร์ใดบ้างยังพึ่งพา table ที่ไม่ได้ถูกเตรียมไว้ใน `backend/init`
- [x] เพิ่ม SQL script ใน `backend/init` สำหรับสร้าง table ที่ต้องมีเมื่อยังไม่พบในฐานข้อมูล
- [x] ใช้คำสั่งแบบ idempotent เช่น `CREATE TABLE IF NOT EXISTS` และ `CREATE INDEX IF NOT EXISTS`
- [x] ตรวจความสอดคล้องกับ route ฝั่ง application ที่คาดหวังชื่อตารางเหล่านั้น
- [x] รัน validation แบบเฉพาะจุดโดย review diff และ syntax ของไฟล์ SQL ที่เพิ่ม
- [x] อัปเดต `implement_plan.md` และ `full_test_result.md` หลังดำเนินการ

### หมายเหตุ
- หากต้องให้ script นี้ทำงานกับ database volume เดิมที่ถูกสร้างไปแล้ว อาจต้องมีขั้นตอน apply migration เพิ่มเติม เพราะ `/docker-entrypoint-initdb.d` จะไม่ถูกรันซ้ำอัตโนมัติบน volume เดิม

### ผลการดำเนินการ (2026-05-28)
- เพิ่มไฟล์ `backend/init/003_scan_security_patch_prod.sql` เพื่อสร้างตาราง `scan_security_patch_prod` และ index ที่จำเป็นแบบ `IF NOT EXISTS`
- ปรับ `src/app/api/operations/aws/prod/check-security-patch/route.js` ให้ใช้ตาราง `scan_security_patch_prod` สำหรับ create/select/count/upsert และ export ชื่อไฟล์/worksheet ให้สอดคล้องกับตารางใหม่
- ปรับ `src/app/api/operations/aws/prod/check-security-patch/delete/route.js` ให้ลบข้อมูลจากตาราง `scan_security_patch_prod`
- ปรับ `src/app/operations/aws/prod/check-security-patch/page.js` ให้แสดงชื่อตารางและชื่อไฟล์ export เป็น `scan_security_patch_prod`
- ตรวจซ้ำด้วย search ใต้ path `src/app/api/operations/aws/prod/check-security-patch/**` แล้วไม่พบ query ที่ยังอ้างตารางรวม `scan_security_patch`
- ตรวจ editor diagnostics และรัน `npx eslint` เฉพาะไฟล์ที่แก้ผ่าน

---

# Request ใหม่: AWS Prod Check Security Patch ใช้ตารางแยกของตัวเอง (Approved)

สถานะ: แก้ไขและตรวจ validation เฉพาะจุดแล้ว

รายละเอียดคำขอ:
- ตรวจฟังก์ชัน `/operations/aws/prod/check-security-patch`
- ให้ฝั่ง `prod` สร้างและใช้งานตารางฐานข้อมูลของตัวเอง
- ห้ามใช้ตารางร่วมกับ `nonprod`

### ข้อค้นพบเบื้องต้น
- route หลัก `src/app/api/operations/aws/prod/check-security-patch/route.js` ยังสร้างและอ่านข้อมูลจากตาราง `scan_security_patch`
- route ย่อย `src/app/api/operations/aws/prod/check-security-patch/delete/route.js` ยังลบข้อมูลจากตาราง `scan_security_patch`
- ฝั่ง `nonprod` ก็ใช้ตารางชื่อเดียวกัน ทำให้ข้อมูล scan ของ `prod` และ `nonprod` ปนกันในฐานข้อมูล
- สมมติฐานการแก้: ถ้าแยกฝั่ง `prod` ไปใช้ตารางเฉพาะ เช่น `scan_security_patch_prod` ครบทุก query path ข้อมูลของ `prod` จะไม่ปนกับ `nonprod`

### แผนดำเนินการรอบนี้
- [x] ปรับ route หลัก `src/app/api/operations/aws/prod/check-security-patch/route.js` ให้สร้างและใช้งานตารางเฉพาะของ `prod`
- [x] ปรับ route ย่อย `src/app/api/operations/aws/prod/check-security-patch/delete/route.js` ให้ลบจากตารางเฉพาะของ `prod`
- [x] ตรวจ route ย่อย `update` และข้อความบนหน้า UI ที่เกี่ยวข้อง เพื่อให้สอดคล้องกับตารางใหม่ของ `prod`
- [x] ตรวจซ้ำแบบเฉพาะจุดว่า query ใต้ path `src/app/api/operations/aws/prod/check-security-patch/**` ไม่อ้างตารางรวมเดิม
- [x] รัน lint เฉพาะไฟล์ที่แก้
- [x] อัปเดต `full_test_result.md` หลังทดสอบเสร็จ
- [x] อัปเดต `implement_plan.md` ด้วยผลการดำเนินการรอบนี้

### หมายเหตุ
- หากต้องย้ายข้อมูล `prod` เดิมออกจากตารางรวม อาจต้องมี migration/backfill เพิ่มในรอบถัดไป

### ผลการดำเนินการ (2026-05-28)
- ปรับ `src/app/api/operations/aws/prod/check-security-patch/route.js` ให้ใช้ตาราง `scan_security_patch_prod` แทน `scan_security_patch`
- เพิ่ม index creation ใน route ฝั่ง `prod` แบบ `IF NOT EXISTS` เพื่อรองรับกรณี runtime เชื่อมต่อ database ที่ยังไม่มีตารางนี้
- ปรับ `src/app/api/operations/aws/prod/check-security-patch/delete/route.js` ให้ลบจาก `scan_security_patch_prod`
- ปรับ `src/app/operations/aws/prod/check-security-patch/page.js` ให้แสดงชื่อ table/export file ของ `prod` ให้ตรงกับ behavior ใหม่
- เพิ่ม init script `backend/init/003_scan_security_patch_prod.sql` สำหรับ bootstrap database ใหม่ผ่าน Docker/Postgres init flow
- validation ที่ผ่านในรอบนี้:
    - search ใต้ path `src/app/api/operations/aws/prod/check-security-patch/**` ไม่พบ query ที่ยังชี้ไปตารางรวมเดิม
    - editor diagnostics ของไฟล์ที่แก้ไม่พบ error
    - `npx eslint src/app/api/operations/aws/prod/check-security-patch/route.js src/app/api/operations/aws/prod/check-security-patch/delete/route.js src/app/operations/aws/prod/check-security-patch/page.js` ผ่าน

---

# Request ใหม่: AWS Prod Functional Test with userb on 10.241.15.15 (Waiting for Approval)

สถานะ: ทดสอบแล้ว

รายละเอียดคำขอ:
- ต้องการทดสอบ add user ผ่าน Docker สำหรับฝั่ง `prod`
- user ที่ต้องการทดสอบคือ `userb`
- target IP คือ `10.241.15.15`
- endpoint ที่ใช้คือ `POST http://localhost:3000/api/operations/aws/prod/adduser`

### แผนดำเนินการรอบนี้
- [x] ยิง request ผ่าน Docker endpoint ด้วย payload `{"serverIps":"10.241.15.15","users":[{"username":"userb","email":"<test-email>"}]}`
- [x] เก็บ response จาก API
- [x] เก็บ `docker compose logs app` หลังทดสอบ
- [x] แยกผลว่า success, auth failure, network issue, หรือ remote-side failure
- [x] อัปเดต `full_test_result.md`
- [x] อัปเดต `implement_plan.md`

### หมายเหตุ
- รอบก่อนยืนยันแล้วว่าฝั่ง `prod` ผ่าน Docker smoke test ด้วย explicit key `jventures-prod.pem`
- รอบนี้เป็น functional test กับ target `prod` จริงที่ผู้ใช้ระบุ

### ผลการทดสอบรอบนี้ (2026-05-05)
- ยิง `POST http://localhost:3000/api/operations/aws/prod/adduser` ด้วย payload `{"serverIps":"10.241.15.15","users":[{"username":"userb","email":"userb@example.com"}]}`
- API ตอบกลับ `success: true`
- execution log แสดงว่า user `userb` ถูกสร้าง/ensure สำเร็จบน target `10.241.15.15`
- key ถูกสร้างและเก็บเป็น `userb_aws-bastion-prod.pem`
- container log ยืนยันว่า script `/app/scripts/aws/prod/adduser/adduservendor.sh` ทำงานต่อเนื่องผ่าน jump host โดยไม่พบ auth failure ในรอบนี้

---

# Request ใหม่: ปรับ AWS Prod Add User ให้ใช้ Explicit Key `jventures-prod.pem` (Waiting for Approval)

สถานะ: แก้ไขและทดสอบผ่านแล้ว

รายละเอียดคำขอ:
- ต้องการปรับฝั่ง `prod` แบบเดียวกับ option 1 ที่เพิ่งใช้แก้ `nonprod`
- key ที่ต้องใช้คือ `jventures-prod.pem`

### ข้อค้นพบเบื้องต้น
- route `src/app/api/operations/aws/prod/adduser/route.js` ยังใช้ pattern เดิม คือ resolve script จาก `./src/...` โดยตรง และยังไม่มี runtime fallback path แบบ Docker-safe
- script `src/app/api/operations/aws/prod/adduser/script/adduservendor.sh` ยัง hardcode `ssh -i ~/jventures-prod.pem jventures@18.139.55.93 "ssh ... jventures@$ip ..."`
- script ฝั่ง `prod` ยังไม่ได้ใช้แนวทางเดียวกับ `nonprod` ที่รองรับ explicit identity file ผ่านตัวแปรและ `IdentitiesOnly=yes`
- จึงมีความเสี่ยงทั้งเรื่อง runtime path ใน Docker และการเลือก SSH identity ไม่คงที่ใน container

### แผนดำเนินการรอบนี้
- [x] ปรับ route `prod` ให้มี runtime script fallback path แบบเดียวกับ `nonprod`
- [x] ปรับ Docker runtime ให้ copy script `prod` เข้า image ในตำแหน่งคงที่
- [x] ปรับ script `prod` ให้ใช้ explicit identity file ผ่านตัวแปร เช่น `AWS_PROD_ADDUSER_SSH_KEY_PATH` โดย default เป็น `/home/node/.ssh/jventures-prod.pem`
- [x] เพิ่ม `IdentitiesOnly=yes`, `UserKnownHostsFile=/dev/null` และ options ที่จำเป็นใน SSH command ของ `prod`
- [x] ตรวจว่า flow ผ่าน jump host `18.139.55.93` ยังทำงานตามเดิมหลังปรับ
- [x] ทดสอบ local/static validation สำหรับไฟล์ที่แก้
- [x] ทดสอบ Docker กับ payload ที่ผู้ใช้อนุมัติสำหรับ `prod`
- [x] อัปเดต `full_test_result.md`
- [x] อัปเดต `implement_plan.md`

### หมายเหตุ
- รอบนี้ยังไม่ได้แก้โค้ด มีเพียงการยืนยันโครงสร้างปัจจุบันของ `prod`
- จุดสำคัญคือฝั่ง `prod` มี jump host ใน command จึงต้องระวังให้ explicit key ถูกใช้ใน hop แรกโดยไม่ทำ flow เดิมพัง

### ผลการดำเนินการ (2026-05-05)
- ปรับ `src/app/api/operations/aws/prod/adduser/route.js` ให้มี runtime script fallback path และตรวจ execute permission แบบเดียวกับ `nonprod`
- ปรับ `Dockerfile` ให้ copy script `prod` ไปที่ `/app/scripts/aws/prod/adduser/adduservendor.sh`
- ปรับ script `src/app/api/operations/aws/prod/adduser/script/adduservendor.sh` ให้ใช้ explicit key จาก `AWS_PROD_ADDUSER_SSH_KEY_PATH` โดย default เป็น `/home/node/.ssh/jventures-prod.pem`
- เพิ่ม `IdentitiesOnly=yes`, `UserKnownHostsFile=/dev/null`, `ConnectTimeout=10` และคง flow ผ่าน jump host `18.139.55.93`
- ซ่อม defect ใน heredoc ของ script เดิม โดยย้าย `date -d "+90 days"` ให้ไปรันบน remote host และเพิ่ม `set -euo pipefail` เพื่อไม่ให้ remote error หลุดเงียบ
- rebuild Docker image และ smoke test ผ่าน `POST http://localhost:3000/api/operations/aws/prod/adduser`
- payload ที่ใช้เพื่อ smoke test คือ `{"serverIps":"127.0.0.1","users":[{"username":"prodsmoke2","email":"prodsmoke2@example.com"}]}`
- API ตอบกลับ `success: true` และ execution log แสดงการสร้าง user/key สำเร็จผ่าน jump host

### ข้อจำกัดของรอบนี้
- รอบนี้ยังเป็น smoke test ของ flow `prod` ผ่าน jump host โดยใช้ `127.0.0.1` เป็น target ตาม payload ที่ปลอดภัยสำหรับ validation
- ยังไม่ได้รัน functional test กับ target `prod` จริง เพราะผู้ใช้ยังไม่ได้ระบุ IP/payload สำหรับรอบนั้น

---

# Request ใหม่: Container SSH Works with Explicit Identity File (Waiting for Approval)

สถานะ: แก้ไขและทดสอบผ่านแล้ว

รายละเอียดคำขอ:
- ผู้ใช้ยืนยันว่าใน container สามารถเชื่อมต่อได้ด้วยคำสั่ง
- `ssh -i /home/node/.ssh/jventures-uat.pem jventures@10.240.1.220`

### ข้อค้นพบเบื้องต้น
- blocker ปัจจุบันของ Docker test ไม่ได้แปลว่า network ไปไม่ถึง target
- หลักฐานใหม่นี้ยืนยันว่า container สามารถ SSH ไป `10.240.1.220` ได้ หากระบุ identity file แบบ explicit
- จึงมีแนวโน้มสูงว่า script `adduservendor.sh` ยังไม่ได้ใช้ `-i /home/node/.ssh/jventures-uat.pem` หรือยังไม่ได้บังคับ `IdentitiesOnly` ทำให้ auth หลุดไปใช้ key/agent อื่น
- ทิศทางแก้ที่ควรทดสอบรอบถัดไปคือปรับ script หรือ route ให้ใช้ explicit key แบบเดียวกับคำสั่งที่ผู้ใช้ยืนยันว่าใช้ได้จริง

### แผนดำเนินการรอบนี้
- [x] ตรวจว่า script `adduservendor.sh` ใช้คำสั่ง `ssh` แบบใดใน runtime จริง
- [x] ปรับให้รองรับ explicit identity file `/home/node/.ssh/jventures-uat.pem`
- [x] เพิ่ม `IdentitiesOnly=yes` และ options ที่จำเป็นเพื่อไม่ให้ SSH เลือก key อื่น
- [x] ทดสอบใน Docker ด้วย payload `usera` กับ `10.240.1.220` อีกครั้ง
- [x] เก็บ response และ container log หลังปรับ
- [x] อัปเดต `full_test_result.md`
- [x] อัปเดต `implement_plan.md`

### หมายเหตุ
- ข้อมูลนี้ลดความเสี่ยงว่าปัญหาอยู่ที่ network หรือ host access policy
- ประเด็นหลักรอบถัดไปคือทำให้ application path ใช้ credential แบบเดียวกับคำสั่ง SSH ที่พิสูจน์แล้วว่าใช้งานได้

### ผลการดำเนินการ (2026-05-05)
- ปรับ script `src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh` ให้ใช้ `SSH_IDENTITY_FILE="${AWS_NONPROD_ADDUSER_SSH_KEY_PATH:-/home/node/.ssh/jventures-uat.pem}"`
- เพิ่ม `IdentitiesOnly=yes`, `UserKnownHostsFile=/dev/null` และคง `ConnectTimeout=10`
- rebuild Docker image และ retest ผ่าน `POST http://localhost:3000/api/operations/aws/nonprod/adduser`
- payload ที่ใช้: `{"serverIps":"10.240.1.220","users":[{"username":"usera","email":"usera@example.com"}]}`
- API ตอบกลับ `success: true`
- execution log ยืนยันว่า user ถูกสร้าง/ensure สำเร็จและคัดลอก private key ไป `/home/jventures/usera_itportal-as-dv-u01.pem` บน `10.240.1.220`
- root cause เดิมคือ application path ไม่ได้ระบุ SSH identity file แบบ explicit เหมือนคำสั่งที่ผู้ใช้ยืนยันว่าใช้งานได้

---

# Request ใหม่: Docker Functional Test with usera on 10.240.1.220 (Waiting for Approval)

สถานะ: ทดสอบแล้ว

รายละเอียดคำขอ:
- ต้องการทดสอบ add user ผ่าน Docker โดยใช้ user `usera`
- target IP ที่ต้องการทดสอบคือ `10.240.1.220`
- endpoint ที่ใช้คือ `POST http://localhost:3000/api/operations/aws/nonprod/adduser`

### แผนดำเนินการรอบนี้
- [x] ยิง request ผ่าน Docker endpoint ด้วย payload `{"serverIps":"10.240.1.220","users":[{"username":"usera","email":"<test-email>"}]}`
- [x] เก็บ response จาก API
- [x] เก็บ `docker compose logs app` หลังทดสอบ
- [x] แยกผลว่า success, permission denied, network issue, หรือ remote-side failure
- [x] อัปเดต `full_test_result.md`
- [x] อัปเดต `implement_plan.md`

### หมายเหตุ
- จาก log ก่อนหน้า target `10.240.1.220` เคยจบที่ `Permission denied (publickey,password)`
- รอบนี้จะใช้เพื่อยืนยันผลซ้ำกับ payload ที่ผู้ใช้ระบุโดยตรง

### ผลการทดสอบรอบนี้ (2026-05-05)
- ยิง `POST http://localhost:3000/api/operations/aws/nonprod/adduser` ด้วย payload `{"serverIps":"10.240.1.220","users":[{"username":"usera","email":"usera@example.com"}]}`
- API ตอบกลับ `500 Script execution failed`
- ใน `executionLog` และ `docker compose logs app` พบว่า script `/app/scripts/aws/nonprod/adduser/adduservendor.sh` ถูกเรียกใช้งานจริง
- ปลายทางตอบ `jventures@10.240.1.220: Permission denied (publickey,password)`
- สรุปว่า request ไปถึง target host แล้ว แต่ SSH credential/authorized key ที่ใช้ใน Docker ยังไม่ผ่านสำหรับ host นี้

---

# Request ใหม่: Retest After Latest Docker Deploy (Waiting for Approval)

สถานะ: ทดสอบหลัง deploy แล้ว

รายละเอียดคำขอ:
- ผู้ใช้แจ้งว่า deploy Docker ล่าสุดแล้ว
- ต้องการให้ทดสอบระบบหลัง deploy รอบใหม่

### ขอบเขตการทดสอบรอบนี้
- ยืนยันว่า container หลัง deploy ล่าสุดยังขึ้นปกติ
- ทดสอบ `POST /api/operations/aws/nonprod/adduser` ผ่าน Docker endpoint อีกครั้ง
- เก็บ response และ container log เพื่อยืนยัน behavior หลัง deploy
- เปรียบเทียบว่าผลยังคงอยู่ในชั้น SSH/network หรือมี regression ใหม่เกิดขึ้น

### แผนดำเนินการรอบนี้
- [x] ตรวจสถานะ container หลัง deploy ล่าสุด
- [x] ยิง API add user ผ่าน Docker endpoint ด้วย payload ทดสอบที่อนุมัติ
- [x] เก็บ `docker compose logs app` หลังทดสอบ
- [x] สรุปผลว่า pass, blocker เดิม, หรือ regression ใหม่
- [x] อัปเดต `full_test_result.md`
- [x] อัปเดต `implement_plan.md`

### หมายเหตุ
- รอบก่อนยืนยันแล้วว่า bug เรื่อง runtime หา script ไม่เจอถูกแก้แล้ว
- รอบนี้ใช้เพื่อ retest หลัง deploy ใหม่ ไม่ใช่แก้โค้ดเพิ่มในทันที

### ผลการทดสอบรอบนี้ (2026-05-05)
- `docker compose ps` แสดงว่า `app` container หลัง deploy ล่าสุดอยู่สถานะ `Up`
- ยิง `POST http://localhost:3000/api/operations/aws/nonprod/adduser` ด้วย payload `{"serverIps":"127.0.0.1","users":[{"username":"dockerretest","email":"dockerretest@example.com"}]}`
- API ตอบกลับ `500` แต่ execution path ไปถึง script `/app/scripts/aws/nonprod/adduser/adduservendor.sh` ตามที่คาด
- log หลัง deploy ไม่พบ regression เรื่อง `No such file or directory` หรือ `chmod` อีก
- blocker ปัจจุบันยังอยู่ที่ SSH layer เช่น `ssh: connect to host 127.0.0.1 port 22: Connection refused`
- log เดียวกันยังยืนยันอีกเคสว่า target `10.240.1.220` fail ด้วย `Permission denied (publickey,password)` จึงชี้ว่าการทดสอบกับเครื่องจริงยังติด credential/authorized key

---

# Request ใหม่: AWS Non-Prod Add User Functional Test in Docker (Waiting for Approval)

สถานะ: ทดสอบ Docker แล้ว

รายละเอียดคำขอ:
- ต้องการทดสอบ add user flow ใน Docker ต่อจากรอบ smoke test
- เป้าหมายของรอบนี้คือยืนยัน functional behavior ใน container กับ target ที่เหมาะสม แทน payload จำลอง `127.0.0.1`

### ขอบเขตการทดสอบรอบนี้
- ใช้ environment Docker ปัจจุบันที่แก้ runtime script path แล้ว
- ยิง `POST /api/operations/aws/nonprod/adduser` จากภายนอก container
- ตรวจว่าผลไม่ย้อนกลับไป error เดิมเรื่อง script path
- ถ้าใช้ target IP จริง ให้บันทึกผลแยกระหว่าง success, auth failure, network failure, หรือ remote-side failure

### แผนดำเนินการรอบนี้
- [x] ระบุ payload สำหรับ Docker functional test ให้ชัดเจน

---

- [x] ตรวจความพร้อมของ target IP/credential ที่จะใช้ใน Docker test
- [x] รัน `POST /api/operations/aws/nonprod/adduser` ใน Docker ด้วย payload ที่อนุมัติ
- [x] เก็บ response และ log ที่เกี่ยวข้องเพื่อแยกสาเหตุให้ชัดเจน
- [x] ถ้าผ่าน ให้บันทึกผลใน `full_test_result.md`
- [x] ถ้าไม่ผ่าน ให้สรุป blocker และอัปเดต `implement_plan.md`
- [ ] รออนุมัติรอบถัดไปก่อนเปลี่ยน environment สูงกว่า Docker

### ข้อสังเกต
- smoke test รอบก่อนยืนยันแล้วว่า container หา script เจอและ route รัน script ได้จริง
- สิ่งที่ยังไม่ยืนยันคือ success path กับปลายทางจริงใน Docker environment
- หากยังไม่ระบุ target IP สำหรับ functional test รอบนี้ ผลจะเป็นได้เพียง smoke test เพิ่ม ไม่ใช่ full functional verification

### ผลการทดสอบรอบนี้ (2026-05-05)
- ใช้ payload Docker test แบบปลอดภัย: `{"serverIps":"127.0.0.1","users":[{"username":"dockercheck","email":"dockercheck@example.com"}]}`
- `POST http://localhost:3000/api/operations/aws/nonprod/adduser` ตอบกลับ `500`
- response และ container log ยืนยันว่า route เรียก script ที่ `/app/scripts/aws/nonprod/adduser/adduservendor.sh` ได้จริง
- ไม่พบ error เดิม `No such file or directory` หรือปัญหา `chmod` บน path ที่ไม่มีไฟล์อีกแล้ว
- failure ปัจจุบันเป็นที่ชั้น SSH: `ssh: connect to host 127.0.0.1 port 22: Connection refused`
- จาก log ล่าสุดใน container ยังมีอีกเคสที่เคยยิงไปยัง `10.240.1.220` และจบที่ `Permission denied (publickey,password)` ซึ่งชี้ว่าหากจะทดสอบกับเครื่องจริงใน Docker ต่อ ต้องตรวจ credential/authorized key เพิ่ม

# Request ใหม่: AWS Non-Prod Add User ล้มเหลวใน Docker Runtime (Waiting for Approval)

สถานะ: แก้ไขและทดสอบ local/docker แล้ว

รายละเอียดคำขอ:
- ระหว่างเพิ่ม user พบ error ใน container log ว่า `chmod +x "/app/src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh"` ล้มเหลว
- error ที่ได้คือ `No such file or directory`
- ปัจจุบัน service รันด้วย `next start` ภายใน Docker runtime image

### ข้อค้นพบเบื้องต้น
- route `src/app/api/operations/aws/nonprod/adduser/route.js` resolve path ไปที่ `/app/src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh`
- ไฟล์สคริปต์มีอยู่จริงใน workspace ที่ `src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh`
- แต่ `Dockerfile` ของ stage `runner` copy แค่ `.next`, `node_modules`, `public`, `package.json`, `next.config.mjs`, และ `backupec2_state.json`
- ดังนั้น runtime container ไม่มีโฟลเดอร์ `src` ทำให้ path `/app/src/.../adduservendor.sh` หาไฟล์ไม่เจอตาม log
- `.dockerignore` ไม่ได้เป็นตัวการหลักในเคสนี้ เพราะ stage `builder` ยัง `COPY . .` ได้ แต่ stage `runner` ไม่ได้ copy ไฟล์ script เข้า image

### แผนดำเนินการรอบนี้
- [x] ยืนยันแนวทางแก้หลักให้เลือกหนึ่งทาง
- [x] ปรับ runtime ให้มี script ที่ route ต้องใช้
- [x] ปรับ route ให้ resolve path แบบไม่ผูกกับ source tree ที่หายไปใน production image
- [x] ตรวจว่าการแก้ไม่กระทบ environment อื่นที่ยังใช้ local source tree
- [x] ทดสอบ local test ตามขั้นตอน เช่น `npm run dev` หรือ equivalent request เฉพาะจุด
- [x] ทดสอบ docker test ด้วยการ build/run container ใหม่และยิง add user flow ซ้ำ
- [x] ถ้าผ่าน ให้อัปเดต `full_test_result.md`
- [ ] รออนุมัติถัดไปก่อนดำเนินการทดสอบ/เปลี่ยน environment ระดับสูงกว่า

### ทางเลือกแก้ที่เสนอ
- ทางเลือก A: copy โฟลเดอร์ script ที่จำเป็นเข้า Docker runtime image แล้วคง route เดิม
- ทางเลือก B: ย้าย script ไปตำแหน่ง runtime คงที่ เช่น `/app/scripts/...` แล้วปรับ route ให้ resolve จากตำแหน่งนั้น

### ข้อเสนอแนะ
- แนะนำทางเลือก B เพราะทำให้ contract ระหว่าง runtime image กับ route ชัดเจนกว่า และไม่พึ่ง source tree เต็มก้อนใน production

### ผลการดำเนินการ (2026-05-05)
- ปรับ `Dockerfile` ให้ copy script ไปที่ runtime path `/app/scripts/aws/nonprod/adduser/adduservendor.sh`
- ปรับ route ให้หา script ตามลำดับจาก env, runtime path, และ source path สำหรับ local dev
- ปรับ route ให้ตรวจ execute permission ก่อน และจะ `chmod` เฉพาะเมื่อจำเป็นเท่านั้น
- ทดสอบ local dev ที่ `http://localhost:3001` ด้วย payload จำลองแล้ว route เรียก script จาก source path ได้จริง
- ทดสอบ docker runtime ที่ `http://localhost:3000` ด้วย payload จำลองแล้ว route เรียก script จาก runtime path ได้จริง
- error เดิม `No such file or directory` และ `chmod` บน path ที่ไม่มีไฟล์ ไม่เกิดซ้ำแล้ว
- functional add user กับปลายทางจริงยังไม่ได้ยืนยันในรอบนี้ เพราะ payload ทดสอบใช้ `127.0.0.1` และจบที่ `ssh: connect to host 127.0.0.1 port 22: Connection refused`

---

# Request ใหม่: BytePlus Manage User SSH Timeout / Explicit Key Simulation (Approved)

สถานะ: อนุมัติแล้ว

รายละเอียดคำขอ:
- ทดสอบ `POST /api/operations/byteplus/manageUser` แล้วได้ `500`
- ฝั่ง client แสดง log ว่าเชื่อมต่อ `10.244.100.21:22` timeout ระหว่างรัน `/home/sipparush/adduservendorbp.sh`
- ต้องการให้ simulate issue ด้วย `user01` และ `remoteIP: 10.224.100.21`
- มีหลักฐานว่าเชื่อมต่อ remote server ได้ด้วยคำสั่ง `ssh -i /home/sipparush/sipparush.la-jvc_bp_10.224.100.21.pem sipparush.la-jvc@<remote-ip>`

### แผนดำเนินการรอบนี้
- [x] ตรวจสอบว่า API/สคริปต์ใช้ remote IP เดียวกับที่ทดสอบจริง (`10.224.100.21`) และไม่หลุดไป IP อื่น
- [x] ปรับสคริปต์หรือ API ให้รองรับ explicit SSH identity file (`-i /home/sipparush/sipparush.la-jvc_bp_10.224.100.21.pem`) ตามวิธีที่ยืนยันว่าใช้ได้จริง
- [x] เพิ่ม timeout / error message ให้แยกสาเหตุระหว่าง network timeout กับ authentication failure ชัดเจน
- [x] ทดสอบ local simulation ด้วย payload `{"action":"create","account":"user01","remoteIps":["10.224.100.21"]}`
- [x] ถ้า success ให้ยืนยันว่ามีไฟล์ key ถูกดาวน์โหลดผ่าน route BytePlus ได้
- [x] บันทึกผลลง `full_test_result.md`
- [x] อัปเดตสถานะใน `implement_plan.md`

### ข้อค้นพบเบื้องต้น
- สคริปต์ `/home/sipparush/adduservendorbp.sh` ใช้ `ssh sipparush.la-jvc@"$ip"` และ `scp` โดยไม่ระบุ `-i`
- วิธีเชื่อมต่อที่ผู้ใช้ยืนยันว่าใช้งานได้ ต้องระบุ key file แบบ explicit ด้วย `ssh -i /home/sipparush/sipparush.la-jvc_bp_10.224.100.21.pem`
- จึงมีแนวโน้มสูงว่า failure ปัจจุบันเกิดจากสคริปต์ใช้ auth path ไม่ตรงกับ environment จริง มากกว่าจะเป็นปัญหาที่ frontend route
- ยืนยันแล้วว่าไฟล์ `/home/sipparush/sipparush.la-jvc_bp_10.224.100.21.pem` มีอยู่จริงในเครื่องที่รัน API

### ผลทดสอบรอบนี้ (2026-04-27)
- `POST /api/operations/byteplus/manageUser` ด้วย payload `{"action":"create","account":"user01","remoteIps":["10.224.100.21"]}` ได้ `200 OK`
- response มี `downloadUrl` เป็น `/api/operations/byteplus/manageUser?file=user01_10.224.100.21.pem`
- `GET /api/operations/byteplus/manageUser?file=user01_10.224.100.21.pem` ได้ `200 OK`
- เนื้อหาไฟล์ที่ดาวน์โหลดขึ้นต้นด้วย `-----BEGIN OPENSSH PRIVATE KEY-----`

---

# Request ใหม่: BytePlus Manage User เรียก AWS API ผิดเส้นทาง (Approved)

สถานะ: อนุมัติแล้ว

รายละเอียดคำขอ:
- หน้า `src/app/operations/byteplus/manageUser/page.js` ทำงานในส่วน BytePlus แต่ยังเรียก `POST /api/operations/aws/nonprod/manageUser`
- ต้องตรวจสอบและแยกการทำงานให้ชัดว่า BytePlus ควรใช้ API ของตัวเอง หรือควรเปลี่ยนชื่อ/หน้าให้ตรงกับระบบที่เรียกจริง

### แผนดำเนินการรอบนี้
- [x] ตรวจสอบ flow ของหน้า BytePlus Manage User ว่าต้องผูกกับ backend BytePlus จริงหรือไม่
- [x] ตรวจสอบว่ามี API route ของ BytePlus Manage User อยู่แล้วหรือยัง
- [x] ถ้ายังไม่มี API BytePlus ให้สร้าง route ที่ถูกต้องและย้าย frontend ไปเรียก route ใหม่
- [x] ปรับ `STORAGE_KEY`, heading, feedback message และข้อความบน UI ให้สอดคล้องกับ backend ที่ใช้งานจริง
- [x] ทดสอบ submit flow ฝั่ง local และบันทึกผลใน `full_test_result.md`
- [x] อัปเดตสถานะใน `implement_plan.md` หลังทดสอบ

### ข้อค้นพบเบื้องต้น
- พบการเรียก `fetch('/api/operations/aws/nonprod/manageUser')` ในหน้า BytePlus โดยตรง
- พบ `STORAGE_KEY = 'aws-nonprod-manage-user-records-v1'` ในหน้าเดียวกัน ซึ่งยืนยันว่าหน้านี้ถูกคัดลอกมาจาก AWS แล้วปรับไม่ครบ
- ใน `src/app/api/operations/byteplus` ยังไม่มี `manageUser` route เดิม จึงต้องเพิ่ม backend ใหม่ให้ตรงกับหน้า BytePlus
- สคริปต์จริงของ BytePlus คือ `/home/sipparush/adduservendorbp.sh` และรองรับอาร์กิวเมนต์ `<system_file_or_ip> <user_file_or_name>`

### ผลทดสอบรอบนี้ (2026-04-27)
- `POST /api/operations/byteplus/manageUser` ด้วย `account="bad space"` ได้ `400 Bad Request`
- response message เป็น `account ต้องเป็นตัวอักษร ตัวเลข _ หรือ - และห้ามมีช่องว่าง`
- ตรวจไฟล์ที่แก้ (`route.js`, `page.js`, `implement_plan.md`) ไม่พบ syntax error

---

# แผนการเพิ่ม Pagination ใน Database History (Check Security Patch)

## รายละเอียด
เพิ่มฟีเจอร์ pagination ในส่วน Database History ของหน้า Check Security Patch (Non-Prod) เพื่อให้สามารถดูข้อมูลย้อนหลังได้สะดวกขึ้น

## Checklist
- [ ] 1. เพิ่ม state page, pageSize, totalRecords ในไฟล์ page.js
- [ ] 2. ปรับฟังก์ชัน loadHistory ให้รับ page, pageSize และดึงข้อมูลตาม pagination
- [ ] 3. ปรับ UI ให้มีปุ่มเปลี่ยนหน้า (Next/Prev) และแสดงหน้าปัจจุบัน
- [ ] 4. ปรับ fetch API ฝั่ง backend (ถ้ายังไม่รองรับ) ให้รับ page, pageSize และคืน totalRecords มาด้วย
- [ ] 5. ทดสอบการเปลี่ยนหน้าและ edge case (เช่น ไม่มีข้อมูล, อยู่หน้าสุดท้าย)
- [ ] 6. รอ Senior QA ทำ full test และบันทึกใน full_test_result.md
- [ ] 7. Develop อ่านผลทดสอบและอัพเดต implement_plan.md ตามผลการทดสอบ
- [ ] 8. แก้ไขตามผลทดสอบ (ถ้ามี)
- [ ] 9. ทดสอบซ้ำจนผ่านทุกเคส
- [ ] 10. ขออนุมัติเปลี่ยน environment ตามขั้นตอน

---

**สถานะ:** รออนุมัติ (ได้รับการอนุมัติแล้ว)

---

> หมายเหตุ: หาก backend ยังไม่รองรับ pagination จะเพิ่ม task สำหรับ backend เพิ่มเติม
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

## Request ใหม่: เพิ่มปุ่ม `addURLToCF` เพื่อสร้าง/อัปเดต Cloudflare DNS (Approved)

สถานะ: ⚠️ Implemented (Local Passed / Docker Blocked by Environment)
วันที่: 8 เมษายน 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- เพิ่มปุ่ม `addURLToCF` ใต้ข้อความ `For Advanced configuration` ในหน้า `Map URL to Endpoint (Non-Prod)`
- เมื่อกดปุ่ม ให้เรียก Cloudflare API เพื่อสร้าง/อัปเดต DNS จาก `fqdn`
- ให้ระบบหา zone จาก hostname ของ URL อัตโนมัติ
- ใช้ปลายทาง DNS เป็น `A record -> 52.220.167.209` และ `proxied=true`
- ตั้งค่า `CF_API_TOKEN` ใน local env สำหรับใช้งานฝั่ง server

### แผนดำเนินการรอบนี้
- [x] อัปเดตแผนงานและ checklist ใน `implement_plan.md`
- [x] ปรับ API `src/app/api/operations/aws/nonprod/managecf/route.js`
    - [x] ยกเลิกการใช้ shell `curl/exec` แบบเดิม
    - [x] เรียก Cloudflare REST API โดยตรงผ่าน `fetch`
    - [x] parse `fqdn` ให้เหลือ hostname และหา zone ที่ match อัตโนมัติ
    - [x] ถ้ามี record เดิมให้ update, ถ้าไม่มีก็ create
- [x] ปรับหน้า `src/app/operations/aws/nonprod/mapurl/page.js`
    - [x] เพิ่มปุ่ม `addURLToCF`
    - [x] เพิ่ม loading state และแสดงผลลัพธ์ของการเพิ่ม DNS
    - [x] คงปุ่ม `Submit` เดิมสำหรับ Kong mapping ไว้เหมือนเดิม
- [x] ตั้งค่า env สำหรับ `CF_API_TOKEN` แบบ local-only (`.env` ที่ถูก ignore จาก git)
- [ ] ตรวจ syntax/error และทดสอบตามลำดับ environment
    - [x] local test
    - [ ] docker test (blocked: ไม่พบ `docker-compose` ใน WSL ปัจจุบัน)
    - [ ] uat test / QA retest

### ผลตรวจสอบรอบนี้ (2026-04-08)
- `GET http://localhost:3000/operations/aws/nonprod/mapurl` ได้ `200`
- ตรวจ HTML พบปุ่ม `addURLToCF` แสดงบนหน้าเรียบร้อย
- `POST /api/operations/aws/nonprod/managecf` ด้วย `{"fqdn":"bad fqdn"}` ได้ validation error ตามคาด
- `POST /api/operations/aws/nonprod/managecf` ด้วย `{"fqdn":"example.invalid"}` ได้ `No Cloudflare zone found...` ซึ่งยืนยันว่า route เรียก Cloudflare API จริงโดยไม่ไปแก้ DNS จริง
- `npx eslint src/app/api/operations/aws/nonprod/managecf/route.js src/app/operations/aws/nonprod/mapurl/page.js && echo ESLINT_OK` ได้ผล `ESLINT_OK`
- Docker smoke test ยังทำต่อไม่ได้ในเครื่องนี้ เพราะคำสั่ง `docker-compose` ไม่พร้อมใช้งาน

### หมายเหตุ
- งานรอบนี้จะ **ไม่ใช้ `destinationPort` กับ Cloudflare DNS** เพราะ DNS รองรับการ map ได้เฉพาะ hostname ไปยัง IP เท่านั้น
- เก็บ secret ไว้ในไฟล์ env ที่ถูก ignore จาก git เพื่อความปลอดภัย
- หากต้องการยืนยันเคส create/update จริง จำเป็นต้องระบุ `fqdn` ที่อนุญาตให้แก้ไขบน Cloudflare อย่างชัดเจน

---

## Request ใหม่: ตรวจ Add User Access - `authorized_keys` ไม่ถูกสร้างบน `10.240.1.173`

สถานะ: 🔎 Investigated / รออนุมัติแก้ไขเพิ่มเติม
วันที่: 9 เมษายน 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- ทดสอบเพิ่ม `user1` ไปยังเครื่อง `10.240.1.173` ผ่าน UI/API ที่รันบน local
- debug หาสาเหตุว่าทำไมผู้ใช้ตรวจแล้วไม่พบไฟล์ `authorized_keys`

### แผนดำเนินการรอบนี้
- [x] อัปเดตแผนงานและ checklist ใน `implement_plan.md`
- [x] รันทดสอบ `POST /api/operations/aws/nonprod/adduser` ด้วย payload จริงของเคส `user1` + `10.240.1.173`
- [x] ตรวจ `executionLog` จาก API เพื่อยืนยัน flow การสร้าง key และ `authorized_keys`
- [x] SSH เข้าเครื่องปลายทางเพื่อตรวจ `/home/user1/.ssh/authorized_keys` โดยตรง
- [x] สรุปผล debug และหาจุดเสี่ยงที่อาจทำให้เกิด false positive
- [ ] รออนุมัติปรับ hardening ใน `src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh`
- [ ] retest ตามลำดับ `local -> docker -> UAT` หลังแก้ไข

### ผลตรวจสอบรอบนี้ (2026-04-09)
- ทดสอบด้วย `curl` ไปที่ local API ได้ `HTTP 200`
- `executionLog` แสดงว่า script รันถึงขั้นสร้าง ed25519 key และ `Successfully processed user1 on 10.240.1.173`
- ตรวจที่เครื่องปลายทางพบไฟล์ `/home/user1/.ssh/authorized_keys` จริง permission `0600`
- รอบนี้ **ยังไม่สามารถ reproduce อาการไฟล์หายได้**
- จุดที่ควร harden เพิ่ม: ให้ script fail fast (`set -euo pipefail`), สร้าง `~/.ssh` แบบ explicit, และให้ API report failure เมื่อ inner step fail จริง

---

## Request ใหม่: ตรวจและแก้ปัญหา copy private key ไป `10.240.1.220` ไม่ได้

สถานะ: ✅ Implemented (Local Retest Passed / Docker-UAT Pending)
วันที่: 9 เมษายน 2026
ผู้ร้องขอ: User

รายละเอียดคำขอ:
- ตรวจสอบต่อจาก flow `Add User Access (Non-Prod)` ว่าทำไมขั้นตอน copy private key ไปยัง `10.240.1.220` ล้มเหลว
- ต้องหา root cause ให้ชัด และเตรียมแนวทางแก้ก่อนดำเนินการจริง

### แผนดำเนินการรอบนี้
- [x] อัปเดตแผนงานและ checklist ใน `implement_plan.md`
- [x] ทดสอบ password-based SSH ไป `10.240.1.220` ด้วย `sshpass`
- [x] ทดสอบ `scp` จาก `10.240.1.173` ไป `10.240.1.220` ด้วยไฟล์ตัวอย่าง
- [x] ตรวจ state ของ `/home/user1/.ssh` เพื่อยืนยันว่ามี/ไม่มีไฟล์ `.pem` ที่ script พยายามส่ง
- [x] สรุป root cause และแนวทางแก้
- [x] ได้รับอนุมัติและแก้ `src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh`
- [x] local retest หลังแก้ไข
- [ ] docker retest
- [ ] UAT retest

### ผลตรวจสอบรอบนี้ (2026-04-09)
- `sshpass -v -p '***' ssh ... jventures@10.240.1.220 'echo PASSWORD_AUTH_OK'` ผ่าน ยืนยันว่าเครื่องปลายทางรับ password auth ได้
- ทดสอบ `scp` จาก `10.240.1.173` ไป `10.240.1.220:/tmp/` ด้วยไฟล์ตัวอย่างผ่าน (`Exit status 0`)
- ตรวจ `/home/user1/.ssh` หลังรัน flow พบ `authorized_keys`, `id_ed25519`, `known_hosts` แต่เดิม **ไม่พบไฟล์ `.pem`**
- แก้ script ให้สร้างไฟล์ `.pem` แบบ explicit, ตรวจไฟล์ก่อนส่ง, และไม่กลบ error ของ `scp`
- retest ด้วย `bash -x src/app/api/operations/aws/nonprod/adduser/script/adduservendor.sh ...` พบข้อความ `Copied private key to 10.240.1.220:/home/jventures/user1_u24-jid-sql-dv-u01.pem`
- retest ผ่าน local API อีกครั้งได้ `"success":true` และตรวจพบไฟล์ทั้งบน source (`/home/user1/.ssh/user1_u24-jid-sql-dv-u01.pem`) และ target (`/home/jventures/user1_u24-jid-sql-dv-u01.pem`)

### แนวทางแก้ที่ดำเนินการแล้ว
- เปลี่ยน flow ให้สร้างไฟล์ `.pem` แบบ explicit ด้วย `cp` แทน `mv`
- เพิ่มการตรวจว่าไฟล์ `.pem` มีอยู่จริงก่อนเรียก `scp`
- ปรับ `scp` ให้บังคับใช้ password auth ชัดเจน (`PreferredAuthentications=password`, `PubkeyAuthentication=no`)
- เพิ่ม `mkdir -p ~/.ssh` และ `set -euo pipefail` เพื่อให้ fail เร็วและ debug ง่ายขึ้น
