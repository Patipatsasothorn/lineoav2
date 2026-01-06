import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

function Chat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // เพิ่มสำหรับค้นหา
  const [groups, setGroups] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false); // สำหรับ mobile navigation
  const [licenseStatus, setLicenseStatus] = useState(null); // สถานะ license
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  const fileInputRef = useRef(null);

  // ฟังก์ชันสร้างสีจากชื่อ Line OA (ให้สีต่างกันแต่ละ Line OA)
  const getColorForChannel = (channelName) => {
    if (!channelName) return '#2d3748'; // สีเริ่มต้น

    // สร้าง hash จากชื่อ
    let hash = 0;
    for (let i = 0; i < channelName.length; i++) {
      hash = channelName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // แปลง hash เป็นสี (เลือกสีที่สวยและอ่านง่าย)
    const colors = [
      '#e53e3e', // แดง
      '#dd6b20', // ส้ม
      '#d69e2e', // เหลือง-ทอง
      '#38a169', // เขียว
      '#319795', // เขียวน้ำเงิน
      '#3182ce', // น้ำเงิน
      '#5a67d8', // ม่วงน้ำเงิน
      '#805ad5', // ม่วง
      '#d53f8c', // ชมพู
      '#c53030', // แดงเข้ม
      '#2f855a', // เขียวเข้ม
      '#2c5282', // น้ำเงินเข้ม
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (currentUser) {
      fetchChannels();
      fetchMessages();
      fetchGroups();
      fetchLicenseStatus(); // ตรวจสอบสถานะ license
    }
    // เชื่อมต่อ SSE สำหรับ real-time updates
    eventSourceRef.current = new EventSource('http://localhost:5000/api/messages/stream');
    
    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        // เพิ่มข้อความใหม่ท้าย array (เก่า -> ใหม่)
        setMessages(prevMessages => {
          const newMessages = [...prevMessages, data.message];
          return newMessages.sort((a, b) => a.timestamp - b.timestamp);
        });
        
        // เล่นเสียงแจ้งเตือน (optional)
        playNotificationSound();
      }
    };
    
    eventSourceRef.current.onerror = (error) => {
      console.error('SSE Error:', error);
    };
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  const playNotificationSound = () => {
    // สร้างเสียงแจ้งเตือนง่ายๆ
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe87OWYSgwNUKzn77FdGAU7k9nxxnMoCSpzy/DajTwJE2Cx6uajUxELTKXh7rRfGgY+kdTvxHUpBylvyO7ZjTwJElyx6+mjUxELTKTh7bRfGgU9kdTvxHQoBylvyO7YjTsJEltw6+mjUxAKTKTh7bRfGgU9kdTuxHQoByhwyO3YjTwJEltw6+mjUhAKTKTh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKTKPh7bRfGgU8kdPvxHUoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvxHQoByhvx+3YjTsJEltw6+mjUhAKS6Pg7bRfGgU8kdPvw=');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChannels = async () => {
    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const response = await fetch(`http://localhost:5000/api/channels?${param}`);
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const response = await fetch(`http://localhost:5000/api/messages?${param}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setGroups(data.groups);
        console.log('✓ Loaded groups:', data.groups.length);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const fetchLicenseStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/license/status?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setLicenseStatus(data);
      }
    } catch (error) {
      console.error('Error fetching license status:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!selectedUser || !selectedChannel) {
      return;
    }

    // ต้องมีข้อความหรือรูปภาพ
    if (!messageText.trim() && !selectedImage) {
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      
      // ถ้ามีรูปภาพ ให้ upload ก่อน
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        
        const uploadResponse = await fetch('http://localhost:5000/api/upload/image', {
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadData.success) {
          alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + uploadData.message);
          setLoading(false);
          return;
        }
        
        imageUrl = uploadData.imageUrl;
      }

      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannel,
          userId: selectedUser,
          text: messageText || '[รูปภาพ]',
          messageType: imageUrl ? 'image' : 'text',
          imageUrl: imageUrl,
          senderId: currentUser.id // ✨ เพิ่ม senderId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageText('');
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        // ตรวจสอบว่าเป็น error จาก license หรือไม่
        if (data.code === 'LICENSE_EXPIRED') {
          alert('⚠️ License หมดอายุ\n\nคุณไม่สามารถส่งข้อความได้\nกรุณาเปิดใช้งาน License ในหน้าตั้งค่า');
        } else {
          alert('ส่งข้อความไม่สำเร็จ: ' + data.message);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB');
        return;
      }
      
      setSelectedImage(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendSticker = async (packageId, stickerId) => {
    if (!selectedUser || !selectedChannel) {
      return;
    }

    setLoading(true);
    setShowStickerPicker(false);

    try {
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannel,
          userId: selectedUser,
          text: `[สติกเกอร์: ${packageId}/${stickerId}]`,
          messageType: 'sticker',
          stickerPackageId: packageId,
          stickerId: stickerId,
          senderId: currentUser.id // ✨ เพิ่ม senderId
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.code === 'LICENSE_EXPIRED') {
          alert('⚠️ License หมดอายุ\n\nคุณไม่สามารถส่งข้อความได้\nกรุณาเปิดใช้งาน License ในหน้าตั้งค่า');
        } else {
          alert('ส่งสติกเกอร์ไม่สำเร็จ: ' + data.message);
        }
      }
    } catch (err) {
      console.error('Error sending sticker:', err);
      alert('เกิดข้อผิดพลาดในการส่งสติกเกอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (userId, channelId) => {
    setSelectedUser(userId);
    setSelectedChannel(channelId);
    setShowMobileChat(true); // แสดงหน้าแชทบนมือถือ
    
    // ทำเครื่องหมายว่าอ่านแล้ว (เฉพาะ conversation นี้)
    try {
      // เรียก API เพื่อบันทึกลง Backend
      await fetch('http://localhost:5000/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          channelId 
        }),
      });
      
      // อัปเดต state ใน Frontend
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.userId === userId && msg.channelId === channelId && msg.type === 'received' 
            ? { ...msg, read: true } 
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // ฟังก์ชันแสดงเนื้อหาข้อความ (รองรับรูปภาพและสติกเกอร์)
  const renderMessageContent = (msg) => {
    // ถ้าเป็นรูปภาพ
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
          <span style={{display: 'none'}}>[รูปภาพ]</span>
        </div>
      );
    }
    
    // ถ้าเป็นสติกเกอร์
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
          <span style={{display: 'none'}}>{msg.text}</span>
        </div>
      );
    }
    
    // ตรวจสอบ text pattern สำหรับสติกเกอร์ (backward compatibility)
    const stickerMatch = msg.text.match(/\[สติกเกอร์: (\d+)\/(\d+)\]/);
    if (stickerMatch) {
      const stickerId = stickerMatch[2];
      const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;
      
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
          <span style={{display: 'none'}}>{msg.text}</span>
        </div>
      );
    }
    
    // ถ้าเป็นข้อความธรรมดา
    return msg.text;
  };

  // จัดกลุ่มข้อความตาม userId + channelId (แยกตาม Channel)
  const groupedMessages = messages.reduce((acc, msg) => {
    const conversationKey = `${msg.userId}_${msg.channelId}`; // แยกตาม User + Channel
    if (!acc[conversationKey]) {
      acc[conversationKey] = [];
    }
    acc[conversationKey].push(msg);
    return acc;
  }, {});

  // เรียงข้อความในแต่ละกลุ่มจากใหม่ไปเก่า (เพื่อให้ [0] เป็นล่าสุด)
  Object.keys(groupedMessages).forEach(key => {
    groupedMessages[key].sort((a, b) => b.timestamp - a.timestamp);
  });

  // เรียงรายการสนทนาตามข้อความล่าสุด (ใหม่ไปเก่า)
  const sortedConversations = Object.entries(groupedMessages).sort((a, b) => {
    const lastMessageA = a[1][0];
    const lastMessageB = b[1][0];
    return lastMessageB.timestamp - lastMessageA.timestamp;
  });

  // กรอง conversations ตาม searchQuery
const filteredConversations = sortedConversations.filter(([conversationKey, userMessages]) => {
  const lastMessage = userMessages[0];
  const searchLower = searchQuery.toLowerCase();
  
  // ✅ เช็คว่าค่าต่างๆ ไม่เป็น undefined/null ก่อน toLowerCase()
  const userName = (lastMessage.userName || '').toLowerCase();
  const channelName = (lastMessage.channelName || '').toLowerCase();
  const messageText = (lastMessage.text || '').toLowerCase();
  
  // ค้นหาจาก: ชื่อผู้ใช้, ชื่อ Channel, หรือข้อความล่าสุด
  return (
    userName.includes(searchLower) ||
    channelName.includes(searchLower) ||
    messageText.includes(searchLower)
  );
});

  // นับจำนวนข้อความที่ยังไม่อ่าน (ตาม conversationKey)
  const getUnreadCount = (conversationKey) => {
    const [userId, channelId] = conversationKey.split('_');
    return messages.filter(msg => 
      msg.userId === userId && 
      msg.channelId === channelId &&
      msg.type === 'received' && 
      !msg.read
    ).length;
  };

  // กรองข้อความตามที่เลือก และเรียงจากเก่าไปใหม่
  const filteredMessages = selectedUser && selectedChannel
    ? messages.filter(msg => msg.userId === selectedUser && msg.channelId === selectedChannel)
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];
    // สร้างกลุ่มใหม่
    const handleCreateGroup = async () => {
      if (!groupName.trim()) {
        alert('กรุณาใส่ชื่อกลุ่ม');
        return;
      }
      
      if (selectedConversations.length === 0) {
        alert('กรุณาเลือกอย่างน้อย 1 conversation');
        return;
      }
      
      try {
        const response = await fetch('http://localhost:5000/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupName,
            conversations: selectedConversations,
            userId: currentUser.id
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setGroups([...groups, data.group]);
          setShowGroupModal(false);
          setGroupName('');
          setSelectedConversations([]);
          setSelectionMode(false);
          alert('สร้างกลุ่มสำเร็จ!');
        }
      } catch (error) {
        alert('เกิดข้อผิดพลาด');
        console.error(error);
      }
    };

    // ลบกลุ่ม
    const handleDeleteGroup = async (groupId) => {
      if (!window.confirm('ต้องการลบกลุ่มนี้?')) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/groups/${groupId}?userId=${currentUser.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setGroups(groups.filter(g => g.id !== groupId));
          alert('ลบกลุ่มสำเร็จ');
        }
      } catch (error) {
        alert('เกิดข้อผิดพลาด');
      }
    };

    // Toggle การเลือก conversation
    const handleToggleConversation = (userId, channelId) => {
      const conversationKey = { userId, channelId };
      const exists = selectedConversations.some(
        c => c.userId === userId && c.channelId === channelId
      );
      
      if (exists) {
        setSelectedConversations(selectedConversations.filter(
          c => !(c.userId === userId && c.channelId === channelId)
        ));
      } else {
        setSelectedConversations([...selectedConversations, conversationKey]);
      }
    };

    // Toggle Expand กลุ่ม
    const handleToggleGroup = (groupId) => {
      const newExpanded = new Set(expandedGroups);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      setExpandedGroups(newExpanded);
    };

    // เช็คว่า conversation อยู่ในกลุ่มไหม
    const isInGroup = (userId, channelId) => {
      return groups.some(group => 
        group.conversations.some(c => 
          c.userId === userId && c.channelId === channelId
        )
      );
    };

    // หากลุ่มที่ conversation อยู่
    const getGroupForConversation = (userId, channelId) => {
      return groups.find(group =>
        group.conversations.some(c =>
          c.userId === userId && c.channelId === channelId
        )
      );
    };

    // ฟังก์ชันกลับไปรายการแชท (สำหรับมือถือ)
    const handleBackToList = () => {
      setShowMobileChat(false);
    };

  return (
    <div className="chat-container">
      <div className={`chat-sidebar ${showMobileChat ? 'hidden' : ''}`}>
        <h2>การสนทนา</h2>

        {/* Search Box */}
        <div className="search-box">
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ ข้อความ..."
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
                <div className="group-actions">
          {!selectionMode ? (
            <button 
              className="btn-selection-mode"
              onClick={() => setSelectionMode(true)}
            >
              จัดกลุ่ม
            </button>
          ) : (
            <div className="selection-mode-buttons">
              <button 
                className="btn-create-group"
                onClick={() => setShowGroupModal(true)}
                disabled={selectedConversations.length === 0}
              >
                สร้างกลุ่ม ({selectedConversations.length})
              </button>
              <button 
                className="btn-cancel"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedConversations([]);
                }}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
        {channels.length === 0 ? (
          <div className="no-channels">
            <p>ยังไม่มี LINE Channel</p>
            <p>กรุณาเพิ่ม Channel ในหน้าหลัก</p>
          </div>
        ) : (
          <>
            {Object.keys(groupedMessages).length === 0 ? (
              <div className="no-messages">
                <p>ยังไม่มีข้อความ</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="no-messages">
                <p>ไม่พบผลลัพธ์</p>
                <p>ลองค้นหาด้วยคำอื่น</p>
              </div>
            ) : (
          <div className="conversations-list">
                      {/* แสดงกลุ่มก่อน */}
  {groups.map(group => {
    const isExpanded = expandedGroups.has(group.id);
    
    return (
      <div key={`group-${group.id}`} className="conversation-group">
        <div className="group-header" onClick={() => handleToggleGroup(group.id)}>
          <span className="group-icon">{isExpanded ? '📂' : '📁'}</span>
          <span className="group-name">{group.name}</span>
          <span className="group-count">({group.conversations.length})</span>
          <button 
            className="btn-delete-group"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteGroup(group.id);
            }}
          >
            ✕
          </button>
        </div>
        
        {isExpanded && (
          <div className="group-conversations">
            {group.conversations.map(({ userId, channelId }) => {
              const messages = filteredConversations.find(
                ([key]) => key === `${userId}_${channelId}`
              );
              if (!messages) return null;
              
              const [_, userMessages] = messages;
              const lastMessage = userMessages[0];
              const receivedMessage = userMessages.find(msg => msg.type === 'received');
              const displayName = receivedMessage ? receivedMessage.userName : lastMessage.userName;
              
              return (
                <div 
                  key={`${userId}_${channelId}`}
                  className={`conversation-item grouped ${selectedUser === userId && selectedChannel === channelId ? 'active' : ''}`}
                  onClick={() => {
                    if (!selectionMode) {
                      handleSelectConversation(userId, channelId);
                    }
                  }}
                >
                  {selectionMode && (
                    <input
                      type="checkbox"
                      className="conversation-checkbox"
                      checked={selectedConversations.some(
                        c => c.userId === userId && c.channelId === channelId
                      )}
                      onChange={() => handleToggleConversation(userId, channelId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="conversation-header">
                    <span className="user-name">
                      {displayName}
                    </span>
                    <span className="channel-badge" style={{ background: getColorForChannel(lastMessage.channelName) }}>
                      {lastMessage.channelName}
                    </span>
                  </div>
                  <div className="last-message">
                    {lastMessage.text.substring(0, 30)}...
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
  
  {/* แสดง conversations ที่ไม่มีกลุ่ม */}
    {filteredConversations
      .filter(([conversationKey]) => {
        const [userId, channelId] = conversationKey.split('_');
        return !isInGroup(userId, channelId);
      })
      .map(([conversationKey, userMessages]) => {
        const lastMessage = userMessages[0];
        const unreadCount = getUnreadCount(conversationKey);
        const receivedMessage = userMessages.find(msg => msg.type === 'received');
        const displayName = receivedMessage ? receivedMessage.userName : lastMessage.userName;
        const [userId, channelId] = conversationKey.split('_');
        
        return (
          <div 
            key={conversationKey}
            className={`conversation-item ${selectedUser === lastMessage.userId && selectedChannel === lastMessage.channelId ? 'active' : ''}`}
            onClick={() => {
              if (!selectionMode) {
                handleSelectConversation(lastMessage.userId, lastMessage.channelId);
              }
            }}
          >
            {selectionMode && (
              <input
                type="checkbox"
                className="conversation-checkbox"
                checked={selectedConversations.some(
                  c => c.userId === userId && c.channelId === channelId
                )}
                onChange={() => handleToggleConversation(userId, channelId)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="conversation-header">
              <span className="user-name">
                {displayName}
              </span>
              <div className="conversation-meta">
                <span className="channel-badge" style={{ background: getColorForChannel(lastMessage.channelName) }}>
                  {lastMessage.channelName}
                </span>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
            </div>
            <div className="last-message">
              {lastMessage.text.substring(0, 50)}
              {lastMessage.text.length > 50 ? '...' : ''}
            </div>
            <div className="message-time">
              {new Date(lastMessage.timestamp).toLocaleString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        );
      })}
  </div>
            )}
          </>
        )}
      </div>

      <div className="chat-main">
        {!selectedUser ? (
          <div className="chat-empty">
            <h3>เลือกการสนทนาเพื่อเริ่มแชท</h3>
            <p>เลือกผู้ใช้จากรายการด้านซ้าย</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="mobile-back-button" onClick={handleBackToList}>
                ←
              </button>
              <div>
                <h3>
                  แชทกับ {filteredMessages[0]?.userName || 'User'}
                </h3>
                <span className="channel-info">
                  Channel: {filteredMessages[0]?.channelName}
                </span>
              </div>
            </div>

            {/* License Warning Banner */}
            {currentUser.role !== 'admin' && !licenseStatus?.isValid && (
              <div className="license-warning-banner">
                <div className="warning-content">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-text">
                    <strong>License หมดอายุ!</strong>
                    <p>คุณไม่สามารถส่งข้อความได้ กรุณาเปิดใช้งาน License ใหม่</p>
                  </div>
                </div>
                <button 
                  className="btn-goto-settings" aria-readonly
                  onClick={() => window.location.hash = '#settings' }
                >
                  ไปหน้าตั้งค่า →
                </button>
              </div>
            )}

            <div className="messages-container">
              {filteredMessages.map((msg) => (
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
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              
              <button 
                type="button" 
                className="btn-attach"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || (currentUser.role !== 'admin' && !licenseStatus?.isValid)}
                title="แนบรูปภาพ"
              >
                📎
              </button>
              
              <button 
                type="button" 
                className="btn-sticker"
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                disabled={loading || (currentUser.role !== 'admin' && !licenseStatus?.isValid)}
                title="ส่งสติกเกอร์"
              >
                😊
              </button>
              
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="btn-remove-image"
                    onClick={handleRemoveImage}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  currentUser.role !== 'admin' && !licenseStatus?.isValid
                    ? "License หมดอายุ - ไม่สามารถส่งข้อความได้"
                    : "พิมพ์ข้อความ..."
                }
                disabled={loading || (currentUser.role !== 'admin' && !licenseStatus?.isValid)}
              />
              <button 
                type="submit" 
                disabled={loading || (!messageText.trim() && !selectedImage) || (currentUser.role !== 'admin' && !licenseStatus?.isValid)}
              >
                {loading ? 'กำลังส่ง...' : 'ส่ง'}
              </button>
            </form>
            
            {showStickerPicker && (
              <div className="sticker-picker">
                <div className="sticker-picker-header">
                  <span>เลือกสติกเกอร์</span>
                  <button onClick={() => setShowStickerPicker(false)}>✕</button>
                </div>
                <div className="sticker-grid">
                  {/* LINE Sticker Package 11537 (Brown & Cony) - Official Free Stickers */}
                  {[
                    { packageId: '11537', stickerId: '52002734' },
                    { packageId: '11537', stickerId: '52002735' },
                    { packageId: '11537', stickerId: '52002736' },
                    { packageId: '11537', stickerId: '52002737' },
                    { packageId: '11537', stickerId: '52002738' },
                    { packageId: '11537', stickerId: '52002739' },
                    { packageId: '11537', stickerId: '52002740' },
                    { packageId: '11537', stickerId: '52002741' },
                    { packageId: '11537', stickerId: '52002742' },
                    { packageId: '11537', stickerId: '52002743' },
                    { packageId: '11537', stickerId: '52002744' },
                    { packageId: '11537', stickerId: '52002745' },
                    { packageId: '11537', stickerId: '52002746' },
                    { packageId: '11537', stickerId: '52002747' },
                    { packageId: '11537', stickerId: '52002748' },
                    { packageId: '11537', stickerId: '52002749' },
                    { packageId: '11537', stickerId: '52002750' },
                    { packageId: '11537', stickerId: '52002751' },
                    { packageId: '11537', stickerId: '52002752' },
                    { packageId: '11537', stickerId: '52002753' }
                  ].map((sticker, index) => (
                    <div 
                      key={index} 
                      className="sticker-item"
                      onClick={() => handleSendSticker(sticker.packageId, sticker.stickerId)}
                    >
                      <img 
                        src={`https://stickershop.line-scdn.net/stickershop/v1/sticker/${sticker.stickerId}/android/sticker.png`}
                        alt={`Sticker ${index + 1}`}
                        onError={(e) => {
                          e.target.style.opacity = '0.3';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Modal สร้างกลุ่ม */}
        {showGroupModal && (
          <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>สร้างกลุ่มใหม่</h3>
              <p>เลือก {selectedConversations.length} conversation(s)</p>
              <input
                type="text"
                className="group-name-input"
                placeholder="ชื่อกลุ่ม (เช่น VIP1)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
              />
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleCreateGroup}>
                  สร้าง
                </button>
                <button className="btn-cancel" onClick={() => setShowGroupModal(false)}>
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default Chat;