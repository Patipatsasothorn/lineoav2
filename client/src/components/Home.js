import React, { useState, useEffect } from 'react';
import './Home.css';
import { config, getImageUrl } from '../config';

function Home({ currentUser }) {
  const [channels, setChannels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Warning, 2: Guide, 3: Form
  const [formData, setFormData] = useState({
    channelSecret: '',
    channelAccessToken: '',
    channelName: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingChannel, setEditingChannel] = useState(null);
  const [editFormData, setEditFormData] = useState({
    channelName: '',
    color: '#667eea'
  });

  // Color presets
  const colorPresets = [
    '#667eea', '#48bb78', '#f56565', '#ed8936',
    '#ecc94b', '#38b2ac', '#4299e1', '#9f7aea',
    '#ed64a6', '#718096'
  ];

  useEffect(() => {
    if (currentUser) {
      fetchChannels();
    }
  }, [currentUser]);

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${config.API_ENDPOINTS.CHANNELS}?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(config.API_ENDPOINTS.CHANNELS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'เพิ่ม LINE Channel สำเร็จ!' });
        setFormData({
          channelSecret: '',
          channelAccessToken: '',
          channelName: ''
        });
        setShowForm(false);
        setCurrentStep(1);
        fetchChannels();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setCurrentStep(1);
    setFormData({
      channelSecret: '',
      channelAccessToken: '',
      channelName: ''
    });
  };

  const handleDelete = async (channelId) => {
    if (!window.confirm('คุณต้องการลบ Channel นี้หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_ENDPOINTS.CHANNELS}/${channelId}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'ลบ Channel สำเร็จ!' });
        fetchChannels();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการลบ' });
    }
  };

  const handleEdit = (channel) => {
    setEditingChannel(channel);
    setEditFormData({
      channelName: channel.channelName,
      color: channel.color || '#667eea'
    });
  };

  const handleCancelEdit = () => {
    setEditingChannel(null);
    setEditFormData({
      channelName: '',
      color: '#667eea'
    });
  };

  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${config.API_ENDPOINTS.CHANNELS}/${editingChannel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          userId: currentUser.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'อัปเดต Channel สำเร็จ!' });
        handleCancelEdit();
        fetchChannels();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการอัปเดต' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>จัดการ LINE Channels</h1>
        <button
          className="add-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ ปิด' : '+ เพิ่ม Channel'}
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {editingChannel && (
        <div className="add-form-container">
          <div className="step-header">
            <h2>แก้ไข LINE OA</h2>
            <button className="close-button" onClick={handleCancelEdit}>✕</button>
          </div>

          <form onSubmit={handleUpdateChannel} className="add-form">
            <div className="form-group">
              <label>ชื่อ Channel *</label>
              <input
                type="text"
                value={editFormData.channelName}
                onChange={(e) => setEditFormData({...editFormData, channelName: e.target.value})}
                placeholder="My LINE Channel"
                required
              />
            </div>

            <div className="form-group">
              <label>สีของ LINE OA</label>
              <div className="color-picker-container">
                <div className="color-presets">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-preset ${editFormData.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditFormData({...editFormData, color: color})}
                      title={color}
                    />
                  ))}
                </div>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData({...editFormData, color: e.target.value})}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData({...editFormData, color: e.target.value})}
                    placeholder="#667eea"
                    className="color-text-input"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
              <small>สีนี้จะแสดงในหน้าแชทเพื่อบ่งบอกว่าข้อความมาจาก LINE OA ไหน</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancelEdit}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && (
        <div className="add-form-container">
          {/* Step 1: Warning/Prerequisites */}
          {currentStep === 1 && (
            <>
              <div className="step-header">
                <h2>โปรดอ่านก่อนทำการเชื่อมต่อ</h2>
                <button className="close-button" onClick={closeForm}>✕</button>
              </div>

              <div className="warning-list">
                <div className="warning-item">
                  <div className="warning-number">1</div>
                  <div className="warning-content">
                    <p><strong>ผู้ดำเนินการเชื่อมต่อจำเป็นต้องมีบทบาทใน LINE OA ที่จะนำมาเชื่อมต่อดังนี้</strong></p>
                    <p>แอดมิน (Administrator) ใน LINE OA และ Provider ของ LINE OA ที่ต้องการเชื่อมต่อ อ่านรายละเอียดเพิ่มเติมเกี่ยวกับ LINE Provider</p>
                  </div>
                </div>
                <div className="warning-item">
                  <div className="warning-number">2</div>
                  <div className="warning-content">
                    <p>หลังการเชื่อมต่อ เมื่อมีการตอบข้อความผ่านระบบ QO Chat จะมีการคิดโควต้าข้อความ LINE OA โปรดอ่านข้อมูลเพิ่มเติม <a href="https://developers.line.biz/en/docs/messaging-api/overview/#quota" target="_blank" rel="noopener noreferrer">ที่นี่</a></p>
                  </div>
                </div>
                <div className="warning-item">
                  <div className="warning-number">3</div>
                  <div className="warning-content">
                    <p>หากผู้ใช้งานตอบข้อความผ่านระบบ LINE OA หลังการเชื่อมต่อ ข้อความดังกล่าว จะไม่นำมาแสดงบนระบบ QO Chat เนื่องจากข้อจำกัดของ LINE OA</p>
                  </div>
                </div>
                <div className="warning-item">
                  <div className="warning-number">4</div>
                  <div className="warning-content">
                    <p>ประวัติข้อมูลแชททั้งหมดบนระบบ LINE OA ก่อนการเชื่อมต่อ จะไม่ถูกนำมาแสดงบนระบบ QO Chat หากต้องการแสดงข้อมูลดังกล่าว กรุณาติดต่อทีมงาน QO Chat ได้ที่นี่ ( LINE OA : @qochat )</p>
                  </div>
                </div>
              </div>

              <div className="step-footer">
                <button className="btn-secondary" onClick={closeForm}>ยกเลิก</button>
                <button className="btn-primary" onClick={() => setCurrentStep(2)}>เชื่อมต่อ LINE</button>
              </div>
            </>
          )}

          {/* Step 2: API Setup Guide */}
          {currentStep === 2 && (
            <>
              <div className="step-header">
                <h2>เปิดการใช้งาน Messaging API (1/3)</h2>
                <button className="close-button" onClick={closeForm}>✕</button>
              </div>

              <div className="setup-guide">
                <h3>ขั้นตอน</h3>
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="step-number">1</span>
                    <div className="step-content">
                      เปิด <a href="https://manager.line.biz" target="_blank" rel="noopener noreferrer">https://manager.line.biz</a>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">2</span>
                    <div className="step-content">
                      เลือกบัญชีและไปที่หน้าตั้งค่า
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">3</span>
                    <div className="step-content">
                      เลือก <strong>Messaging API</strong> ในเมนูด้านซ้ายมือ
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">4</span>
                    <div className="step-content">
                      กดปุ่ม <strong>ใช้ Messaging API</strong>
                      <div className="step-note">
                        <p><strong>กรณีมีปุ่ม Messaging API:</strong> กดใช้งานได้เลย</p>
                        <p><strong>กรณีไม่มีปุ่ม Messaging API:</strong> ต้องสร้างก่อน</p>
                      </div>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">5</span>
                    <div className="step-content">
                      หากธุรกิจมี<strong>โพรไวเดอร์ (Provider)</strong> อยู่แล้ว ให้เลือกโพรไวเดอร์<br />
                      หากยังไม่มี ให้สร้างโพรไวเดอร์ขึ้นใหม่
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">6</span>
                    <div className="step-content">
                      เพิ่ม Privacy policy หรือ Term of Use (กดข้ามได้)
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">7</span>
                    <div className="step-content">
                      ตรวจสอบข้อมูล และกด <strong>ตกลง</strong>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-number">8</span>
                    <div className="step-content">
                      กลับมาที่ QO Chat แล้วกดปุ่ม '<strong>ถัดไป</strong>'
                    </div>
                  </div>
                </div>
              </div>

              <div className="step-footer">
                <button className="btn-secondary" onClick={() => setCurrentStep(1)}>ย้อนกลับ</button>
                <button className="btn-primary" onClick={() => setCurrentStep(3)}>ถัดไป</button>
              </div>
            </>
          )}

          {/* Step 3: Token Form */}
          {currentStep === 3 && (
            <>
              <div className="step-header">
                <h2>คัดลอก Token (2/3)</h2>
                <button className="close-button" onClick={closeForm}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className="add-form">
                <div className="form-group">
                  <label>ชื่อ Channel (ไม่บังคับ)</label>
                  <input
                    type="text"
                    value={formData.channelName}
                    onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                    placeholder="My LINE Channel"
                  />
                </div>

                <div className="form-group">
                  <label>Channel Secret *</label>
                  <input
                    type="text"
                    value={formData.channelSecret}
                    onChange={(e) => setFormData({...formData, channelSecret: e.target.value})}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Channel Access Token *</label>
                  <textarea
                    value={formData.channelAccessToken}
                    onChange={(e) => setFormData({...formData, channelAccessToken: e.target.value})}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    rows="4"
                    required
                  />
                </div>
              </form>

              <div className="step-footer">
                <button className="btn-secondary" onClick={() => setCurrentStep(2)}>ย้อนกลับ</button>
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Channel'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="channels-list">
        <h2>LINE Channels ทั้งหมด ({channels.length})</h2>
        
        {channels.length === 0 ? (
          <div className="empty-state">
            <p>ยังไม่มี LINE Channel</p>
            <p>กดปุ่ม "+ เพิ่ม Channel" เพื่อเพิ่ม Channel แรกของคุณ</p>
          </div>
        ) : (
          <div className="channels-grid">
            {channels.map((channel) => (
              <div key={channel.id} className="channel-card">
                <div className="channel-header">
                  <div className="channel-title">
                    <div
                      className="channel-color-indicator"
                      style={{ backgroundColor: channel.color || '#667eea' }}
                    />
                    <h3>{channel.channelName}</h3>
                  </div>
                  <div className="channel-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(channel)}
                      title="แก้ไข"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(channel.id)}
                      title="ลบ"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="channel-info">
                  <div className="info-item">
                    <span className="label">สี:</span>
                    <span className="value">
                      <div className="color-display">
                        <div
                          className="color-box"
                          style={{ backgroundColor: channel.color || '#667eea' }}
                        />
                        {channel.color || '#667eea'}
                      </div>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Channel Secret:</span>
                    <span className="value">
                      {channel.channelSecret.substring(0, 10)}...
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">เพิ่มเมื่อ:</span>
                    <span className="value">
                      {new Date(channel.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
                <div className="webhook-url">
                  <span className="label">Webhook URL:</span>
                  <code>{config.API_BASE_URL}/webhook/{channel.id}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;