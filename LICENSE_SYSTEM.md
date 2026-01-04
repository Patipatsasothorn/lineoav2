# 🔑 License System Backend

## ภาพรวม

ระบบจัดการ License สำหรับควบคุมการใช้งานของ User โดย Admin สามารถสร้าง License, กำหนดอายุ, และจัดการผู้ใช้ได้

---

## 📊 Database Schema

### users.json (เพิ่ม fields)
```json
{
  "id": "1",
  "username": "Test01",
  "password": "123456789",
  "role": "admin",                    // ✨ "admin" หรือ "user"
  "licenseKey": "ABC12-DEF34-GHI56", // ✨ License key ที่เปิดใช้งาน
  "licenseExpiry": "2025-12-31T23:59:59.999Z", // ✨ วันหมดอายุ
  "createdAt": "2025-11-13T00:00:00.000Z"
}
```

### licenses.json (ใหม่)
```json
{
  "id": "1",
  "key": "ABC12-DEF34-GHI56-JKL78-MNO90",
  "duration": {
    "minutes": 0,
    "days": 30,
    "months": 0,
    "years": 0
  },
  "expiresAt": "2025-12-13T00:00:00.000Z",
  "createdAt": "2025-11-13T00:00:00.000Z",
  "createdBy": "1",              // Admin user ID
  "activatedBy": "2",            // User ID ที่เปิดใช้งาน
  "activatedAt": "2025-11-13T...",
  "status": "active"             // "unused", "active", "expired"
}
```

---

## 🔧 API Endpoints

### 1. License Management (Admin Only)

#### สร้าง License Key
```http
POST /api/admin/licenses/generate
Content-Type: application/json

{
  "adminUserId": "1",
  "duration": {
    "minutes": 30,    // optional
    "days": 30,       // optional
    "months": 1,      // optional
    "years": 1        // optional
  }
}

Response:
{
  "success": true,
  "message": "License generated successfully",
  "license": {
    "id": "...",
    "key": "ABC12-DEF34-GHI56-JKL78-MNO90",
    "duration": {...},
    "expiresAt": "2025-12-13T00:00:00.000Z",
    "status": "unused"
  }
}
```

#### ดึงรายการ License ทั้งหมด
```http
GET /api/admin/licenses?adminUserId=1

Response:
{
  "success": true,
  "licenses": [...]
}
```

---

### 2. License Activation (User)

#### เปิดใช้งาน License
```http
POST /api/license/activate
Content-Type: application/json

{
  "licenseKey": "ABC12-DEF34-GHI56-JKL78-MNO90",
  "userId": "2"
}

Response:
{
  "success": true,
  "message": "License activated successfully",
  "expiresAt": "2025-12-13T00:00:00.000Z"
}
```

#### ตรวจสอบสถานะ License
```http
GET /api/license/status?userId=2

Response:
{
  "success": true,
  "hasLicense": true,
  "licenseKey": "ABC12-...",
  "expiresAt": "2025-12-13T00:00:00.000Z",
  "isValid": true,
  "remainingTime": 2592000000  // milliseconds
}
```

---

### 3. User Management (Admin Only)

#### ดึงรายการ User ทั้งหมด
```http
GET /api/admin/users?adminUserId=1

Response:
{
  "success": true,
  "users": [
    {
      "id": "2",
      "username": "user01",
      "role": "user",
      "licenseKey": "ABC12-...",
      "licenseExpiry": "2025-12-13T...",
      "isLicenseValid": true,
      "createdAt": "2025-11-13T..."
    }
  ]
}
```

#### แก้ไข Role
```http
PUT /api/admin/users/:userId/role
Content-Type: application/json

{
  "adminUserId": "1",
  "role": "admin"  // "admin" or "user"
}

Response:
{
  "success": true,
  "message": "User role updated successfully",
  "user": {...}
}
```

#### รีเซ็ตรหัสผ่าน
```http
PUT /api/admin/users/:userId/reset-password
Content-Type: application/json

{
  "adminUserId": "1",
  "newPassword": "newpassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### ลบ User
```http
DELETE /api/admin/users/:userId?adminUserId=1

Response:
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### เพิ่ม License ให้ User
```http
POST /api/admin/users/:userId/add-license
Content-Type: application/json

{
  "adminUserId": "1",
  "licenseKey": "ABC12-DEF34-GHI56-JKL78-MNO90"
}

Response:
{
  "success": true,
  "message": "License added successfully",
  "expiresAt": "2025-12-13T00:00:00.000Z"
}
```

---

### 4. Updated Endpoints

