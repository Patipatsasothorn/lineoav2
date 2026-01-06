import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import Chat from './components/Chat';
import UserManagement from './components/UserManagement';
import LicenseManagement from './components/LicenseManagement';
import UserSettings from './components/UserSettings';
import Chatbot from './components/Chatbot';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่ามี token ใน localStorage หรือไม่
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }

    // รองรับ hash navigation
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['home', 'chat', 'chatbot', 'dashboard', 'team', 'users', 'licenses', 'settings'].includes(hash)) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // เช็คตอน load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // ตั้งค่าหน้าเริ่มต้นตาม role
    if (user.role === 'admin') {
      setCurrentPage('home'); // Admin ก็เริ่มที่หน้าหลักเหมือนกัน
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('home');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // ถ้าเป็น Admin จะแสดง navbar แบบ admin
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="nav-brand">
          LineOA v2 {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }}
            >
              🏠 หน้าหลัก
            </button>
            <button
              className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('chat'); setIsMobileMenuOpen(false); }}
            >
              💬 แชท
            </button>
            <button
              className={`nav-link ${currentPage === 'chatbot' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('chatbot'); setIsMobileMenuOpen(false); }}
            >
              🤖 แชทบอท
            </button>
            <button
              className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('dashboard'); setIsMobileMenuOpen(false); }}
            >
              📊 แดชบอร์ด
            </button>
            <button
              className={`nav-link ${currentPage === 'team' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('team'); setIsMobileMenuOpen(false); }}
            >
              👨‍💼 กำหนดลูกทีม
            </button>

            {isAdmin && (
              <>
                <button
                  className={`nav-link ${currentPage === 'users' ? 'active' : ''}`}
                  onClick={() => { setCurrentPage('users'); setIsMobileMenuOpen(false); }}
                >
                  👥 จัดการบัญชี
                </button>
                <button
                  className={`nav-link ${currentPage === 'licenses' ? 'active' : ''}`}
                  onClick={() => { setCurrentPage('licenses'); setIsMobileMenuOpen(false); }}
                >
                  🎫 จัดการ License
                </button>
              </>
            )}

            <button
              className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('settings'); setIsMobileMenuOpen(false); }}
            >
              ⚙️ {currentUser?.username}
            </button>

            <button className="nav-link logout" onClick={handleLogout}>
              🚪 ออกจากระบบ
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>LineOA v2</h1>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            <span className="sidebar-icon">🏠</span>
            <span className="sidebar-text">หน้าหลัก</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'chat' ? 'active' : ''}`}
            onClick={() => setCurrentPage('chat')}
          >
            <span className="sidebar-icon">💬</span>
            <span className="sidebar-text">แชท</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'chatbot' ? 'active' : ''}`}
            onClick={() => setCurrentPage('chatbot')}
          >
            <span className="sidebar-icon">🤖</span>
            <span className="sidebar-text">แชทบอท</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">แดชบอร์ด</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'team' ? 'active' : ''}`}
            onClick={() => setCurrentPage('team')}
          >
            <span className="sidebar-icon">👨‍💼</span>
            <span className="sidebar-text">กำหนดลูกทีม</span>
          </button>

          {isAdmin && (
            <>
              <button
                className={`sidebar-link ${currentPage === 'users' ? 'active' : ''}`}
                onClick={() => setCurrentPage('users')}
              >
                <span className="sidebar-icon">👥</span>
                <span className="sidebar-text">จัดการบัญชี</span>
              </button>
              <button
                className={`sidebar-link ${currentPage === 'licenses' ? 'active' : ''}`}
                onClick={() => setCurrentPage('licenses')}
              >
                <span className="sidebar-icon">🎫</span>
                <span className="sidebar-text">จัดการ License</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`sidebar-link ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-text">{currentUser?.username}</span>
          </button>
          <button className="sidebar-link logout" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-text">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {currentPage === 'home' && <Home currentUser={currentUser} />}
        {currentPage === 'chat' && <Chat currentUser={currentUser} />}
        {currentPage === 'chatbot' && <Chatbot currentUser={currentUser} />}
        {currentPage === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {currentPage === 'team' && <TeamManagement currentUser={currentUser} />}
        {currentPage === 'users' && isAdmin && <UserManagement currentUser={currentUser} />}
        {currentPage === 'licenses' && isAdmin && <LicenseManagement currentUser={currentUser} />}
        {currentPage === 'settings' && <UserSettings currentUser={currentUser} onUserUpdate={setCurrentUser} />}
      </main>
    </div>
  );
}

export default App;