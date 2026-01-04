import React, { useState, useEffect } from 'react';
import './Home.css';
import { config, getImageUrl } from '../config';

function Home({ currentUser }) {
  const [channels, setChannels] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddAgentForm, setShowAddAgentForm] = useState(false);

  const [formData, setFormData] = useState({
    channelSecret: '',
    channelAccessToken: '',
    channelName: ''
  });
  const [agentFormData, setAgentFormData] = useState({
    username: '',
    password: '',
    conformPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
  const handleSubmitAgent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    console.log('Agent Form Data:', agentFormData);
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
        setShowAddForm(false);
        fetchChannels();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      // alert('Error adding channel: ' + err.message);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>จัดการ LINE Channels agent</h1>
        <div>
          <button
            className="add-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ ยกเลิก' : '+ เพิ่ม Channel'}
          </button>
          <button
            className="add-button"
            onClick={() => setShowAddAgentForm(!showAddAgentForm)}
          >
            {showAddAgentForm ? '✕ ยกเลิก' : '+ เพิ่ม agent'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showAddForm && (
        <div className="add-form-container">
          <h2>เพิ่ม LINE Channel ใหม่</h2>
          <form onSubmit={handleSubmit} className="add-form">
            <div className="form-group">
              <label>ชื่อ Channel (ไม่บังคับ)</label>
              <input
                type="text"
                value={formData.channelName}
                onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                placeholder="My LINE Channel"
              />
            </div>

            <div className="form-group">
              <label>Channel Secret *</label>
              <input
                type="text"
                value={formData.channelSecret}
                onChange={(e) => setFormData({ ...formData, channelSecret: e.target.value })}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
            </div>

            <div className="form-group">
              <label>Channel Access Token *</label>
              <textarea
                value={formData.channelAccessToken}
                onChange={(e) => setFormData({ ...formData, channelAccessToken: e.target.value })}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                rows="4"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'กำลังเพิ่ม...' : 'เพิ่ม Channel'}
            </button>
          </form>
        </div>
      )}
      {showAddAgentForm && (
        <div className="add-form-container">
          <h2>เพิ่ม agent ใหม่</h2>
          <form onSubmit={handleSubmitAgent} className="add-form">
            <div className="form-group">
              <label>userName</label>
              <input
                type="text"
                value={agentFormData.username}
                onChange={(e) => setAgentFormData({ ...agentFormData, username: e.target.value })}
                placeholder="Username agent"
              />
            </div>

            <div className="form-group">
              <label>password agent</label>
              <input
                type="password"
                value={agentFormData.password}
                onChange={(e) => setAgentFormData({ ...agentFormData, password: e.target.value })}
                placeholder="agent1234"
                required
              />
            </div>
            <div className="form-group">
              <label>password agent</label>
              <input
                type="password"
                value={agentFormData.conformPassword}
                onChange={(e) => setAgentFormData({ ...agentFormData, conformPassword: e.target.value })}
                placeholder="agent1234"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'กำลังเพิ่ม...' : 'เพิ่ม agent'}
            </button>
          </form>
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
                  <h3>{channel.channelName}</h3>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(channel.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="channel-info">
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