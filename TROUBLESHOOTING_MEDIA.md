# 🐛 Troubleshooting: ส่งรูปภาพและสติกเกอร์

## 🎨 ปัญหาการส่งสติกเกอร์

### ❌ Error: 400 Bad Request เมื่อส่งสติกเกอร์

**สาเหตุ:** Sticker Package ID และ Sticker ID ไม่ถูกต้องหรือไม่สามารถใช้งานได้

**วิธีแก้:**
1. ใช้ Sticker Package ที่ถูกต้อง (ตัวอย่างที่แก้ไขแล้วใช้ Package 11537 - Brown & Cony)
2. ตรวจสอบว่า Sticker ID ถูกต้อง

### ✅ Sticker Packages ที่ใช้งานได้

#### Package 11537 - Brown & Cony (แนะนำ)
```javascript
{
  packageId: '11537',
  stickerIds: ['52002734', '52002735', '52002736', ... '52002753']
}
```

#### Package 11538 - Brown & Cony (ชุด 2)
```javascript
{
  packageId: '11538',
  stickerIds: ['51626494', '51626495', '51626496', ... '51626533']
}
```

#### Package 11539 - Moon (ชุด 1)
```javascript
{
  packageId: '11539',
  stickerIds: ['52114110', '52114111', '52114112', ... '52114149']
}
```

### 🔍 วิธีหา Sticker ID ที่ใช้งานได้

1. ไปที่ LINE Sticker Shop: https://store.line.me/stickershop
2. เลือกสติกเกอร์ที่ต้องการ
3. ดู URL จะมีรูปแบบ: `https://store.line.me/stickershop/product/{packageId}`
4. ใช้ LINE Sticker API หรือเครื่องมือตรวจสอบ Sticker IDs

---

## 📸 ปัญหาการส่งรูปภาพ

### ❌ Error: LINE ไม่สามารถดาวน์โหลดรูปภาพได้

**สาเหตุ:** LINE API ต้องสามารถเข้าถึง URL ของรูปภาพจากภายนอก แต่ `localhost` เข้าถึงจากภายนอกไม่ได้

### ✅ วิธีแก้ - ใช้ ngrok

**ขั้นตอนที่ 1: ติดตั้ง ngrok**
```bash
# Windows - ดาวน์โหลดจาก https://ngrok.com/download
# หรือใช้ chocolatey
choco install ngrok

# Mac
brew install ngrok

# Linux
sudo snap install ngrok
```

**ขั้นตอนที่ 2: สร้าง account และ authtoken**
1. สร้างบัญชีฟรีที่ https://dashboard.ngrok.com/signup
2. Copy authtoken จาก https://dashboard.ngrok.com/get-started/your-authtoken
3. รันคำสั่ง:
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

**ขั้นตอนที่ 3: รัน ngrok**
```bash
# เปิด terminal ใหม่และรันคำสั่งนี้
ngrok http 5000
```

จะได้ URL แบบนี้:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5000
```

**ขั้นตอนที่ 4: อัปเดต server.js**

แก้ไขส่วนนี้ใน `server.js`:

```javascript
// เปลี่ยนจาก
const fullImageUrl = imageUrl.startsWith('http') 
  ? imageUrl 
  : `http://localhost:5000${imageUrl}`;

// เป็น
const NGROK_URL = 'https://abc123.ngrok.io'; // ใส่ URL จาก ngrok
const fullImageUrl = imageUrl.startsWith('http') 
  ? imageUrl 
  : `${NGROK_URL}${imageUrl}`;
```

**ขั้นตอนที่ 5: อัปเดต LINE Webhook URL**

ไปที่ LINE Developers Console และเปลี่ยน Webhook URL เป็น:
```
https://abc123.ngrok.io/webhook/:channelId
```

---

## 🌐 วิธีแก้ถาวร - Deploy บน Server จริง

### Option 1: Deploy บน Heroku (ฟรี)
```bash
# ติดตั้ง Heroku CLI
npm install -g heroku

# Login
heroku login

# สร้าง app
heroku create your-app-name

# Deploy
git push heroku main
```

### Option 2: Deploy บน Railway (ฟรี)
1. ไปที่ https://railway.app
2. Connect GitHub repository
3. Deploy อัตโนมัติ

### Option 3: Deploy บน Render (ฟรี)
1. ไปที่ https://render.com
2. Connect GitHub repository
3. Deploy อัตโนมัติ

---

## 📝 วิธีแก้ปัญหาด่วน

### วิธีที่ 1: ใช้รูปภาพจาก URL ภายนอก

แทนที่จะอัปโหลดรูปจากเครื่อง ให้ใช้รูปจาก URL ภายนอก:

```javascript
// แก้ไข handleSendMessage ใน Chat.js
const imageUrl = 'https://example.com/image.jpg'; // URL ภายนอก

await fetch('http://localhost:5000/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channelId: selectedChannel,
    userId: selectedUser,
    text: '[รูปภาพ]',
    messageType: 'image',
    imageUrl: imageUrl // URL ภายนอก
  })
});
```

### วิธีที่ 2: Upload รูปไปยัง Image Hosting

1. **Imgur** - https://imgur.com
   - อัปโหลดรูปฟรี
   - ได้ direct link

2. **ImgBB** - https://imgbb.com
   - อัปโหลดฟรี
   - API key ฟรี

3. **Cloudinary** - https://cloudinary.com
   - มี free tier
   - มี API

---

## 🧪 วิธีทดสอบ

### ทดสอบส่งสติกเกอร์:
```bash
# ใช้ curl ทดสอบ
curl -X POST https://api.line.me/v2/bot/message/push \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN' \
  -d '{
    "to": "USER_ID",
    "messages": [{
      "type": "sticker",
      "packageId": "11537",
      "stickerId": "52002734"
    }]
  }'
```

### ทดสอบส่งรูปภาพ:
```bash
curl -X POST https://api.line.me/v2/bot/message/push \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN' \
  -d '{
    "to": "USER_ID",
    "messages": [{
      "type": "image",
      "originalContentUrl": "https://example.com/image.jpg",
      "previewImageUrl": "https://example.com/image.jpg"
    }]
  }'
```

---

## 📋 Checklist

### สำหรับสติกเกอร์:
- [ ] ใช้ Package ID ที่ถูกต้อง (เช่น 11537)
- [ ] ใช้ Sticker ID ที่ถูกต้อง (เช่น 52002734)
- [ ] Channel Access Token ถูกต้อง
- [ ] User ID ถูกต้อง

### สำหรับรูปภาพ:
- [ ] Image URL เข้าถึงได้จากภายนอก (ไม่ใช่ localhost)
- [ ] รูปภาพเป็น JPG, JPEG, หรือ PNG
- [ ] ขนาดไฟล์ไม่เกิน 10MB
- [ ] URL ใช้ HTTPS
- [ ] Channel Access Token ถูกต้อง
- [ ] User ID ถูกต้อง

---

## 🆘 ยังแก้ไม่ได้?

1. ตรวจสอบ Server logs อย่างละเอียด
2. ทดสอบด้วย LINE API Console: https://developers.line.biz/console/
3. ตรวจสอบ Channel Access Token ยังใช้งานได้อยู่
4. ดู LINE API Error Codes: https://developers.line.biz/en/reference/messaging-api/#error-responses

---

**หมายเหตุ:** 
- ในระบบจริง ไม่ควรใช้ localhost
- ควร deploy บน server จริงหรือใช้ ngrok
- Sticker IDs ที่ใช้ได้อาจเปลี่ยนแปลงตาม LINE Policy

**Version:** 2.2.1  
**Updated:** 13 พฤศจิกายน 2025
