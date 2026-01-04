import React, { useState, useEffect } from 'react';
import './LicenseManagement.css';

function LicenseManagement({ currentUser }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form state
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [durationYears, setDurationYears] = useState('');

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/licenses?adminUserId=${currentUser.id}`);
      const data = await response.json();
      console.log('📦 Licenses data:', data);
      
      if (data.success) {
        setLicenses(data.licenses);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    }
  };

  const handleGenerateLicense = async (e) => {
    e.preventDefault();
    
    const minutes = parseInt(durationMinutes) || 0;
    const days = parseInt(durationDays) || 0;
    const months = parseInt(durationMonths) || 0;
    const years = parseInt(durationYears) || 0;
    
    if (minutes === 0 && days === 0 && months === 0 && years === 0) {
      setMessage({ type: 'error', text: 'กรุณากรอกระยะเวลาอย่างน้อย 1 ช่อง' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:5000/api/admin/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: {
            minutes: minutes || undefined,
            days: days || undefined,
            months: months || undefined,
            years: years || undefined
          },
          adminUserId: currentUser.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `✅ สร้าง License สำเร็จ: ${data.license.key}` });
        
        setDurationMinutes('');
        setDurationDays('');
        setDurationMonths('');
        setDurationYears('');
        
        fetchLicenses();
      } else {
        setMessage({ type: 'error', text: data.message || 'เกิดข้อผิดพลาด' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (license) => {
    const parts = [];
    
    if (license.durationYears) parts.push(`${license.durationYears} ปี`);
    if (license.durationMonths) parts.push(`${license.durationMonths} เดือน`);
    if (license.durationDays) parts.push(`${license.durationDays} วัน`);
    if (license.durationMinutes) parts.push(`${license.durationMinutes} นาที`);
    
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH');
  };

  const getStatusBadge = (status) => {
    if (status === 'unused') {
      return <span className="status-badge unused">ยังไม่ใช้</span>;
    } else if (status === 'active') {
      return <span className="status-badge active">ใช้งานแล้ว</span>;
    }
    return <span className="status-badge">{status}</span>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('📋 คัดลอกแล้ว: ' + text);
    }).catch(() => {
      alert('❌ ไม่สามารถคัดลอกได้');
    });
  };

  return (
    <div className="license-management">
      <div className="license-header">
        <h2>🎫 จัดการ License</h2>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">ทั้งหมด</span>
            <span className="stat-value">{licenses.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ยังไม่ใช้</span>
            <span className="stat-value">{licenses.filter(l => l.status === 'unused').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ใช้งานแล้ว</span>
            <span className="stat-value">{licenses.filter(l => l.status === 'active').length}</span>
          </div>
        </div>
      </div>

      <div className="generate-section">
        <h3>สร้าง License ใหม่</h3>
        
        <div className="license-form">
          <div className="duration-inputs">
            <div className="form-group">
              <label>นาที</label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>วัน</label>
              <input
                type="number"
                min="0"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>เดือน</label>
              <input
                type="number"
                min="0"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>ปี</label>
              <input
                type="number"
                min="0"
                value={durationYears}
                onChange={(e) => setDurationYears(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button onClick={handleGenerateLicense} className="btn-generate" disabled={loading}>
            {loading ? '⏳ กำลังสร้าง...' : '🎫 สร้าง License'}
          </button>
        </div>
      </div>

      <div className="licenses-section">
        <h3>รายการ License ทั้งหมด</h3>
        
        <div className="licenses-table-container">
          <table className="licenses-table">
            <thead>
              <tr>
                <th>License Key</th>
                <th>ระยะเวลา</th>
                <th>สถานะ</th>
                <th>ใช้โดย</th>
                <th>วันที่เปิดใช้งาน</th>
                <th>วันหมดอายุ</th>
                <th>วันที่สร้าง</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    ยังไม่มี License
                  </td>
                </tr>
              ) : (
                licenses.map(license => (
                  <tr key={license.id}>
                    <td data-label="License Key">
                      <code className="license-key">{license.licenseKey}</code>
                    </td>
                    <td data-label="ระยะเวลา">{formatDuration(license)}</td>
                    <td data-label="สถานะ">{getStatusBadge(license.status)}</td>
                    <td data-label="ใช้โดย">{license.activatedBy || '-'}</td>
                    <td data-label="วันที่เปิดใช้งาน">{formatDate(license.activatedAt)}</td>
                    <td data-label="วันหมดอายุ">{formatDate(license.expiresAt)}</td>
                    <td data-label="วันที่สร้าง">{formatDate(license.createdAt)}</td>
                    <td data-label="จัดการ">
                      <button
                        className="btn-copy"
                        onClick={() => copyToClipboard(license.licenseKey)}
                        title="คัดลอก License Key"
                      >
                        📋 คัดลอก
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LicenseManagement;