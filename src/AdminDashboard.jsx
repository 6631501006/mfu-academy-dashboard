import React, { useState } from 'react';
import './Admin.css'; // เรียกใช้ไฟล์ CSS ใหม่
import mfuLogo from './assets/mfu-logo.png';

function AdminDashboard() {
  // สร้าง State เพื่อจำว่าตอนนี้กดเมนูไหนอยู่ (เริ่มต้นที่หน้า dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="admin-layout">
      
      {/* ========================================== */}
      {/* 1. Sidebar (เมนูด้านซ้าย) */}
      {/* ========================================== */}
      <aside className="admin-sidebar">
        {/* โลโก้และชื่อโปรเจกต์ */}
        <div className="sidebar-brand">
        <img src={mfuLogo} alt="MFU Logo" className="sidebar-logo-img" />
          <div>
            <h2 style={{ color: '#8E1523', margin: 0, fontSize: '18px' }}>MFU Academy Dashboard</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Admin Panel</p>
          </div>
        </div>

        {/* เมนูนำทาง (เหลือแค่ 3 Tabs ตามสั่ง) */}
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
        
        {/* Header ด้านบน */}
        <header className="admin-header">
          <div>
            <h1 style={{ color: '#333', margin: '0 0 5px 0', fontSize: '20px' }}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'analytics' && 'Analytics & Reports'}
              {activeTab === 'income' && 'Income Report'}
            </h1>
            <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>Mae Fah Luang University</p>
          </div>

          {/* 2. แก้ไขส่วน Profile ให้คลิกได้และมี Dropdown */}
          <div className="admin-profile-container">
            <div 
              className="admin-profile-trigger" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#6B2126' }}>Admin User</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Administrator</div>
              </div>
              <div className="profile-avatar">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=8E1523&color=fff" alt="Admin" style={{ width: '100%', borderRadius: '50%' }}/>
              </div>
              {/* ลูกศรชี้ลง เล็กๆ */}
              <span style={{ marginLeft: '5px', fontSize: '12px', color: '#666', transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
            </div>

            {/* กล่อง Dropdown ที่จะโชว์ตอน isProfileOpen เป็น true */}
            {isProfileOpen && (
              <div className="profile-dropdown">
                <button 
                  className="dropdown-item logout-btn"
                  onClick={() => alert("ระบบกำลังทำการ Logout...")} // ใส่ฟังก์ชัน Logout จริงๆ ทีหลัง
                >
                  {/* ไอคอนออกจากระบบ */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </header>

        {/* พื้นที่สีขาวว่างๆ สำหรับใส่เนื้อหาในอนาคต */}
        <div className="admin-content-area">
          <div className="blank-white-page">
            {/* ข้อความชั่วคราวเพื่อให้รู้ว่าอยู่หน้าไหน */}
            <h2 style={{ color: '#ccc', textAlign: 'center', marginTop: '100px' }}>
              พื้นที่ว่างสำหรับหน้า {activeTab.toUpperCase()}
            </h2>
          </div>
        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;