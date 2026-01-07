import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import './QuickRepliesManager.css';

function QuickRepliesManager({ currentUser }) {
  const [quickReplies, setQuickReplies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: '',
    messageType: 'text',
    imageUrl: '',
    stickerPackageId: '',
    stickerId: '',
    sortOrder: 0
  });

  useEffect(() => {
    if (currentUser) {
      fetchQuickReplies();
      fetchCategories();
    }
  }, [currentUser]);

  const fetchQuickReplies = async (category = 'all') => {
    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const categoryParam = category !== 'all' ? `&category=${encodeURIComponent(category)}` : '';
      const response = await fetch(`http://localhost:5000/api/quick-replies?${param}${categoryParam}`);
      const data = await response.json();
      if (data.success) {
        setQuickReplies(data.quickReplies);
      }
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดชุดคำตอบ');
    }
  };

  const fetchCategories = async () => {
    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const response = await fetch(`http://localhost:5000/api/quick-replies/categories?${param}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchQuickReplies(category);
  };

  const handleOpenModal = (reply = null) => {
    if (reply) {
      setEditingReply(reply);
      setFormData({
        title: reply.title,
        message: reply.message || '',
        category: reply.category,
        messageType: reply.messageType || 'text',
        imageUrl: reply.imageUrl || '',
        stickerPackageId: reply.stickerPackageId || '',
        stickerId: reply.stickerId || '',
        sortOrder: reply.sortOrder || 0
      });
    } else {
      setEditingReply(null);
      setFormData({
        title: '',
        message: '',
        category: '',
        messageType: 'text',
        imageUrl: '',
        stickerPackageId: '',
        stickerId: '',
        sortOrder: 0
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReply(null);
    setFormData({
      title: '',
      message: '',
      category: '',
      messageType: 'text',
      imageUrl: '',
      stickerPackageId: '',
      stickerId: '',
      sortOrder: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.category) {
      toast.error('กรุณากรอกชื่อและหมวดหมู่');
      return;
    }

    if (formData.messageType === 'text' && !formData.message) {
      toast.error('กรุณากรอกข้อความ');
      return;
    }

    if (formData.messageType === 'image' && !formData.imageUrl) {
      toast.error('กรุณากรอก URL รูปภาพ');
      return;
    }

    if (formData.messageType === 'sticker' && (!formData.stickerPackageId || !formData.stickerId)) {
      toast.error('กรุณากรอก Sticker Package ID และ Sticker ID');
      return;
    }

    try {
      const isAgent = currentUser.role === 'agent';
      const requestData = {
        ...formData,
        userId: currentUser.id,
        agentId: isAgent ? currentUser.id : null
      };

      const url = editingReply
        ? `http://localhost:5000/api/quick-replies/${editingReply.id}`
        : 'http://localhost:5000/api/quick-replies';

      const response = await fetch(url, {
        method: editingReply ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingReply ? 'แก้ไขชุดคำตอบสำเร็จ!' : 'เพิ่มชุดคำตอบสำเร็จ!');
        handleCloseModal();
        fetchQuickReplies(selectedCategory);
        fetchCategories();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving quick reply:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบชุดคำตอบนี้หรือไม่?')) {
      return;
    }

    try {
      const isAgent = currentUser.role === 'agent';
      const param = isAgent ? `agentId=${currentUser.id}` : `userId=${currentUser.id}`;
      const response = await fetch(`http://localhost:5000/api/quick-replies/${id}?${param}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ลบชุดคำตอบสำเร็จ!');
        fetchQuickReplies(selectedCategory);
        fetchCategories();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('คัดลอกข้อความแล้ว!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('คัดลอกไม่สำเร็จ');
    });
  };

  const filteredReplies = quickReplies.filter(qr =>
    qr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qr.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qr.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="quick-replies-manager">
      <div className="manager-header">
        <h1>📝 ชุดคำตอบสำเร็จรูป</h1>
        <button className="btn-add-reply" onClick={() => handleOpenModal()}>
          + เพิ่มชุดคำตอบ
        </button>
      </div>

      <div className="manager-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="ค้นหาชุดคำตอบ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            ทั้งหมด
            {selectedCategory === 'all' && <span className="count">({quickReplies.length})</span>}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              className={`category-btn ${selectedCategory === cat.category ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.category)}
            >
              {cat.category}
              <span className="count">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="replies-grid">
        {filteredReplies.length === 0 ? (
          <div className="no-replies">
            <p>ไม่พบชุดคำตอบ</p>
            <p>เพิ่มชุดคำตอบใหม่เพื่อเริ่มต้นใช้งาน</p>
          </div>
        ) : (
          filteredReplies.map((reply) => (
            <div key={reply.id} className="reply-card">
              <div className="card-header">
                <div className="card-title">
                  {reply.messageType === 'image' && '🖼️ '}
                  {reply.messageType === 'sticker' && '🎨 '}
                  {reply.title}
                </div>
                <div className="card-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleOpenModal(reply)}
                    title="แก้ไข"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(reply.id)}
                    title="ลบ"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="card-content">
                {reply.messageType === 'text' && (
                  <p className="message-text">{reply.message}</p>
                )}
                {reply.messageType === 'image' && (
                  <div className="message-image">
                    <img src={reply.imageUrl} alt="Preview" />
                  </div>
                )}
                {reply.messageType === 'sticker' && (
                  <div className="message-sticker">
                    <img
                      src={`https://stickershop.line-scdn.net/stickershop/v1/sticker/${reply.stickerId}/android/sticker.png`}
                      alt="Sticker"
                    />
                  </div>
                )}
              </div>
              <div className="card-footer">
                <span className="category-badge">{reply.category}</span>
                <button
                  className="btn-copy"
                  onClick={() => {
                    if (reply.messageType === 'text') {
                      copyToClipboard(reply.message);
                    } else if (reply.messageType === 'image') {
                      copyToClipboard(reply.imageUrl);
                    } else if (reply.messageType === 'sticker') {
                      copyToClipboard(`Sticker: ${reply.stickerPackageId}/${reply.stickerId}`);
                    }
                  }}
                >
                  📋 คัดลอก
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingReply ? 'แก้ไขชุดคำตอบ' : 'เพิ่มชุดคำตอบ'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>ชื่อชุดคำตอบ *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น: ทักทายลูกค้า"
                  required
                />
              </div>

              <div className="form-group">
                <label>หมวดหมู่ *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="เช่น: ทักทาย, ขอบคุณ, ขอโทษ"
                  required
                />
              </div>

              <div className="form-group">
                <label>ประเภทข้อความ</label>
                <select
                  value={formData.messageType}
                  onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                >
                  <option value="text">ข้อความ</option>
                  <option value="image">รูปภาพ</option>
                  <option value="sticker">สติกเกอร์</option>
                </select>
              </div>

              {formData.messageType === 'text' && (
                <div className="form-group">
                  <label>ข้อความ *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="พิมพ์ข้อความที่ต้องการ..."
                    rows="4"
                    required
                  ></textarea>
                </div>
              )}

              {formData.messageType === 'image' && (
                <div className="form-group">
                  <label>URL รูปภาพ *</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  {formData.imageUrl && (
                    <div className="image-preview">
                      <img src={formData.imageUrl} alt="Preview" />
                    </div>
                  )}
                </div>
              )}

              {formData.messageType === 'sticker' && (
                <>
                  <div className="form-group">
                    <label>Sticker Package ID *</label>
                    <input
                      type="text"
                      value={formData.stickerPackageId}
                      onChange={(e) => setFormData({ ...formData, stickerPackageId: e.target.value })}
                      placeholder="เช่น: 11537"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Sticker ID *</label>
                    <input
                      type="text"
                      value={formData.stickerId}
                      onChange={(e) => setFormData({ ...formData, stickerId: e.target.value })}
                      placeholder="เช่น: 52002734"
                      required
                    />
                  </div>
                  {formData.stickerId && (
                    <div className="sticker-preview">
                      <img
                        src={`https://stickershop.line-scdn.net/stickershop/v1/sticker/${formData.stickerId}/android/sticker.png`}
                        alt="Sticker Preview"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label>ลำดับการแสดง</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn-save">
                  {editingReply ? 'บันทึกการแก้ไข' : 'เพิ่มชุดคำตอบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickRepliesManager;
