# ☀️ 99 SOLAR HAT YAI (บริษัท 99 แมทช์ เมคเกอร์ จำกัด)
**ระบบวิศวกรรม ออกแบบผังหลังคา ใบเสนอราคา ขอราคาอะไหล่ และปิดการขายโซลาร์เซลล์ หาดใหญ่-สงขลา**

📞 **ติดต่อสายด่วน**: คุณไจ๋ไจ๋ โทร. `090-715-1987`  
💬 **LINE Official**: `@99sola`  
🏢 **สำนักงาน**: ต.คลองแห อ.หาดใหญ่ จ.สงขลา

---

## 🚀 วิธีนำขึ้นรันบน Render (How to Deploy to Render)

ระบบนี้รองรับการรันบน **[Render.com](https://render.com)** ได้อย่างสมบูรณ์แบบ มี 2 วิธีหลัก:

### วิธีที่ 1: Deploy เป็น Static Site (แนะนำที่สุด - ฟรี 100% และเร็วที่สุด)
1. สมัคร/เข้าสู่ระบบที่ **[https://dashboard.render.com](https://dashboard.render.com)**
2. กดปุ่ม **New +** > เลือก **Static Site**
3. เลือกเชื่อมต่อกับ GitHub Repository: `ninekau0907151987/99solar`
4. ตั้งค่าดังนี้:
   - **Name**: `solar99-hatyai` (หรือชื่อที่ต้องการ)
   - **Branch**: `main`
   - **Build Command**: *(เว้นว่างไว้ไม่ต้องใส่)*
   - **Publish Directory**: `.`
5. กดปุ่ม **Create Static Site**
   - Render จะทำการ Build และ Deploy ให้อัตโนมัติใน 30 วินาที
   - คุณจะได้ URL เช่น `https://solar99-hatyai.onrender.com` ใช้งานได้ทันที ฟรีตลอดชีพ พร้อม SSL HTTPS!

---

### วิธีที่ 2: Deploy เป็น Web Service (Node.js Server)
1. ใน Render Dashboard กด **New +** > เลือก **Web Service**
2. เลือก Repository: `ninekau0907151987/99solar`
3. ตั้งค่าดังนี้:
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (หรือเว้นว่าง)
   - **Start Command**: `npm start` (จะรัน `node server.js` พอร์ตอัตโนมัติตาม `$PORT`)
4. กด **Create Web Service**

---

### วิธีที่ 3: ใช้ Render Blueprint (1-Click Deploy)
- ใน Repository มีไฟล์ `render.yaml` เตรียมไว้ให้แล้ว
- ใน Render Dashboard กด **New +** > เลือก **Blueprint** > เลือก Repo นี้ Render จะอ่านค่าและ Deploy ให้อัตโนมัติทันที

---

## 📦 7 ระบบงานหลักในโปรเจกต์ (7 Main Subsystems)

1. **`index.html`**: เว็บไซต์หน้าร้านหลัก คำนวณค่าไฟ แพ็กเกจราคา ระบบแนะนำเพื่อนรับค่าคอมฯ
2. **`quotation.html`**: ระบบออกใบเสนอราคาทางการ (Quotation) พิมพ์ A4 / บันทึก PDF / ส่ง LINE
3. **`parts-rfq.html`**: ระบบออกใบขอราคาอะไหล่ & ดีลร้านค้าซัพพลายเออร์ (RFQ & Job Requisition)
4. **`solar-planner.html`**: โปรแกรมวิศวกรรมจำลองผังหลังคา จัดสตริงสายไฟ และถอดรายการอุปกรณ์ (BOM)
5. **`solar-enterprise.html`**: ระบบโซลาร์โรงงาน (C&I + BOI 50%) และงานประมูลราชการ e-Bidding (ปร.4/ปร.5)
6. **`solar-sales-sop.html`**: ระบบ Sales SOP 5 เลเวลลูกค้า พร้อม AI Chatbot และระบบเสียงเรียกราคา 4 ภาษา
7. **`solar-erp.html`**: ระบบจัดการธุรกิจโซลาร์ คลังสินค้า สต็อกอุปกรณ์ การเบิกจ่าย และช่างติดตั้ง
