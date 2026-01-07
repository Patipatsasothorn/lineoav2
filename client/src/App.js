import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import Chat from './components/Chat';
import ArchivedChats from './components/ArchivedChats';
import UserManagement from './components/UserManagement';
import LicenseManagement from './components/LicenseManagement';
import UserSettings from './components/UserSettings';
import Chatbot from './components/Chatbot';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import AgentManagement from './components/agent';
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
      if (hash && ['home', 'chat', 'archived', 'chatbot', 'dashboard', 'team', 'users', 'licenses', 'settings'].includes(hash)) {
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
          QO CHAT {isAdmin && <span className="admin-badge">Admin</span>}
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
              <i className="fas fa-home nav-icon"></i> หน้าหลัก
            </button>
            <button
              className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('chat'); setIsMobileMenuOpen(false); }}
            >
              <i className="fas fa-comments nav-icon"></i> แชท
            </button>
            <button
              className={`nav-link ${currentPage === 'archived' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('archived'); setIsMobileMenuOpen(false); }}
            >
              <i className="fas fa-check-circle nav-icon"></i> จบแชท
            </button>
            <button
              className={`nav-link ${currentPage === 'chatbot' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('chatbot'); setIsMobileMenuOpen(false); }}
            >
              <i className="fas fa-robot nav-icon"></i> แชทบอท
            </button>
            <button
              className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('dashboard'); setIsMobileMenuOpen(false); }}
            >
              <i className="fas fa-chart-line nav-icon"></i> แดชบอร์ด
            </button>
            {currentUser?.role !== 'agent' && (
              <button
                className={`nav-link ${currentPage === 'team' ? 'active' : ''}`}
                onClick={() => { setCurrentPage('team'); setIsMobileMenuOpen(false); }}
              >
                <i className="fas fa-users nav-icon"></i> กำหนดลูกทีม
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  className={`nav-link ${currentPage === 'users' ? 'active' : ''}`}
                  onClick={() => { setCurrentPage('users'); setIsMobileMenuOpen(false); }}
                >
                  <i className="fas fa-user-cog nav-icon"></i> จัดการบัญชี
                </button>
                <button
                  className={`nav-link ${currentPage === 'licenses' ? 'active' : ''}`}
                  onClick={() => { setCurrentPage('licenses'); setIsMobileMenuOpen(false); }}
                >
                  <i className="fas fa-key nav-icon"></i> จัดการ License
                </button>
              </>
            )}

            <button
              className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => { setCurrentPage('settings'); setIsMobileMenuOpen(false); }}
            >
              <i className="fas fa-user-circle nav-icon"></i> {currentUser?.username}
            </button>

            <button className="nav-link logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt nav-icon"></i> ออกจากระบบ
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>QO CHAT</h1>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            <i className="fas fa-home sidebar-icon"></i>
            <span className="sidebar-text">หน้าหลัก</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'chat' ? 'active' : ''}`}
            onClick={() => setCurrentPage('chat')}
          >
            <i className="fas fa-comments sidebar-icon"></i>
            <span className="sidebar-text">แชท</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'archived' ? 'active' : ''}`}
            onClick={() => setCurrentPage('archived')}
          >
            <i className="fas fa-check-circle sidebar-icon"></i>
            <span className="sidebar-text">จบแชท</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'chatbot' ? 'active' : ''}`}
            onClick={() => setCurrentPage('chatbot')}
          >
            <i className="fas fa-robot sidebar-icon"></i>
            <span className="sidebar-text">แชทบอท</span>
          </button>
          <button
            className={`sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <i className="fas fa-chart-line sidebar-icon"></i>
            <span className="sidebar-text">แดชบอร์ด</span>
          </button>
          {currentUser?.role !== 'agent' && (
            <button
              className={`sidebar-link ${currentPage === 'team' ? 'active' : ''}`}
              onClick={() => setCurrentPage('team')}
            >
              <i className="fas fa-users sidebar-icon"></i>
              <span className="sidebar-text">กำหนดลูกทีม</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                className={`sidebar-link ${currentPage === 'users' ? 'active' : ''}`}
                onClick={() => setCurrentPage('users')}
              >
                <i className="fas fa-user-cog sidebar-icon"></i>
                <span className="sidebar-text">จัดการบัญชี</span>
              </button>
              <button
                className={`sidebar-link ${currentPage === 'licenses' ? 'active' : ''}`}
                onClick={() => setCurrentPage('licenses')}
              >
                <i className="fas fa-key sidebar-icon"></i>
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
            <i className="fas fa-user-circle sidebar-icon"></i>
            <span className="sidebar-text">{currentUser?.username}</span>
          </button>
          <button className="sidebar-link logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt sidebar-icon"></i>
            <span className="sidebar-text">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {currentPage === 'home' && <Home currentUser={currentUser} />}
        {currentPage === 'chat' && <Chat currentUser={currentUser} />}
        {currentPage === 'archived' && <ArchivedChats currentUser={currentUser} />}
        {currentPage === 'chatbot' && <Chatbot currentUser={currentUser} />}
        {currentPage === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {currentPage === 'team' && <AgentManagement currentUser={currentUser} />}
        {currentPage === 'users' && isAdmin && <UserManagement currentUser={currentUser} />}
        {currentPage === 'licenses' && isAdmin && <LicenseManagement currentUser={currentUser} />}
        {currentPage === 'settings' && <UserSettings currentUser={currentUser} onUserUpdate={setCurrentUser} />}
      </main>
    </div>
  );
}

export default App;