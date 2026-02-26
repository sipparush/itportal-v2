always explain in Thai.


สร้างไฟล์ implement_plan.md ที่มีแผนที่จะดำเนินการ พร้อมทั้ง มี checklist เพื่อแสดงสถานะของ tasks  และรออนุมัติแผนก่อนดำเนินการ

ีหากมี request ใหม่ เพิ่มต่อในไฟล์ implement_plan.md พร้อมทั้ง มี checklist เพื่อแสดงสถานะของ tasks และรออนุมัติแผนก่อนดำเนินการ

ขั้นตอนเทสดังนี้ 
1.senior qa ทำการ full test แล้วบันทึกในไฟล์   full_test_result.md
2.develop เข้ามาอ่าน full_test_result.md และอัพเดต implement_plan.md ตามผลการทดสอบ แล้วรออนุมัติปรับแก้ แล้วจึงปรับแก้
3. เมื่อแก้เสร็จแล้ว ให้ทำเทสในข้อ 1 ใหม่ จนกว่าผลการทดสอบจะผ่านทั้งหมด
4. หากมีการ change ,ให้เทส จนผ่านหมดทุกเคส ก่อนจะขออนุมัติ เพื่อเปลี่ยน environment โดยเรียงลำดับการเทสใน environment ดังนี้ 
   4.1 local test เช่น npm run dev
   4.2 docker test เช่น docker-compose up
   4.3 uat test โดย  git push และรอ pipeline deploy เสร็จ แล้วจึงทดสอบผ่าน url:  itportal.jfin.network 