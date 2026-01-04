# LineOA v2 - LINE Official Account Management System

ระบบจัดการ LINE Official Account พร้อม UI แนวมินิมอล

## คุณสมบัติ

- 🔐 ระบบ Login (Username: Test01, Password: 123456789)
- 📱 จัดการ LINE Channels หลายบัญชี
- 💬 รวมแชทจากทุก LINE Channel
- 🎨 UI สวยงามแนวมินิมอล
- ⚡ Real-time message updates

## เทคโนโลยีที่ใช้

### Backend
- Node.js
- Express.js
- @line/bot-sdk
- CORS

### Frontend
- React
- CSS3
- Fetch API

## วิธีติดตั้งและรัน

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้ง backend dependencies
npm install

# ติดตั้ง frontend dependencies
cd client
npm install
cd ..
```

### 2. รัน Backend Server

```bash
npm start
```
Server จะรันที่ http://localhost:5000

### 3. รัน Frontend (เปิด Terminal ใหม่)

```bash
cd client
npm start
```
Frontend จะรันที่ http://localhost:3000

## การใช้งาน

### 1. Login
- Username: `Test01`
- Password: `123456789`

### 2. เพิ่ม LINE Channel
1. กดปุ่ม "+ เพิ่ม Channel"
2. กรอก Channel Secret และ Channel Access Token
3. สามารถตั้งชื่อ Channel ได้ (ไม่บังคับ)
4. กดปุ่ม "เพิ่ม Channel"

### 3. ตั้งค่า LINE Webhook
1. ไปที่ LINE Developers Console
2. เลือก Channel ที่ต้องการ
3. ไปที่ Messaging API
4. ตั้งค่า Webhook URL เป็น: `http://localhost:5000/webhook/{channelId}`
5. เปิดใช้งาน Webhook

### 4. ใช้งานแชท
1. คลิกที่แท็บ "แชท"
2. เลือกการสนทนาจากรายการด้านซ้าย
3. พิมพ์ข้อความและกดส่ง

## โครงสร้างโปรเจค

```
lineoa-v2/
├── server.js                 # Backend server
├── package.json             # Backend dependencies
├── client/                  # Frontend React app
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   ├── App.css         # Main styles
│   │   └── components/
│   │       ├── Login.js    # Login component
│   │       ├── Login.css
│   │       ├── Home.js     # Home/Dashboard component
│   │       ├── Home.css
│   │       ├── Chat.js     # Chat component
│   │       └── Chat.css
│   └── package.json        # Frontend dependencies
└── README.md               # คู่มือการใช้งาน
```

## API Endpoints

### Authentication
- `POST /api/login` - Login

### Channels
- `GET /api/channels` - ดึงรายการ channels
- `POST /api/channels` - เพิ่ม channel ใหม่
- `DELETE /api/channels/:id` - ลบ channel

### Messages
- `GET /api/messages` - ดึงข้อความทั้งหมด
- `POST /api/messages/send` - ส่งข้อความ
- `POST /webhook/:channelId` - รับข้อความจาก LINE

## การพัฒนาต่อ

### Features ที่สามารถเพิ่มได้
- ✅ รองรับ Rich Messages (รูปภาพ, วิดีโอ)
- ✅ ระบบแจ้งเตือนแบบ real-time (WebSocket)
- ✅ Export chat history
- ✅ Quick reply templates
- ✅ Auto-reply system
- ✅ Analytics dashboard
- ✅ Multi-language support
- ✅ ระบบจัดการผู้ใช้หลายคน

## หมายเหตุ

- โปรเจคนี้เป็น Mockup สำหรับการพัฒนา
- ในการใช้งานจริง ควรมีระบบจัดการ Database
- ควรมีระบบ Authentication ที่แข็งแรงกว่า
- ควรใช้ HTTPS และมีการจัดการ Environment Variables

## License

MIT License
