import React, { useState, useEffect } from 'react';
import './Admin.css'; // เรียกใช้ไฟล์ CSS ใหม่
import mfuLogo from './assets/mfu-logo.png';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- เพิ่ม State สำหรับเก็บข้อมูลสถิติ ---
  const [adminStats, setAdminStats] = useState({
    totalRevenue: 0,
    totalCourses: 0,
    totalLearners: 0
  });

  // --- ดึงข้อมูลจาก Backend เมื่อโหลดหน้าเว็บ ---
  useEffect(() => {
    fetch('http://localhost:5001/api/admin-stats')
      .then(res => res.json())
      .then(data => setAdminStats(data))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  return (
    <div className="admin-layout">
      
      {/* ========================================== */}
      {/* 1. Sidebar (เมนูด้านซ้าย) */}
      {/* ========================================== */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={mfuLogo} alt="MFU Logo" className="sidebar-logo-img" />
          <div>
            <h2 style={{ color: '#8E1523', margin: 0, fontSize: '18px' }}>MFU Academy Dashboard</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Admin Panel</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">⊞</span> Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📊</span> Analytics & Reports
          </button>
          <button 
            className={`nav-item ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            <span className="nav-icon">💲</span> Income Report
          </button>
        </nav>
      </aside>

      {/* ========================================== */}
      {/* 2. Main Content (พื้นที่เนื้อหาด้านขวา) */}
      {/* ========================================== */}
      <main className="admin-main">
        
        <header className="admin-header">
          <div>
            <h1 style={{ color: '#333', margin: '0 0 5px 0', fontSize: '20px' }}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'analytics' && 'Analytics & Reports'}
              {activeTab === 'income' && 'Income Report'}
            </h1>
            <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>Mae Fah Luang University</p>
          </div>

          <div className="admin-profile-container">
            <div className="admin-profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#6B2126' }}>Admin User</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Administrator</div>
              </div>
              <div className="profile-avatar">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=8E1523&color=fff" alt="Admin" style={{ width: '100%', borderRadius: '50%' }}/>
              </div>
              <span style={{ marginLeft: '5px', fontSize: '12px', color: '#666', transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
            </div>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <button className="dropdown-item logout-btn" onClick={() => alert("ระบบกำลังทำการ Logout...")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* --- พื้นที่แสดงเนื้อหาเปลี่ยนตาม Tab --- */}
        <div className="admin-content-area">
          
          {activeTab === 'dashboard' ? (
            /* ถาอยู่หน้า Dashboard ให้แสดง Card ข้อมูล */
            <div className="admin-stat-grid">
              
              <div className="admin-card">
                <div className="card-info">
                  <p>Total Gross Revenue</p>
                  <h3>฿{adminStats.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="card-icon green-icon">
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>$</span>
                </div>
              </div>

              <div className="admin-card">
                <div className="card-info">
                  <p>Total Courses</p>
                  <h3>{adminStats.totalCourses.toLocaleString()}</h3>
                </div>
                <div className="card-icon red-icon">
                  <span style={{ fontSize: '22px' }}>📖</span>
                </div>
              </div>

              <div className="admin-card">
                <div className="card-info">
                  <p>Total Learners</p>
                  <h3>{adminStats.totalLearners.toLocaleString()}</h3>
                </div>
                <div className="card-icon blue-icon">
                  <span style={{ fontSize: '24px' }}>🎓</span>
                </div>
              </div>

            </div>
          ) : (
            /* ถ้าเป็นหน้าอื่นให้แสดงกระดาษเปล่า */
            <div className="blank-white-page">
              <h2 style={{ color: '#ccc', textAlign: 'center', marginTop: '100px' }}>
                พื้นที่ว่างสำหรับหน้า {activeTab.toUpperCase()}
              </h2>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;