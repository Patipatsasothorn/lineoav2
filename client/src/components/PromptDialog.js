import React, { useState, useEffect, useRef } from 'react';
import './PromptDialog.css';

function PromptDialog({ isOpen, onClose, onConfirm, title, message, placeholder = '', defaultValue = '', inputType = 'text', minLength = 0 }) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (minLength > 0 && value.length < minLength) {
      setError(`กรุณาใส่ข้อมูลอย่างน้อย ${minLength} ตัวอักษร`);
      return;
    }
    onConfirm(value);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="prompt-overlay" onClick={onClose}>
      <div className="prompt-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-icon">✏️</div>
        <h3 className="prompt-title">{title}</h3>
        <p className="prompt-message">{message}</p>
        <input
          ref={inputRef}
          type={inputType}
          className="prompt-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
        />
        {error && <p className="prompt-error">{error}</p>}
        <div className="prompt-buttons">
          <button className="prompt-btn confirm" onClick={handleConfirm}>
            ยืนยัน
          </button>
          <button className="prompt-btn cancel" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptDialog;
