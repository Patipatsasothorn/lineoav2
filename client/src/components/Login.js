import React, { useState } from 'react';
import './Login.css';
import Register from './Register';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.token, data.user);
      } else {
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) {
    return <Register onBackToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">เข้าสู่ระบบ</h1>
        <p className="login-subtitle">LineOA v2 - ระบบจัดการ LINE Official Account</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">ชื่อผู้ใช้</label>
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
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          <div className="register-link">
            <span>ยังไม่มีบัญชี? </span>
            <button 
              type="button"
              className="link-button"
              onClick={() => setShowRegister(true)}
            >
              ลงทะเบียน
            </button>
          </div>
        </form>

        <div className="default-account-info">
          <p><strong>บัญชีทดสอบ:</strong></p>
          <p>Username: Test01</p>
          <p>Password: 123456789</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
