import React, { useState } from 'react';
import './Register.css';

function Register({ onBackToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ตรวจสอบข้อมูล
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (formData.username.length < 3) {
      setError('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      const registerResponse = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
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
        <p className="register-subtitle">QO Chat - ระบบจัดการแชทบริการลูกค้า</p>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">ชื่อผู้ใช้ *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="กรอกชื่อผู้ใช้ (อย่างน้อย 3 ตัวอักษร)"
              required
              minLength={3}
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
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
              minLength={6}
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
