import React, { useState, useEffect } from 'react';
import './agent.css';

function Agent({ currentUser }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states for new agent
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });

  // Modal state for editing
  const [editingAgent, setEditingAgent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    password: '',
    isActive: true
  });

  // Channel management state
  const [userChannels, setUserChannels] = useState([]);
  const [managingChannelsAgent, setManagingChannelsAgent] = useState(null);
  const [assignedChannelIds, setAssignedChannelIds] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchAgents();
    if (currentUser) {
      fetchUserChannels();
    }
  }, [currentUser]);

  const fetchAgents = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/agents?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Fetch agents error:', err);
      setError('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChannels = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_URL}/api/channels?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setUserChannels(data.channels);
      }
    } catch (err) {
      console.error('Fetch channels error:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditFormData({ ...editFormData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: currentUser.id })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Agent registered successfully');
        setFormData({ name: '', username: '', password: '' });
        fetchAgents();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to register agent');
    }
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;

    try {
      const response = await fetch(`${API_URL}/api/agents/${agentId}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Agent deleted successfully');
        fetchAgents();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete agent');
    }
  };

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setEditFormData({
      name: agent.name || '',
      username: agent.username || '',
      password: agent.password || '',
      isActive: agent.isActive !== false
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editFormData, userId: currentUser.id })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Agent updated successfully');
        setEditingAgent(null);
        fetchAgents();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update agent');
    }
  };

  const openChannelsModal = async (agent) => {
    setManagingChannelsAgent(agent);
    try {
      const response = await fetch(`${API_URL}/api/agents/${agent.id}/channels`);
      const data = await response.json();
      if (data.success) {
        setAssignedChannelIds(data.channelIds || []);
      }
    } catch (err) {
      console.error('Fetch assigned channels error:', err);
      setAssignedChannelIds([]);
    }
  };

  const handleChannelToggle = (channelId) => {
    setAssignedChannelIds(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const saveChannelAssignments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/agents/${managingChannelsAgent.id}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelIds: assignedChannelIds,
          userId: currentUser.id
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Channels assigned successfully');
        setManagingChannelsAgent(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to assign channels');
    }
  };

  return (
    <div className="agent-container">
      <div className="agent-header">
        <h1>Agent Management</h1>
        <div className="user-info-badge">
          Admin: {currentUser?.username}
        </div>
      </div>

      {error && <div className="alert-error" style={{ padding: '15px', backgroundColor: '#fff2f0', color: '#ff4d4f', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffccc7' }}>{error}</div>}
      {success && <div className="alert-success" style={{ padding: '15px', backgroundColor: '#f6ffed', color: '#52c41a', borderRadius: '8px', marginBottom: '20px', border: '1px solid #b7eb8f' }}>{success}</div>}

      <div className="register-card">
        <h2>Register New Agent</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Agent Name (optional)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sales Support"
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>
          <div className="form-group">
            <button type="submit" className="btn-primary">Register Agent</button>
          </div>
        </form>
      </div>

      <h2>Registered Agents</h2>
      {loading ? (
        <div className="text-center" style={{ padding: '40px' }}>Loading agents...</div>
      ) : agents.length > 0 ? (
        <div className="agents-grid">
          {agents.map(agent => (
            <div key={agent.id} className="agent-item-card">
              <div className="agent-item-header">
                <div>
                  <h3 className="agent-name">{agent.name || agent.username}</h3>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                    Created: {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`agent-status ${agent.isActive ? 'status-active' : 'status-inactive'}`}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="agent-details">
                <div className="detail-row">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value">{agent.username}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Password:</span>
                  <span className="detail-value">••••••••</span>
                </div>
              </div>

              <div className="agent-actions">
                <button className="btn-edit" onClick={() => openEditModal(agent)}>Edit</button>
                <button className="btn-channels" onClick={() => openChannelsModal(agent)}>Channels</button>
                <button className="btn-delete" onClick={() => handleDelete(agent.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No agents registered yet. Start by creating your first agent!</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingAgent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Agent</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>New Password (optional)</label>
                <input
                  type="password"
                  name="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={editFormData.isActive}
                  onChange={handleEditChange}
                  style={{ margin: 0 }}
                />
                <label htmlFor="isActive" style={{ margin: 0 }}>Active</label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditingAgent(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Channels Modal */}
      {managingChannelsAgent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Manage Channels: {managingChannelsAgent.name || managingChannelsAgent.username}</h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '15px' }}>
              Select LINE channels this agent can access and manage.
            </p>

            <div className="channel-assignment-list">
              {userChannels.length > 0 ? (
                userChannels.map(channel => (
                  <div key={channel.id} className="channel-assignment-item">
                    <input
                      type="checkbox"
                      id={`channel-${channel.id}`}
                      checked={assignedChannelIds.includes(channel.id)}
                      onChange={() => handleChannelToggle(channel.id)}
                    />
                    <label htmlFor={`channel-${channel.id}`}>{channel.channelName}</label>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', padding: '20px', color: '#bdc3c7' }}>
                  No channels found. Please add a channel first.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setManagingChannelsAgent(null)}>Cancel</button>
              <button
                type="button"
                className="btn-primary"
                onClick={saveChannelAssignments}
                disabled={userChannels.length === 0}
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agent;