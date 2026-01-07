import React, { useState, useEffect } from 'react';
import './QuickReplies.css';
import { config } from '../config';

function QuickReplies({ currentUser }) {
  const [quickReplies, setQuickReplies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'ทั่วไป',
    messageType: 'text',
    imageUrl: '',
    stickerPackageId: '',
    stickerId: '',
    sortOrder: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchQuickReplies();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchQuickReplies = async () => {
    try {
      const url = selectedCategory === 'all'
        ? `${config.API_BASE_URL}/api/quick-replies?userId=${currentUser.id}`
        : `${config.API_BASE_URL}/api/quick-replies?userId=${currentUser.id}&category=${selectedCategory}`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setQuickReplies(data.quickReplies);
      }
    } catch (err) {
      console.error('Error fetching quick replies:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/quick-replies/categories?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchQuickReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingId
        ? `${config.API_BASE_URL}/api/quick-replies/${editingId}`
        : `${config.API_BASE_URL}/api/quick-replies`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
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
        setMessage({
          type: 'success',
          text: editingId ? '✅ แก้ไขชุดคำตอบสำเร็จ' : '✅ เพิ่มชุดคำตอบสำเร็จ'
        });
        resetForm();
        fetchQuickReplies();
        fetchCategories();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: '❌ ' + data.message });
      }
    } catch (err) {
      console.error('Error saving quick reply:', err);
      setMessage({ type: 'error', text: '❌ เกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quickReply) => {
    setFormData({
      title: quickReply.title,
      message: quickReply.message,
      category: quickReply.category,
      messageType: quickReply.messageType,
      imageUrl: quickReply.imageUrl || '',
      stickerPackageId: quickReply.stickerPackageId || '',
      stickerId: quickReply.stickerId || '',
      sortOrder: quickReply.sortOrder || 0
    });
    setEditingId(quickReply.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันการลบชุดคำตอบนี้?')) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/quick-replies/${id}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ ลบชุดคำตอบสำเร็จ' });
        fetchQuickReplies();
        fetchCategories();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: '❌ ' + data.message });
      }
    } catch (err) {
      console.error('Error deleting quick reply:', err);
      setMessage({ type: 'error', text: '❌ เกิดข้อผิดพลาด' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      category: 'ทั่วไป',
      messageType: 'text',
      imageUrl: '',
      stickerPackageId: '',
      stickerId: '',
      sortOrder: 0
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: '✅ คัดลอกข้อความแล้ว' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const filteredQuickReplies = quickReplies.filter(qr =>
    qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="quick-replies-container">
      <div className="quick-replies-header">
        <h2>📝 ชุดคำตอบสำเร็จรูป</h2>
        <button
          className="btn-add-new"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + เพิ่มชุดคำตอบ
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="quick-reply-form-overlay">
          <div className="quick-reply-form-modal">
            <div className="modal-header">
              <h3>{editingId ? 'แก้ไขชุดคำตอบ' : 'เพิ่มชุดคำตอบใหม่'}</h3>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ชื่อชุดคำตอบ *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น ทักทายลูกค้า, สอบถามข้อมูล"
                  required
                />
              </div>

              <div className="form-group">
                <label>หมวดหมู่</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="เช่น ทักทาย, สอบถามข้อมูล, ปิดการขาย"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat.category} />
                  ))}
                  <option value="ทักทาย" />
                  <option value="สอบถามข้อมูล" />
                  <option value="ปิดการขาย" />
                  <option value="ขอบคุณ" />
                  <option value="ปิดการสนทนา" />
                </datalist>
              </div>

              <div className="form-group">
                <label>ประเภทข้อความ</label>
                <select
                  value={formData.messageType}
                  onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                >
                  <option value="text">ข้อความ (Text)</option>
                  <option value="image">รูปภาพ (Image)</option>
                  <option value="sticker">สติกเกอร์ (Sticker)</option>
                </select>
              </div>

              {formData.messageType === 'text' && (
                <div className="form-group">
                  <label>ข้อความ *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="พิมพ์ข้อความที่ต้องการตอบ..."
                    rows="4"
                    required
                  />
                </div>
              )}

              {formData.messageType === 'image' && (
                <>
                  <div className="form-group">
                    <label>URL รูปภาพ *</label>
                    <input
                      type="url"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>
                  <div className="form-note">
                    ⚠️ ต้องเป็น URL ที่เข้าถึงได้จากภายนอก (ไม่ใช่ localhost)
                  </div>
                </>
              )}

              {formData.messageType === 'sticker' && (
                <>
                  <div className="form-group">
                    <label>Package ID *</label>
                    <input
                      type="text"
                      value={formData.stickerPackageId}
                      onChange={(e) => setFormData({ ...formData, stickerPackageId: e.target.value })}
                      placeholder="เช่น 11537"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Sticker ID *</label>
                    <input
                      type="text"
                      value={formData.stickerId}
                      onChange={(e) => setFormData({ ...formData, stickerId: e.target.value })}
                      placeholder="เช่น 52002734"
                      required
                    />
                  </div>
                  <div className="form-note">
                    💡 ดูรายการสติกเกอร์ได้ที่ <a href="https://developers.line.biz/en/docs/messaging-api/sticker-list/" target="_blank" rel="noopener noreferrer">LINE Sticker List</a>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>ลำดับการแสดงผล</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มชุดคำตอบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="quick-replies-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 ค้นหาชุดคำตอบ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter">
          <label>หมวดหมู่:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">ทั้งหมด ({quickReplies.length})</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat.category}>
                {cat.category} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="quick-replies-list">
        {filteredQuickReplies.length === 0 ? (
          <div className="empty-state">
            <p>📭 ยังไม่มีชุดคำตอบ</p>
            <button className="btn-add-first" onClick={() => setShowForm(true)}>
              เพิ่มชุดคำตอบแรก
            </button>
          </div>
        ) : (
          filteredQuickReplies.map((qr) => (
            <div key={qr.id} className="quick-reply-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="category-badge">{qr.category}</span>
                  <h3>{qr.title}</h3>
                </div>
                <div className="card-actions">
                  <button
                    className="btn-icon btn-copy"
                    onClick={() => handleCopyToClipboard(qr.message)}
                    title="คัดลอกข้อความ"
                  >
                    📋
                  </button>
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(qr)}
                    title="แก้ไข"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(qr.id)}
                    title="ลบ"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div className="message-type">
                  {qr.messageType === 'text' && '💬 ข้อความ'}
                  {qr.messageType === 'image' && '🖼️ รูปภาพ'}
                  {qr.messageType === 'sticker' && '😊 สติกเกอร์'}
                </div>

                {qr.messageType === 'text' && (
                  <div className="message-preview">{qr.message}</div>
                )}

                {qr.messageType === 'image' && (
                  <div className="message-preview">
                    <img src={qr.message} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                  </div>
                )}

                {qr.messageType === 'sticker' && (
                  <div className="message-preview">
                    Package: {qr.stickerPackageId} / Sticker: {qr.stickerId}
                  </div>
                )}

                <div className="card-meta">
                  <span>ลำดับ: {qr.sortOrder}</span>
                  <span>สร้างเมื่อ: {new Date(qr.createdAt).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default QuickReplies;
