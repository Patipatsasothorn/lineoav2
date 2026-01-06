import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { config } from '../config';

function Dashboard({ currentUser }) {
  const [stats, setStats] = useState({
    totalMessages: 0,
    channelStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/api/dashboard/stats?userId=${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 แดชบอร์ด</h1>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          <div className="stats-summary">
            <div className="stat-card total">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <h3>ข้อความทั้งหมด</h3>
                <p className="stat-value">{stats.totalMessages.toLocaleString()}</p>
                <small>จากทุก LINE OA</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📱</div>
              <div className="stat-content">
                <h3>LINE Channels</h3>
                <p className="stat-value">{stats.channelStats.length}</p>
                <small>ช่องทางที่เชื่อมต่อ</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>เฉลี่ยต่อช่องทาง</h3>
                <p className="stat-value">
                  {stats.channelStats.length > 0
                    ? Math.round(stats.totalMessages / stats.channelStats.length).toLocaleString()
                    : 0
                  }
                </p>
                <small>ข้อความต่อช่องทาง</small>
              </div>
            </div>
          </div>

          <div className="channel-stats-section">
            <h2>สถิติแต่ละ LINE OA</h2>

            {stats.channelStats.length === 0 ? (
              <div className="empty-state">
                <p>ยังไม่มีข้อมูลสถิติ</p>
                <p>เริ่มใช้งานเพื่อดูสถิติของคุณ</p>
              </div>
            ) : (
              <div className="channel-stats-grid">
                {stats.channelStats.map((channel, index) => (
                  <div key={channel.channelId} className="channel-stat-card">
                    <div className="channel-stat-header">
                      <div className="channel-rank">#{index + 1}</div>
                      <h3>{channel.channelName}</h3>
                    </div>
                    <div className="channel-stat-body">
                      <div className="stat-item">
                        <span className="stat-label">ข้อความที่ตอบ:</span>
                        <span className="stat-number">{channel.messageCount.toLocaleString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">สัดส่วน:</span>
                        <span className="stat-number">
                          {stats.totalMessages > 0
                            ? ((channel.messageCount / stats.totalMessages) * 100).toFixed(1)
                            : 0
                          }%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${stats.totalMessages > 0
                              ? (channel.messageCount / stats.totalMessages) * 100
                              : 0
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
