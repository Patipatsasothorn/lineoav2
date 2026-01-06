import React, { useState, useEffect } from 'react';
import './ArchivedChats.css';

function ArchivedChats({ currentUser }) {
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('🎯 [ArchivedChats] Component mounted');
  console.log('🎯 [ArchivedChats] currentUser:', currentUser);

  useEffect(() => {
    console.log('🔄 [ArchivedChats] useEffect triggered');
    console.log('🔄 [ArchivedChats] currentUser in useEffect:', currentUser);

    if (currentUser) {
      fetchArchivedConversations();
    } else {
      console.warn('⚠️ [ArchivedChats] No currentUser, skipping fetch');
    }
  }, [currentUser]);

  const fetchArchivedConversations = async () => {
    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const url = `http://localhost:5000/api/conversations/archived?${param}`;

      console.log('📥 [ArchivedChats] Fetching archived conversations...');
      console.log('📥 [ArchivedChats] Current user:', currentUser);
      console.log('📥 [ArchivedChats] Is agent:', isAgent);
      console.log('📥 [ArchivedChats] URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('📥 [ArchivedChats] Response status:', response.status);
      console.log('📥 [ArchivedChats] Response data:', data);

      if (data.success) {
        console.log('📥 [ArchivedChats] Setting archived conversations:', data.archivedConversations);
        console.log('📥 [ArchivedChats] Number of archives:', data.archivedConversations.length);
        setArchivedConversations(data.archivedConversations);
      } else {
        console.warn('📥 [ArchivedChats] Request failed:', data.message);
      }
    } catch (error) {
      console.error('❌ [ArchivedChats] Error fetching archived conversations:', error);
    }
  };

  const fetchArchivedMessages = async (archiveId) => {
    setLoading(true);
    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const url = `http://localhost:5000/api/conversations/archived/${archiveId}/messages?${param}`;

      console.log('📨 [ArchivedChats] Fetching messages for archiveId:', archiveId);
      console.log('📨 [ArchivedChats] URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('📨 [ArchivedChats] Response:', data);

      if (data.success) {
        setSelectedArchive(data.archive);
        setMessages(data.messages);
      } else {
        alert('ไม่พบแชทที่เก็บไว้: ' + data.message);
      }
    } catch (error) {
      console.error('Error fetching archived messages:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อความ');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreConversation = async (archiveId) => {
    if (!window.confirm('ต้องการนำแชทนี้กลับมาใช้งานหรือไม่?')) {
      return;
    }

    try {
      const isAgent = currentUser.role === 'agent';
      const requestBody = isAgent
        ? { agentId: currentUser.id }
        : { userId: currentUser.id };

      console.log('↩️ [ArchivedChats] Restoring archive:', archiveId);
      console.log('↩️ [ArchivedChats] Request body:', requestBody);

      const response = await fetch(`http://localhost:5000/api/conversations/restore/${archiveId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        alert('✓ นำแชทกลับมาเรียบร้อย!');
        fetchArchivedConversations();
        setSelectedArchive(null);
        setMessages([]);
      } else {
        alert('นำแชทกลับไม่สำเร็จ: ' + data.message);
      }
    } catch (error) {
      console.error('Error restoring conversation:', error);
      alert('เกิดข้อผิดพลาดในการนำแชทกลับ');
    }
  };

  const handleDeleteConversation = async (archiveId) => {
    if (!window.confirm('ต้องการลบแชทนี้ถาวรหรือไม่?\n\n⚠️ ข้อมูลที่ลบแล้วจะไม่สามารถกลับคืนได้!')) {
      return;
    }

    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const url = `http://localhost:5000/api/conversations/archived/${archiveId}?${param}`;

      console.log('🗑️ [ArchivedChats] Deleting archive:', archiveId);
      console.log('🗑️ [ArchivedChats] URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('✓ ลบแชทเรียบร้อย!');
        fetchArchivedConversations();
        setSelectedArchive(null);
        setMessages([]);
      } else {
        alert('ลบแชทไม่สำเร็จ: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('เกิดข้อผิดพลาดในการลบแชท');
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.messageType === 'image' && msg.imageUrl) {
      const fullImageUrl = msg.imageUrl.startsWith('http')
        ? msg.imageUrl
        : `http://localhost:5000${msg.imageUrl}`;

      return (
        <div className="message-image">
          <img
            src={fullImageUrl}
            alt="Sent image"
            style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span style={{ display: 'none' }}>[รูปภาพ]</span>
        </div>
      );
    }

    if (msg.messageType === 'sticker' && msg.stickerId) {
      const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${msg.stickerId}/android/sticker.png`;

      return (
        <div className="message-sticker">
          <img
            src={stickerUrl}
            alt="Sticker"
            style={{ width: '150px', height: '150px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span style={{ display: 'none' }}>{msg.text}</span>
        </div>
      );
    }

    return msg.text;
  };

  // จัดกลุ่มแชทตาม Channel
  const groupedByChannel = archivedConversations.reduce((acc, archive) => {
    const channelName = archive.channelName;
    if (!acc[channelName]) {
      acc[channelName] = [];
    }
    acc[channelName].push(archive);
    return acc;
  }, {});

  // กรองตาม search query
  const filteredChannels = Object.keys(groupedByChannel).filter(channelName =>
    channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ถ้าเลือก channel แล้ว ให้แสดงแชทใน channel นั้น
  const chatsInSelectedChannel = selectedChannel ? groupedByChannel[selectedChannel] || [] : [];

  return (
    <div className="archived-chats-container">
      <div className="archived-sidebar">
        {!selectedChannel ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0 }}>Channels</h2>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="ค้นหา Channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {archivedConversations.length === 0 ? (
              <div className="no-archives">
                <p>ยังไม่มีแชทที่เก็บไว้</p>
                <p>แชทที่จบแล้วจะปรากฏที่นี่</p>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="no-archives">
                <p>ไม่พบผลลัพธ์</p>
              </div>
            ) : (
              <div className="archived-list">
                {filteredChannels.map((channelName) => {
                  const channelArchives = groupedByChannel[channelName];
                  const totalMessages = channelArchives.reduce((sum, archive) => sum + archive.messageCount, 0);

                  return (
                    <div
                      key={channelName}
                      className="archived-item"
                      onClick={() => setSelectedChannel(channelName)}
                    >
                      <div className="archived-header">
                        <span className="archived-channel">{channelName}</span>
                        <span className="archived-date">
                          {channelArchives.length} แชท
                        </span>
                      </div>
                      <div className="archived-info">
                        <span className="message-count">📨 {totalMessages} ข้อความ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <button
                onClick={() => {
                  setSelectedChannel(null);
                  setSelectedArchive(null);
                  setMessages([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  padding: '5px'
                }}
              >
                ←
              </button>
              <h2 style={{ margin: 0 }}>{selectedChannel}</h2>
            </div>

            <div className="archived-list">
              {chatsInSelectedChannel.map((archive) => (
                <div
                  key={archive.id}
                  className={`archived-item ${selectedArchive?.id === archive.id ? 'active' : ''}`}
                  onClick={() => fetchArchivedMessages(archive.id)}
                >
                  <div className="archived-header">
                    <span className="archived-channel">
                      {archive.userName || 'ไม่มีชื่อ'}
                    </span>
                    <span className="archived-date">
                      {new Date(archive.archivedAt).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="archived-info">
                    <span className="message-count">📨 {archive.messageCount} ข้อความ</span>
                  </div>
                  {archive.note && (
                    <div className="archived-note">
                      📝 {archive.note}
                    </div>
                  )}
                  <button
                    className="btn-restore"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestoreConversation(archive.id);
                    }}
                    title="นำแชทกลับมา"
                  >
                    ↩️ นำกลับ
                  </button>
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(archive.id);
                    }}
                    title="ลบถาวร"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="archived-main">
        {!selectedArchive ? (
          <div className="archived-empty">
            <h3>เลือกแชทที่เก็บไว้เพื่อดูข้อความ</h3>
            <p>เลือกแชทจากรายการด้านซ้าย</p>
          </div>
        ) : (
          <>
            <div className="archived-chat-header">
              <div>
                <h3>แชทที่เก็บไว้</h3>
                <span className="archive-info-text">
                  Channel: {selectedArchive.channelName} |
                  เก็บเมื่อ: {new Date(selectedArchive.archivedAt).toLocaleString('th-TH')}
                </span>
              </div>
              <div className="header-actions">
                <button
                  className="btn-restore-large"
                  onClick={() => handleRestoreConversation(selectedArchive.id)}
                >
                  ↩️ นำกลับมาใช้งาน
                </button>
                <button
                  className="btn-delete-large"
                  onClick={() => handleDeleteConversation(selectedArchive.id)}
                >
                  🗑️ ลบถาวร
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-messages">
                <p>กำลังโหลดข้อความ...</p>
              </div>
            ) : (
              <div className="archived-messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>ไม่มีข้อความในแชทนี้</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.type === 'sent' ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">
                          {renderMessageContent(msg)}
                        </div>
                        <div className="message-time">
                          {new Date(msg.timestamp).toLocaleString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ArchivedChats;
