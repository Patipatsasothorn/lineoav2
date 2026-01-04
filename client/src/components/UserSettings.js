import React, { useState, useEffect } from 'react';
import './UserSettings.css';
import { config } from '../config';

function UserSettings({ currentUser, onUserUpdate }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    fetchLicenseStatus();
  }, [currentUser]);

  useEffect(() => {
    // Update countdown every second
    if (licenseStatus?.isValid && licenseStatus?.remainingTime > 0) {
      const timer = setInterval(() => {
        const remaining = new Date(licenseStatus.expiresAt) - new Date();
        if (remaining <= 0) {
          setTimeRemaining(null);
          fetchLicenseStatus(); // Refresh status
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [licenseStatus]);

  const fetchLicenseStatus = async () => {
    try {
      const response = await fetch(`${config.API_ENDPOINTS.LICENSE_STATUS}?userId=${currentUser.id}`);
      const data = await response.json();
      
      if (data.success) {
        setLicenseStatus(data);
        if (data.remainingTime > 0) {
          setTimeRemaining(data.remainingTime);
        }
      }
    } catch (err) {
      console.error('Error fetching license status:', err);
    }
  };

const handleActivateLicense = async (e) => {
  e.preventDefault();
  
  if (!licenseKey.trim()) {
    setMessage({ type: 'error', text: '❌ กรุณากรอก License Key' });
    return;
  }

  setLoading(true);
  setMessage({ type: '', text: '' });

  try {
    const response = await fetch(config.API_ENDPOINTS.LICENSE_ACTIVATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        licenseKey: licenseKey.trim(),
        userId: currentUser.id
      }),
    });

    const data = await response.json();

    if (data.success) {
      setMessage({ type: 'success', text: '✅ เปิดใช้งาน License สำเร็จ!' });
      setLicenseKey('');
      
      // อัปเดต user info
      const updatedUser = {
        ...currentUser,
        licenseKey: licenseKey,
        licenseExpiry: data.expiresAt,
        isLicenseValid: true
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      // Refresh license status
      setTimeout(() => {
        fetchLicenseStatus();
      }, 500);
    } else {
      // แสดงข้อความผิดพลาดที่ชัดเจน
      if (data.message.includes('ถูกใช้งานแล้ว') || 
          data.message.includes('มีผู้ใช้งานแล้ว') ||
          data.message.includes('status = active')) {
        setMessage({ 
          type: 'error', 
          text: '❌ License Key นี้ถูกใช้งานแล้ว ไม่สามารถใช้ซ้ำได้' 
        });
      } else if (data.message.includes('ไม่พบ') || data.message.includes('ไม่ถูกต้อง')) {
        setMessage({ 
          type: 'error', 
          text: '❌ License Key ไม่ถูกต้องหรือไม่มีอยู่ในระบบ' 
        });
      } else if (data.message.includes('หมดอายุ')) {
        setMessage({ 
          type: 'error', 
          text: '❌ License Key นี้หมดอายุแล้ว' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ ${data.message || 'เปิดใช้งาน License ไม่สำเร็จ'}` 
        });
      }
    }
  } catch (err) {
    console.error('Activation error:', err);
    setMessage({ 
      type: 'error', 
      text: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' 
    });
  } finally {
    setLoading(false);
  }
};

  const formatTimeRemaining = (ms) => {
    if (!ms || ms <= 0) return 'หมดอายุแล้ว';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} วัน ${hours % 24} ชั่วโมง`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes % 60} นาที`;
    } else if (minutes > 0) {
      return `${minutes} นาที ${seconds % 60} วินาที`;
    } else {
      return `${seconds} วินาที`;
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        <h2>ตั้งค่าบัญชี</h2>

        {/* ข้อมูลผู้ใช้ */}
        <div className="settings-section">
          <h3>ข้อมูลส่วนตัว</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>ชื่อผู้ใช้:</label>
              <span>{currentUser.username}</span>
            </div>
            <div className="info-item">
              <label>บทบาท:</label>
              <span className={`role-badge ${currentUser.role}`}>
                {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
              </span>
            </div>
            <div className="info-item">
              <label>วันที่สร้างบัญชี:</label>
              <span>{new Date(currentUser.createdAt).toLocaleDateString('th-TH')}</span>
            </div>
          </div>
        </div>

        {/* สถานะ License */}
        <div className="settings-section">
          <h3>สถานะ License</h3>
          
          {currentUser.role === 'admin' ? (
            <div className="license-status admin-no-license">
              <div className="status-icon">👑</div>
              <div className="status-text">
                <strong>ผู้ดูแลระบบ</strong>
                <p>คุณเป็น Admin ไม่ต้องใช้ License</p>
              </div>
            </div>
          ) : licenseStatus?.isValid ? (
            <div className="license-status active">
              <div className="status-icon">✅</div>
              <div className="status-text">
                <strong>License ใช้งานได้</strong>
                <p>License Key: {licenseStatus.licenseKey}</p>
                <p>หมดอายุ: {new Date(licenseStatus.expiresAt).toLocaleString('th-TH')}</p>
              </div>
              <div className="countdown-timer">
                <div className="timer-label">เวลาคงเหลือ</div>
                <div className="timer-value">{formatTimeRemaining(timeRemaining)}</div>
              </div>
            </div>
          ) : licenseStatus?.hasLicense ? (
            <div className="license-status expired">
              <div className="status-icon">❌</div>
              <div className="status-text">
                <strong>License หมดอายุ</strong>
                <p>กรุณาเปิดใช้งาน License ใหม่</p>
              </div>
            </div>
          ) : (
            <div className="license-status no-license">
              <div className="status-icon">⚠️</div>
              <div className="status-text">
                <strong>ไม่มี License</strong>
                <p>คุณต้องเปิดใช้งาน License เพื่อส่งข้อความ</p>
              </div>
            </div>
          )}
        </div>

        {/* เปิดใช้งาน License (ยกเว้น Admin) */}
        {currentUser.role !== 'admin' && (
          <div className="settings-section">
            <h3>เปิดใช้งาน License</h3>
            
            <form onSubmit={handleActivateLicense} className="license-form">
              <div className="form-group">
                <label htmlFor="licenseKey">License Key</label>
                <input
                  type="text"
                  id="licenseKey"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  disabled={loading}
                />
                <small>รับ License Key จาก Admin</small>
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" className="btn-activate" disabled={loading}>
                {loading ? 'กำลังเปิดใช้งาน...' : 'เปิดใช้งาน License'}
              </button>
            </form>
          </div>
        )}

        {/* คำเตือนสำหรับ User ที่ไม่มี License */}
        {currentUser.role !== 'admin' && !licenseStatus?.isValid && (
          <div className="warning-box">
            <strong>⚠️ คำเตือน:</strong>
            <p>คุณจะไม่สามารถส่งข้อความได้จนกว่าจะเปิดใช้งาน License</p>
            <p>กรุณาติดต่อ Admin เพื่อขอ License Key</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserSettings;