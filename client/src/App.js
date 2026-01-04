import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import Chat from './components/Chat';
import UserManagement from './components/UserManagement';
import LicenseManagement from './components/LicenseManagement';
import UserSettings from './components/UserSettings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);

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
      if (hash && ['home', 'chat', 'users', 'licenses', 'settings'].includes(hash)) {
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
      <nav className="navbar">
        <div className="nav-brand">LineOA v2 {isAdmin && <span className="admin-badge">Admin</span>}</div>
        <div className="nav-menu">
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            หน้าหลัก
          </button>
          <button 
            className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`}
            onClick={() => setCurrentPage('chat')}
          >
            แชท
          </button>
          
          {/* แสดงเฉพาะ Admin */}
          {isAdmin && (
            <>
              <button 
                className={`nav-link ${currentPage === 'users' ? 'active' : ''}`}
                onClick={() => setCurrentPage('users')}
              >
                จัดการบัญชี
              </button>
              <button 
                className={`nav-link ${currentPage === 'licenses' ? 'active' : ''}`}
                onClick={() => setCurrentPage('licenses')}
              >
                จัดการ License
              </button>
            </>
          )}
          
          {/* เมนูผู้ใช้ */}
          <div className="nav-user-menu">
            <button 
              className={`nav-link nav-username ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentPage('settings')}
            >
              {currentUser?.username}
            </button>
          </div>
          
          <button className="nav-link logout" onClick={handleLogout}>
            ออกจากระบบ
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        {currentPage === 'home' && <Home currentUser={currentUser} />}
        {currentPage === 'chat' && <Chat currentUser={currentUser} />}
        {currentPage === 'users' && isAdmin && <UserManagement currentUser={currentUser} />}
        {currentPage === 'licenses' && isAdmin && <LicenseManagement currentUser={currentUser} />}
        {currentPage === 'settings' && <UserSettings currentUser={currentUser} onUserUpdate={setCurrentUser} />}
      </main>
    </div>
  );
}

export default App;