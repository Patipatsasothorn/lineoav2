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
    messageType: 'text', // text หรือ image
    replyText: '',
    replyImage: ''
  });
  const [editingId, setEditingId] = useState(null);
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
      const response = await fetch(`${config.API_BASE_URL}/api/auto-replies?userId=${currentUser.id}`);
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
      const url = editingId
        ? `${config.API_BASE_URL}/api/auto-replies/${editingId}`
        : `${config.API_BASE_URL}/api/auto-replies`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: formData.keyword,
          reply: formData.messageType === 'text' ? formData.replyText : formData.replyImage,
          messageType: formData.messageType,
          channelId: selectedChannel,
          userId: currentUser.id,
          isActive: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: editingId ? 'แก้ไขข้อความตอบกลับสำเร็จ!' : 'เพิ่มข้อความตอบกลับอัตโนมัติสำเร็จ!'
        });
        setFormData({
          keyword: '',
          messageType: 'text',
          replyText: '',
          replyImage: ''
        });
        setEditingId(null);
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

  const handleEdit = (reply) => {
    setFormData({
      keyword: reply.keyword,
      messageType: reply.messageType || 'text',
      replyText: reply.messageType === 'text' ? reply.reply : '',
      replyImage: reply.messageType === 'image' ? reply.reply : ''
    });
    setEditingId(reply.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({
      keyword: '',
      messageType: 'text',
      replyText: '',
      replyImage: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบข้อความตอบกลับนี้หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auto-replies/${id}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'ลบสำเร็จ!' });
        fetchAutoReplies();
      } else {
        setMessage({ type: 'error', text: data.message || 'ไม่สามารถลบได้' });
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
          onClick={() => {
            if (showForm && editingId) {
              handleCancelEdit();
            } else {
              setShowForm(!showForm);
            }
          }}
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
          <h2>{editingId ? 'แก้ไขข้อความตอบกลับอัตโนมัติ' : 'เพิ่มข้อความตอบกลับอัตโนมัติ'}</h2>
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
                value={formData.messageType}
                onChange={(e) => setFormData({...formData, messageType: e.target.value})}
                required
              >
                <option value="text">ข้อความ</option>
                <option value="image">รูปภาพ</option>
              </select>
            </div>

            {formData.messageType === 'text' ? (
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

            <div className="form-buttons">
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'บันทึก')}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelEdit}
                >
                  ยกเลิก
                </button>
              )}
            </div>
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
                  <div className="reply-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(reply)}
                      title="แก้ไข"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(reply.id)}
                      title="ลบ"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="reply-info">
                  <div className="info-item">
                    <span className="label">ประเภท:</span>
                    <span className="value">{reply.messageType === 'image' ? '🖼️ รูปภาพ' : '📝 ข้อความ'}</span>
                  </div>
                  <div className="reply-content">
                    <span className="label">{reply.messageType === 'image' ? 'รูปภาพ:' : 'ข้อความตอบกลับ:'}</span>
                    {reply.messageType === 'image' ? (
                      <img src={reply.reply} alt="Auto reply" className="reply-image" />
                    ) : (
                      <p>{reply.reply}</p>
                    )}
                  </div>
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