#### Login (เพิ่มข้อมูล role และ license)
```http
POST /api/login
Content-Type: application/json

{
  "username": "Test01",
  "password": "123456789"
}

Response:
{
  "success": true,
  "token": "...",
  "user": {
    "id": "1",
    "username": "Test01",
    "role": "admin",                    // ✨
    "licenseKey": null,                 // ✨
    "licenseExpiry": null,              // ✨
    "isLicenseValid": false,            // ✨
    "createdAt": "..."
  }
}
```

#### Register (default role = "user")
```http
POST /api/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": {
    "id": "...",
    "username": "newuser",
    "role": "user"  // ✨ Default
  }
}
```

#### Send Message (ตรวจสอบ license)
```http
POST /api/messages/send
Content-Type: application/json

{
  "channelId": "...",
  "userId": "...",
  "text": "Hello",
  "senderId": "2"  // ✨ เพิ่ม senderId เพื่อตรวจสอบ license
}

Error Response (License Expired):
{
  "success": false,
  "message": "License expired. Please activate a license to send messages.",
  "code": "LICENSE_EXPIRED"
}
```

---

## 🔒 Authorization

### Admin-Only Endpoints
- `/api/admin/licenses/*`
- `/api/admin/users/*`

**ตรวจสอบ:** ทุก request ต้องส่ง `adminUserId` และ backend จะตรวจสอบว่า user นั้นมี `role === 'admin'` หรือไม่

### User Endpoints
- `/api/license/activate`
- `/api/license/status`

**ตรวจสอบ:** ต้องส่ง `userId` ที่ถูกต้อง

---

## 🧪 Utility Functions

### `generateLicenseKey()`
สร้าง license key แบบสุ่ม รูปแบบ: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`

### `checkLicenseValidity(user)`
ตรวจสอบว่า license ของ user ยังใช้งานได้หรือไม่
- Return: `true` ถ้ายังไม่หมดอายุ
- Return: `false` ถ้าไม่มี license หรือหมดอายุแล้ว

### `calculateExpiryDate(duration)`
คำนวณวันหมดอายุจาก duration object
```javascript
duration = {
  minutes: 30,
  days: 7,
  months: 1,
  years: 1
}
```

---

## 🎯 Workflow

### สำหรับ Admin:

1. **Login ด้วย account admin**
   - username: `Test01`
   - password: `123456789`
   - role: `admin`

2. **สร้าง License**
   ```
   POST /api/admin/licenses/generate
   {
     "adminUserId": "1",
     "duration": { "days": 30 }
   }
   → ได้ License Key: ABC12-DEF34-GHI56-JKL78-MNO90
   ```

3. **มอบ License ให้ User**
   ```
   POST /api/admin/users/{userId}/add-license
   {
     "adminUserId": "1",
     "licenseKey": "ABC12-..."
   }
   ```

4. **จัดการ Users**
   - ดูรายการ users
   - แก้ไข role
   - รีเซ็ตรหัสผ่าน
   - ลบ user

### สำหรับ User:

1. **Register** (role = "user" อัตโนมัติ)

2. **Login**

3. **เปิดใช้งาน License**
   ```
   POST /api/license/activate
   {
     "licenseKey": "ABC12-...",
     "userId": "2"
   }
   ```

4. **ใช้งานระบบ**
   - ส่งข้อความได้ (ถ้า license valid)
   - จัดการ channels
   - แชทกับลูกค้า

5. **เมื่อ License หมดอายุ**
   - ไม่สามารถส่งข้อความได้
   - ต้องเปิดใช้งาน license ใหม่

---

## ⚠️ หมายเหตุสำคัญ

1. **Admin Account**
   - มีอยู่ 1 account: `Test01` / `123456789`
   - Admin ไม่ต้องมี license (ส่งข้อความได้เสมอ)

2. **License Duration**
   - สามารถกำหนดได้หลายหน่วย: minutes, days, months, years
   - ระบบจะบวกเวลาทั้งหมดเข้าด้วยกัน

3. **License Status**
   - `unused`: ยังไม่มีใครใช้
   - `active`: กำลังใช้งานอยู่
   - `expired`: หมดอายุแล้ว (ยังไม่ได้ implement auto-expire)

4. **Security**
   - Password ยังเป็น plain text (ควร hash ใน production)
   - ไม่มี JWT authentication จริง (ใช้ mockup token)

---

## 🚀 Next Steps (Frontend)

ขั้นตอนต่อไปคือการสร้าง Frontend:

1. **Login Route** - แยก redirect ตาม role
2. **Admin Panel** - หน้าจัดการ users และ licenses
3. **User Settings** - หน้าเปิดใช้งาน license
4. **License Timer** - countdown component
5. **Message Block** - ป้องกันการส่งข้อความเมื่อหมดอายุ

---

**Version:** 2.3.0  
**Feature:** License System Backend  
**Status:** ✅ Backend Complete  
**Updated:** 13 พฤศจิกายน 2025
