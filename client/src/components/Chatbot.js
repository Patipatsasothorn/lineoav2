import React, { useState, useEffect } from 'react';
import './Chatbot.css';
import { config } from '../config';

function Chatbot({ currentUser }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [autoReplies, setAutoReplies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    keyword: '',
    replyType: 'text', // text หรือ image
    replyText: '',
    replyImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (currentUser) {
      fetchChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (selectedChannel) {
      fetchAutoReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${config.API_ENDPOINTS.CHANNELS}?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels);
        if (data.channels.length > 0) {
          setSelectedChannel(data.channels[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  };

  const fetchAutoReplies = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auto-replies?channelId=${selectedChannel}`);
      const data = await response.json();
      if (data.success) {
        setAutoReplies(data.autoReplies);
      }
    } catch (err) {
      console.error('Error fetching auto replies:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auto-replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          channelId: selectedChannel,
          userId: currentUser.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'เพิ่มข้อความตอบกลับอัตโนมัติสำเร็จ!' });
        setFormData({
          keyword: '',
          replyType: 'text',
          replyText: '',
          replyImage: ''
        });
        setShowForm(false);
        fetchAutoReplies();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบข้อความตอบกลับนี้หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auto-replies/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'ลบสำเร็จ!' });
        fetchAutoReplies();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการลบ' });
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h1>แชทบอท - ข้อความตอบกลับอัตโนมัติ</h1>
        <button
          className="add-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ ปิด' : '+ เพิ่มข้อความตอบกลับ'}
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {channels.length > 0 && (
        <div className="channel-selector">
          <label>เลือก LINE Channel:</label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="channel-select"
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.channelName}
              </option>
            ))}
          </select>
        </div>
      )}

      {showForm && (
        <div className="add-form-container">
          <h2>เพิ่มข้อความตอบกลับอัตโนมัติ</h2>
          <form onSubmit={handleSubmit} className="add-form">
            <div className="form-group">
              <label>คำที่ต้องการดักจับ *</label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({...formData, keyword: e.target.value})}
                placeholder="เช่น: สวัสดี, ราคา, สินค้า"
                required
              />
              <small>ระบบจะตอบกลับอัตโนมัติเมื่อตรวจพบคำนี้ในข้อความ</small>
            </div>

            <div className="form-group">
              <label>ประเภทการตอบกลับ *</label>
              <select
                value={formData.replyType}
                onChange={(e) => setFormData({...formData, replyType: e.target.value})}
                required
              >
                <option value="text">ข้อความ</option>
                <option value="image">รูปภาพ</option>
              </select>
            </div>

            {formData.replyType === 'text' ? (
              <div className="form-group">
                <label>ข้อความตอบกลับ *</label>
                <textarea
                  value={formData.replyText}
                  onChange={(e) => setFormData({...formData, replyText: e.target.value})}
                  placeholder="ข้อความที่ต้องการตอบกลับ"
                  rows="4"
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>URL รูปภาพ *</label>
                <input
                  type="url"
                  value={formData.replyImage}
                  onChange={(e) => setFormData({...formData, replyImage: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  required
                />
                <small>ใส่ URL ของรูปภาพที่ต้องการส่ง</small>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </form>
        </div>
      )}

      <div className="auto-replies-list">
        <div className="list-header">
          <h2>รายการข้อความตอบกลับอัตโนมัติ</h2>
          <span className="count-badge">{autoReplies.length} รายการ</span>
        </div>

        {autoReplies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <p className="empty-title">ยังไม่มีข้อความตอบกลับอัตโนมัติ</p>
            <p className="empty-subtitle">กดปุ่ม "+ เพิ่มข้อความตอบกลับ" เพื่อเริ่มต้นใช้งาน</p>
          </div>
        ) : (
          <div className="auto-replies-grid">
            {autoReplies.map((reply, index) => (
              <div key={reply.id} className="reply-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="reply-header">
                  <div className="keyword-section">
                    <span className="keyword-icon">🔑</span>
                    <h3 className="keyword-text">{reply.keyword || '(ไม่มี keyword)'}</h3>
                  </div>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(reply.id)}
                    title="ลบข้อความตอบกลับ"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>

                <div className="reply-info">
                  <div className="type-badge">
                    {reply.messageType === 'text' && '📝 ข้อความ'}
                    {reply.messageType === 'image' && '🖼️ รูปภาพ'}
                    {reply.messageType === 'sticker' && '🎨 สติกเกอร์'}
                    {!reply.messageType && (reply.replyType === 'text' ? '📝 ข้อความ' : '🖼️ รูปภาพ')}
                  </div>

                  {(reply.messageType === 'text' || reply.replyType === 'text') && (
                    <div className="reply-content">
                      <div className="content-label">ข้อความตอบกลับ</div>
                      <p className="content-text">{reply.reply || reply.replyText}</p>
                    </div>
                  )}

                  {(reply.messageType === 'image' || reply.replyType === 'image') && (
                    <div className="reply-content image-content">
                      <div className="content-label">รูปภาพ</div>
                      <div className="image-wrapper">
                        <img
                          src={reply.imageUrl || reply.replyImage}
                          alt="Auto Reply"
                          className="reply-image"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found'}
                        />
                      </div>
                    </div>
                  )}

                  {reply.messageType === 'sticker' && reply.stickerId && (
                    <div className="reply-content sticker-content">
                      <div className="content-label">สติกเกอร์</div>
                      <div className="sticker-wrapper">
                        <img
                          src={`https://stickershop.line-scdn.net/stickershop/v1/sticker/${reply.stickerId}/android/sticker.png`}
                          alt="Sticker"
                          className="reply-sticker"
                        />
                      </div>
                    </div>
                  )}

                  <div className="reply-footer">
                    <div className="footer-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>{new Date(reply.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    {reply.isActive !== undefined && (
                      <div className={`status-badge ${reply.isActive ? 'active' : 'inactive'}`}>
                        {reply.isActive ? '✓ ใช้งาน' : '✕ ปิดใช้งาน'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Chatbot;
