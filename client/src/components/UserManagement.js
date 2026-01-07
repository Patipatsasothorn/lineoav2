import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import PromptDialog from './PromptDialog';
import './UserManagement.css';

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddLicense, setShowAddLicense] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState('');

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, data: null });
  const [promptDialog, setPromptDialog] = useState({ isOpen: false, action: null, data: null });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchUsers();
    fetchLicenses();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users?adminUserId=${currentUser.id}`);
      const data = await response.json();
      console.log('📦 Users data:', data); // Debug log
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLicenses = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/licenses?adminUserId=${currentUser.id}`);
      const data = await response.json();
      console.log('📦 Licenses data:', data); // Debug log
      if (data.success) {
        setLicenses(data.licenses);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    }
  };

  const handleChangeRole = (userId, newRole) => {
    setConfirmDialog({
      isOpen: true,
      action: 'changeRole',
      data: { userId, newRole }
    });
  };

  const confirmChangeRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          adminUserId: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('เปลี่ยน Role สำเร็จ');
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleResetPassword = (userId) => {
    setPromptDialog({
      isOpen: true,
      action: 'resetPassword',
      data: { userId }
    });
  };

  const confirmResetPassword = async (userId, newPassword) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: newPassword,
          adminUserId: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('รีเซ็ตรหัสผ่านสำเร็จ');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleDeleteUser = (userId, username) => {
    setConfirmDialog({
      isOpen: true,
      action: 'deleteUser',
      data: { userId, username }
    });
  };

  const confirmDeleteUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}?adminUserId=${currentUser.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('ลบผู้ใช้สำเร็จ');
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleAddLicense = async (userId) => {
    if (!selectedLicense) {
      toast.error('กรุณาเลือก License Key');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/add-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: selectedLicense,
          adminUserId: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('เพิ่ม License สำเร็จ');
        setShowAddLicense(null);
        setSelectedLicense('');
        fetchUsers();
        fetchLicenses();
      } else {
        toast.error('' + data.message);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const getStatusBadge = (user) => {
    if (!user.licenseKey) {
      return <span className="status-badge no-license">ไม่มี License</span>;
    }
    if (user.isLicenseValid) {
      return <span className="status-badge active">ใช้งานได้</span>;
    }
    return <span className="status-badge expired">หมดอายุ</span>;
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span className="role-badge admin">Admin</span>;
    }
    return <span className="role-badge user">User</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH');
  };

  const getUnusedLicenses = () => {
    return licenses.filter(l => l.status === 'unused');
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handleDialogConfirm = () => {
    const { action, data } = confirmDialog;
    if (action === 'changeRole') {
      confirmChangeRole(data.userId, data.newRole);
    } else if (action === 'deleteUser') {
      confirmDeleteUser(data.userId);
    }
    setConfirmDialog({ isOpen: false, action: null, data: null });
  };

  const handlePromptConfirm = (value) => {
    const { action, data } = promptDialog;
    if (action === 'resetPassword') {
      confirmResetPassword(data.userId, value);
    }
    setPromptDialog({ isOpen: false, action: null, data: null });
  };

  const getConfirmDialogProps = () => {
    const { action, data } = confirmDialog;
    if (action === 'changeRole') {
      return {
        title: 'ยืนยันการเปลี่ยน Role',
        message: `แน่ใจหรือไม่ที่จะเปลี่ยน role เป็น ${data.newRole}?`,
        type: 'question'
      };
    } else if (action === 'deleteUser') {
      return {
        title: 'ยืนยันการลบผู้ใช้',
        message: `แน่ใจหรือไม่ที่จะลบผู้ใช้ "${data.username}"?\n\n⚠️ การกระทำนี้ไม่สามารถยกเลิกได้`,
        type: 'danger',
        confirmText: 'ลบผู้ใช้'
      };
    }
    return {};
  };

  return (
    <div className="user-management">
      <div className="user-header">
        <h2>👥 จัดการบัญชีผู้ใช้</h2>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">ทั้งหมด</span>
            <span className="stat-value">{users.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Admin</span>
            <span className="stat-value">{users.filter(u => u.role === 'admin').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">User</span>
            <span className="stat-value">{users.filter(u => u.role === 'user').length}</span>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>License Status</th>
              <th>License Key</th>
              <th>วันหมดอายุ</th>
              <th>วันที่สร้าง</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  ไม่มีผู้ใช้
                </td>
              </tr>
            ) : (
              currentUsers.map(user => (
                <tr key={user.id}>
                  <td data-label="Username">
                    <strong>{user.username}</strong>
                    {user.id === currentUser.id && <span className="you-badge">You</span>}
                  </td>
                  <td data-label="Role">{getRoleBadge(user.role)}</td>
                  <td data-label="License Status">{getStatusBadge(user)}</td>
                  <td data-label="License Key">
                    {user.licenseKey ? (
                      <code className="license-key">{user.licenseKey}</code>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td data-label="วันหมดอายุ">{formatDate(user.licenseExpiry)}</td>
                  <td data-label="วันที่สร้าง">{formatDate(user.createdAt)}</td>
                  <td data-label="จัดการ">
                    <div className="action-buttons">
                      {user.id !== currentUser.id && (
                        <>
                          <button
                            className="btn-action"
                            onClick={() => handleChangeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                            title="เปลี่ยน Role"
                          >
                            🔄 เปลี่ยน Role
                          </button>
                          <button
                            className="btn-action"
                            onClick={() => handleResetPassword(user.id)}
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            🔑 รีเซ็ตรหัสผ่าน
                          </button>
                          <button
                            className="btn-action btn-license"
                            onClick={() => setShowAddLicense(user.id)}
                            title="เพิ่ม License"
                          >
                            ➕ เพิ่ม License
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            title="ลบผู้ใช้"
                          >
                            🗑️ ลบผู้ใช้
                          </button>
                        </>
                      )}
                    </div>
                    {showAddLicense === user.id && (
                      <div className="license-select-modal">
                        <h4>เลือก License Key</h4>
                        <select 
                          value={selectedLicense} 
                          onChange={(e) => setSelectedLicense(e.target.value)}
                        >
                          <option value="">-- เลือก License --</option>
                          {getUnusedLicenses().map(license => (
                            <option key={license.id} value={license.licenseKey}>
                              {license.licenseKey} (
                              {license.durationYears && `${license.durationYears}ปี `}
                              {license.durationMonths && `${license.durationMonths}เดือน `}
                              {license.durationDays && `${license.durationDays}วัน `}
                              {license.durationMinutes && `${license.durationMinutes}นาที`}
                              )
                            </option>
                          ))}
                        </select>
                        <div className="modal-buttons">
                          <button 
                            className="btn-confirm" 
                            onClick={() => handleAddLicense(user.id)}
                          >
                            ✅ ยืนยัน
                          </button>
                          <button 
                            className="btn-cancel" 
                            onClick={() => {
                              setShowAddLicense(null);
                              setSelectedLicense('');
                            }}
                          >
                            ❌ ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {users.length > 0 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            แสดง {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, users.length)} จากทั้งหมด {users.length} รายการ
          </div>

          <div className="items-per-page">
            <label>แสดงต่อหน้า:</label>
            <select value={itemsPerPage} onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>

          <div className="pagination-buttons">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              «
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} className="pagination-ellipsis">...</span>;
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              »
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, data: null })}
        onConfirm={handleDialogConfirm}
        {...getConfirmDialogProps()}
      />

      {/* Prompt Dialog */}
      <PromptDialog
        isOpen={promptDialog.isOpen}
        onClose={() => setPromptDialog({ isOpen: false, action: null, data: null })}
        onConfirm={handlePromptConfirm}
        title="รีเซ็ตรหัสผ่าน"
        message="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร):"
        placeholder="รหัสผ่านใหม่..."
        inputType="password"
        minLength={6}
      />
    </div>
  );
}

export default UserManagement;