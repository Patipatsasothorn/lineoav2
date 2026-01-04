import React, { useState, useEffect } from 'react';
import './Licensetimer.css';

function LicenseTimer({ expiresAt, onExpired }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isNearExpiry, setIsNearExpiry] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('ไม่จำกัด');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft('หมดอายุ');
        setIsExpired(true);
        if (onExpired) {
          onExpired();
        }
        return;
      }

      // คำนวณเวลาที่เหลือ
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // ตรวจสอบว่าใกล้หมดอายุหรือไม่ (น้อยกว่า 7 วัน)
      if (days < 7) {
        setIsNearExpiry(true);
      }

      // แสดงผลตามระยะเวลา
      if (days > 0) {
        setTimeLeft(`เหลืออีก ${days} วัน ${hours} ชม.`);
      } else if (hours > 0) {
        setTimeLeft(`เหลืออีก ${hours} ชม. ${minutes} นาที`);
      } else if (minutes > 0) {
        setTimeLeft(`เหลืออีก ${minutes} นาที ${seconds} วินาที`);
      } else {
        setTimeLeft(`เหลืออีก ${seconds} วินาที`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  if (isExpired) {
    return (
      <div className="license-timer expired">
        <span className="license-icon">⚠️</span>
        <span className="license-text">{timeLeft}</span>
      </div>
    );
  }

  if (isNearExpiry) {
    return (
      <div className="license-timer warning">
        <span className="license-icon">⏰</span>
        <span className="license-text">{timeLeft}</span>
      </div>
    );
  }

  if (timeLeft === 'ไม่จำกัด') {
    return (
      <div className="license-timer unlimited">
        <span className="license-icon">✓</span>
        <span className="license-text">License: {timeLeft}</span>
      </div>
    );
  }

  return (
    <div className="license-timer active">
      <span className="license-icon">🔒</span>
      <span className="license-text">{timeLeft}</span>
    </div>
  );
}

export default LicenseTimer;