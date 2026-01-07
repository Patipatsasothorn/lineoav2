import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import PromptDialog from './PromptDialog';
import './UserSettings.css';
import { config } from '../config';

function UserSettings({ currentUser, onUserUpdate }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Settings state
  const [notificationVolume, setNotificationVolume] = useState(50);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [promptDialog, setPromptDialog] = useState({ isOpen: false, action: null });

  useEffect(() => {
    fetchLicenseStatus();
    loadSettings();
  }, [currentUser]);

  const loadSettings = () => {
    const savedVolume = localStorage.getItem('notificationVolume');
    const savedEnabled = localStorage.getItem('notificationEnabled');

    if (savedVolume !== null) {
      setNotificationVolume(parseInt(savedVolume));
    }
    if (savedEnabled !== null) {
      setNotificationEnabled(savedEnabled === 'true');
    }
  };

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

  const handleChangeUsername = (newUsername) => {
    if (!newUsername || newUsername.trim().length < 3) {
      toast.error('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
      return;
    }

    fetch('http://localhost:5000/api/users/update-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        newUsername: newUsername.trim()
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const updatedUser = { ...currentUser, username: newUsername.trim() };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          if (onUserUpdate) onUserUpdate(updatedUser);
          toast.success('เปลี่ยนชื่อผู้ใช้สำเร็จ');
        } else {
          toast.error('เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ: ' + data.message);
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('เกิดข้อผิดพลาด');
      });
  };

  const handleChangePassword = (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    fetch('http://localhost:5000/api/users/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        newPassword: newPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
        } else {
          toast.error('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + data.message);
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('เกิดข้อผิดพลาด');
      });
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setNotificationVolume(newVolume);
    localStorage.setItem('notificationVolume', newVolume);
    window.dispatchEvent(new CustomEvent('notificationVolumeChange', { detail: newVolume }));
  };

  const handleVolumeChangeEnd = () => {
    // เล่นเสียงทดสอบเมื่อปล่อยเมาส์
    const audio = new Audio('/sound/notification.mp3');
    audio.volume = notificationVolume / 100;
    audio.play().catch(() => {
      // ถ้าไม่มีไฟล์ ใช้เสียง base64 สำรอง
      const fallbackAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe87OWYSgwNUKzn77FdGAU7k9nxxnMoCSpzy/DajTwJE2Cx6uajUxELTKXh7rRfGgY+kdTvxHUpBylvyO7ZjTwJElyx6+mjUxELTKTh7bRfGgU9kdTvxHQoBylvyO7YjTsJEltw6+mjUxAKTKTh7bRfGgU9kdTuxHQoByhwyO3YjTwJEltw6+mjUhAKTKTh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvw=');
      fallbackAudio.volume = notificationVolume / 100;
      fallbackAudio.play().catch(() => {});
    });
  };

  const handleToggleNotification = () => {
    const newEnabled = !notificationEnabled;
    setNotificationEnabled(newEnabled);
    localStorage.setItem('notificationEnabled', newEnabled);
    window.dispatchEvent(new CustomEvent('notificationEnabledChange', { detail: newEnabled }));
    toast.success(newEnabled ? 'เปิดเสียงแจ้งเตือนแล้ว' : 'ปิดเสียงแจ้งเตือนแล้ว');
  };

  const handlePromptConfirm = (value) => {
    const { action } = promptDialog;
    if (action === 'changeUsername') {
      handleChangeUsername(value);
    } else if (action === 'changePassword') {
      handleChangePassword(value);
    }
    setPromptDialog({ isOpen: false, action: null });
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
              <div className="info-value-with-action">
                <span>{currentUser.username}</span>
                <button
                  className="btn-edit"
                  onClick={() => setPromptDialog({ isOpen: true, action: 'changeUsername' })}
                >
                  แก้ไข
                </button>
              </div>
            </div>
            <div className="info-item">
              <label>รหัสผ่าน:</label>
              <div className="info-value-with-action">
                <span>••••••••</span>
                <button
                  className="btn-edit"
                  onClick={() => setPromptDialog({ isOpen: true, action: 'changePassword' })}
                >
                  เปลี่ยน
                </button>
              </div>
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

        {/* การตั้งค่าการแจ้งเตือน */}
        <div className="settings-section">
          <h3>การแจ้งเตือน</h3>
          <div className="notification-settings">
            <div className="setting-item">
              <div className="setting-header">
                <label>เสียงแจ้งเตือน</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notificationEnabled}
                    onChange={handleToggleNotification}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <p className="setting-description">
                {notificationEnabled ? 'เปิดเสียงแจ้งเตือนเมื่อมีข้อความเข้า' : 'ปิดเสียงแจ้งเตือน'}
              </p>
            </div>

            {notificationEnabled && (
              <div className="setting-item">
                <div className="setting-header">
                  <label>ระดับเสียง ({notificationVolume}%)</label>
                  <span className="volume-icon">{notificationVolume === 0 ? '🔇' : notificationVolume < 50 ? '🔉' : '🔊'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={notificationVolume}
                  onChange={handleVolumeChange}
                  onMouseUp={handleVolumeChangeEnd}
                  onTouchEnd={handleVolumeChangeEnd}
                  className="volume-slider"
                />
                <div className="volume-labels">
                  <span>🔇 0%</span>
                  <span>🔊 100%</span>
                </div>
              </div>
            )}
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

      {/* Prompt Dialog */}
      <PromptDialog
        isOpen={promptDialog.isOpen}
        onClose={() => setPromptDialog({ isOpen: false, action: null })}
        onConfirm={handlePromptConfirm}
        title={promptDialog.action === 'changeUsername' ? 'เปลี่ยนชื่อผู้ใช้' : 'เปลี่ยนรหัสผ่าน'}
        message={promptDialog.action === 'changeUsername' ? 'กรุณากรอกชื่อผู้ใช้ใหม่' : 'กรุณากรอกรหัสผ่านใหม่'}
        placeholder={promptDialog.action === 'changeUsername' ? 'ชื่อผู้ใช้ใหม่' : 'รหัสผ่านใหม่'}
        defaultValue={promptDialog.action === 'changeUsername' ? currentUser.username : ''}
        inputType={promptDialog.action === 'changePassword' ? 'password' : 'text'}
        minLength={promptDialog.action === 'changeUsername' ? 3 : 6}
      />
    </div>
  );
}

export default UserSettings;