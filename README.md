# ระบบบริหารจัดการโรงเรียน

**School Management System** — ระบบจัดการโรงเรียนครบวงจร สำหรับผู้ดูแลระบบ ครู และนักเรียน
สร้างด้วย Node.js · Express · SQLite · EJS · Tailwind CSS

---

## ภาพรวมระบบ

ระบบนี้แบ่งการทำงานออกเป็น **3 Portal** ตามบทบาทของผู้ใช้งาน

### Admin Portal
จัดการข้อมูลทั้งหมดของโรงเรียนจากจุดเดียว

| ฟีเจอร์ | รายละเอียด |
|---|---|
| จัดการครู | เพิ่ม / แก้ไข / ลบข้อมูลครู |
| จัดการนักเรียน | เพิ่ม / แก้ไข / ลบข้อมูลนักเรียน พร้อมผูก User Account |
| จัดการวิชา | กำหนดรหัสวิชา ชื่อวิชา ระดับชั้น หน่วยกิต และครูผู้สอน |
| จัดการห้องเรียน | สร้างห้องเรียน กำหนดระดับชั้น และดูจำนวนนักเรียน |
| จัดการตารางเรียน | จัดคาบเรียนตามวัน เวลา ห้อง และภาคเรียน |

### Teacher Portal
พื้นที่ทำงานสำหรับครู เข้าถึงได้หลัง Login ด้วย Role: Teacher

| ฟีเจอร์ | รายละเอียด |
|---|---|
| ตารางสอน | ดูตารางสอนของตัวเองจัดกลุ่มตามวัน |
| เช็คชื่อนักเรียน | บันทึกสถานะ มาเรียน / มาสาย / ขาดเรียน |
| ให้เกรด | บันทึกคะแนนและเกรดรายวิชาที่ตัวเองสอน |

### Student Portal
พื้นที่สำหรับนักเรียน เข้าถึงได้หลัง Login ด้วย Role: Student

| ฟีเจอร์ | รายละเอียด |
|---|---|
| ตารางเรียน | ดูตารางเรียนของตัวเองในภาคเรียนปัจจุบัน จัดกลุ่มตามวัน |
| ผลการเรียน | ดูเกรดรายวิชา แยกตามภาคเรียน พร้อมคำนวณ GPA สะสม |
| สถิติการเข้าเรียน | ดูยอดรวม มาเรียน / มาสาย / ขาดเรียน และประวัติรายวัน |

---

## Tech Stack

```
Runtime    Node.js
Framework  Express 5
Database   SQLite3 (ไฟล์ db/hsm.db)
Template   EJS
Auth       Passport.js (LocalStrategy) + bcryptjs
Session    express-session + connect-sqlite3
UI         Tailwind CSS (CDN) + Heroicons
Font       Kanit (Google Fonts)
```

---

## การติดตั้งและรันโปรเจกต์

### 1. ติดตั้ง Dependencies

```bash
cd CLI
npm install
```

### 2. สร้างฐานข้อมูล

```bash
node db/init_db.js
```

### 3. สร้างข้อมูลผู้ใช้เริ่มต้น (Seed)

```bash
node db/seed.js
```

### 4. รันโปรเจกต์

```bash
node app.js
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## บัญชีผู้ใช้เริ่มต้น

บัญชีเหล่านี้ถูกสร้างโดย `db/seed.js` — ใช้สำหรับทดสอบระบบ

| Role | Username | Password | Portal |
|---|---|---|---|
| Admin | `admin` | `123456` | `/dashboard` |
| Teacher | `teacher1` | `123456` | `/teacher/dashboard` |
| Student | `student1` | `123456` | `/student/dashboard` |

> ครูตัวอย่าง: **สมชาย ใจดี** · นักเรียนตัวอย่าง: **มาลี รักเรียน**

---

## โครงสร้างโปรเจกต์

```
CLI/
├── app.js                        # Entry point
├── config/
│   └── passport.js               # Passport LocalStrategy
├── controllers/
│   ├── authController.js
│   ├── teacherPortalController.js
│   └── studentPortalController.js
├── db/
│   ├── database.js               # SQLite connection (persistent)
│   ├── init_db.js                # สร้างตาราง (รันครั้งเดียว)
│   ├── seed.js                   # สร้าง User เริ่มต้น
│   └── hsm.db                    # ไฟล์ฐานข้อมูล
├── middleware/
│   └── auth.js                   # requireAdmin / requireTeacher / requireStudent
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── teacherPortalRoutes.js
│   └── studentPortalRoutes.js
└── views/
    ├── auth/                     # login.ejs
    ├── teachers/                 # index, add, edit
    ├── students/                 # index, add, edit
    ├── subjects/                 # index, add, edit
    ├── classrooms/               # index, add, edit
    ├── schedules/                # index, add, edit
    └── portal/
        ├── teacher/              # dashboard
        └── student/              # dashboard, grades, attendance
```

---

## ฐานข้อมูล (11 ตาราง)

```
Year · Users · Rooms · Teachers · Students · Subjects
Schedule · Attendance · Grade_Entries · Exam_Schedule · Exam_Schedule_Entries
```

---

*สร้างด้วย Node.js + Express สำหรับโปรเจกต์ระบบโรงเรียน*
