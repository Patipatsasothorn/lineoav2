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
        <h2>รายการข้อความตอบกลับอัตโนมัติ ({autoReplies.length})</h2>

        {autoReplies.length === 0 ? (
          <div className="empty-state">
            <p>ยังไม่มีข้อความตอบกลับอัตโนมัติ</p>
            <p>กดปุ่ม "+ เพิ่มข้อความตอบกลับ" เพื่อเพิ่มข้อความแรก</p>
          </div>
        ) : (
          <div className="auto-replies-grid">
            {autoReplies.map((reply) => (
              <div key={reply.id} className="reply-card">
                <div className="reply-header">
                  <h3>🔑 {reply.keyword}</h3>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(reply.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="reply-info">
                  <div className="info-item">
                    <span className="label">ประเภท:</span>
                    <span className="value">{reply.replyType === 'text' ? '📝 ข้อความ' : '🖼️ รูปภาพ'}</span>
                  </div>
                  {reply.replyType === 'text' ? (
                    <div className="reply-content">
                      <span className="label">ข้อความตอบกลับ:</span>
                      <p>{reply.replyText}</p>
                    </div>
                  ) : (
                    <div className="reply-content">
                      <span className="label">รูปภาพ:</span>
                      <img src={reply.replyImage} alt="Reply" className="reply-image" />
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">สร้างเมื่อ:</span>
                    <span className="value">
                      {new Date(reply.createdAt).toLocaleString('th-TH')}
                    </span>
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
