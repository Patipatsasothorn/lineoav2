import React from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', type = 'warning' }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon ${type}`}>
          {type === 'warning' && '⚠️'}
          {type === 'danger' && '🗑️'}
          {type === 'info' && 'ℹ️'}
          {type === 'question' && '❓'}
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-buttons">
          <button className="confirm-btn confirm" onClick={handleConfirm}>
            {confirmText}
          </button>
          <button className="confirm-btn cancel" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
