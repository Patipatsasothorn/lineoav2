import React, { useState, useEffect } from 'react';
import './TeamManagement.css';
import { config } from '../config';

function TeamManagement({ currentUser }) {
  const [agents, setAgents] = useState([]);
  const [channels, setChannels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    agentUsername: '',
    assignedChannels: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingAgent, setEditingAgent] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchAgents();
      fetchChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/agents?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

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
      const url = editingAgent
        ? `${config.API_BASE_URL}/api/agents/${editingAgent.id}`
        : `${config.API_BASE_URL}/api/agents`;

      const response = await fetch(url, {
        method: editingAgent ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: currentUser.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: editingAgent ? 'อัปเดตข้อมูลลูกทีมสำเร็จ!' : 'เพิ่มลูกทีมสำเร็จ!'
        });
        setFormData({
          agentUsername: '',
          assignedChannels: []
        });
        setShowForm(false);
        setEditingAgent(null);
        fetchAgents();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      agentUsername: agent.agentUsername,
      assignedChannels: agent.assignedChannels || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบลูกทีมนี้หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/agents/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'ลบสำเร็จ!' });
        fetchAgents();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการลบ' });
    }
  };

  const handleChannelToggle = (channelId) => {
    setFormData(prev => ({
      ...prev,
      assignedChannels: prev.assignedChannels.includes(channelId)
        ? prev.assignedChannels.filter(id => id !== channelId)
        : [...prev.assignedChannels, channelId]
    }));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
    setFormData({
      agentUsername: '',
      assignedChannels: []
    });
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="team-container">
      <div className="team-header">
        <h1>กำหนดลูกทีม</h1>
        <button
          className="add-button"
          onClick={() => {
            setShowForm(!showForm);
            setEditingAgent(null);
            setFormData({
              agentUsername: '',
              assignedChannels: []
            });
          }}
        >
          {showForm ? '✕ ปิด' : '+ เพิ่มลูกทีม'}
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="add-form-container">
          <h2>{editingAgent ? 'แก้ไขข้อมูลลูกทีม' : 'เพิ่มลูกทีมใหม่'}</h2>
          <form onSubmit={handleSubmit} className="add-form">
            <div className="form-group">
              <label>ชื่อผู้ใช้ของลูกทีม *</label>
              <input
                type="text"
                value={formData.agentUsername}
                onChange={(e) => setFormData({...formData, agentUsername: e.target.value})}
                placeholder="กรอกชื่อผู้ใช้"
                required
              />
              <small>กรอกชื่อผู้ใช้ของคนที่ต้องการเพิ่มเป็นลูกทีม</small>
            </div>

            <div className="form-group">
              <label>กำหนด LINE OA ที่ให้เข้าถึง</label>
              {channels.length === 0 ? (
                <p className="no-channels">ยังไม่มี LINE OA ในระบบ</p>
              ) : (
                <div className="channels-checklist">
                  {channels.map((channel) => (
                    <label key={channel.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.assignedChannels.includes(channel.id)}
                        onChange={() => handleChannelToggle(channel.id)}
                      />
                      <span className="checkbox-label">
                        <strong>{channel.channelName}</strong>
                        <small>Channel ID: {channel.channelId}</small>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <small>เลือก LINE OA ที่ต้องการให้ลูกทีมคนนี้เข้าถึง</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'กำลังบันทึก...' : editingAgent ? 'อัปเดต' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="agents-list">
        <h2>รายการลูกทีม ({agents.length})</h2>

        {agents.length === 0 ? (
          <div className="empty-state">
            <p>ยังไม่มีลูกทีม</p>
            <p>กดปุ่ม "+ เพิ่มลูกทีม" เพื่อเพิ่มคนแรก</p>
          </div>
        ) : (
          <div className="agents-grid">
            {agents.map((agent) => (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <div className="agent-avatar">
                    👤
                  </div>
                  <div className="agent-info">
                    <h3>{agent.agentUsername}</h3>
                    <small>เพิ่มเมื่อ: {new Date(agent.createdAt).toLocaleDateString('th-TH')}</small>
                  </div>
                </div>

                <div className="agent-body">
                  <div className="agent-channels">
                    <div className="channels-label">
                      LINE OA ที่เข้าถึงได้ ({agent.assignedChannels?.length || 0})
                    </div>
                    {agent.assignedChannels && agent.assignedChannels.length > 0 ? (
                      <div className="channels-tags">
                        {agent.assignedChannels.map((channelId) => {
                          const channel = channels.find(c => c.id === channelId);
                          return channel ? (
                            <span key={channelId} className="channel-tag">
                              {channel.channelName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="no-access">ยังไม่ได้กำหนด LINE OA</p>
                    )}
                  </div>
                </div>

                <div className="agent-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(agent)}
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(agent.id)}
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamManagement;
