import React, { useState } from 'react';
import './Register.css';

function Register({ onBackToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    licenseKey: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = ลงทะเบียน, 2 = เปิดใช้งาน License

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getDeviceId = () => {
    // สร้าง device ID จาก browser fingerprint
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const deviceString = `${userAgent}-${screenResolution}-${timezone}`;
    
    // สร้าง hash แบบง่าย (ในการใช้งานจริงควรใช้ library เช่น fingerprintjs)
    let hash = 0;
    for (let i = 0; i < deviceString.length; i++) {
      const char = deviceString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ตรวจสอบข้อมูล
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      // Step 1: เปิดใช้งาน License
      const deviceId = getDeviceId();
      const activateResponse = await fetch('https://api.xcoptech.net/v1/license/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: formData.licenseKey,
          device_id: deviceId
        }),
      });

      const activateData = await activateResponse.json();

      if (activateResponse.status !== 200) {
        setError(activateData.message || 'ไม่สามารถเปิดใช้งาน License ได้');
        setLoading(false);
        return;
      }

      // Step 2: ตรวจสอบ License
      const verifyResponse = await fetch('https://api.xcoptech.net/v1/license/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: formData.licenseKey,
          device_id: deviceId
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.status !== 200 || !verifyData.valid) {
        setError('License ไม่ถูกต้องหรือหมดอายุ');
        setLoading(false);
        return;
      }

      // Step 3: ลงทะเบียนผู้ใช้
      const registerResponse = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          licenseKey: formData.licenseKey,
          deviceId: deviceId,
          licenseData: {
            type: verifyData.type,
            expiresAt: verifyData.expires_at,
            activatedAt: activateData.activation.activated_at
          }
        }),
      });

      const registerData = await registerResponse.json();

      if (registerData.success) {
        alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
        onBackToLogin();
      } else {
        setError(registerData.message || 'ลงทะเบียนไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">ลงทะเบียนใช้งาน</h1>
        <p className="register-subtitle">LineOA v2 - ระบบจัดการ LINE Official Account</p>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="licenseKey">License Key *</label>
            <input
              type="text"
              id="licenseKey"
              name="licenseKey"
              value={formData.licenseKey}
              onChange={handleChange}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">ชื่อผู้ใช้ *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="กรอกชื่อผู้ใช้"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">อีเมล *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
          </button>

          <button 
            type="button" 
            className="back-button"
            onClick={onBackToLogin}
            disabled={loading}
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;