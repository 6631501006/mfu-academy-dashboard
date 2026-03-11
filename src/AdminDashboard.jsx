import React, { useState } from 'react';
import './Admin.css';
import mfuLogo from './assets/mfu-logo.png';

// 👇 Import หน้าต่างๆ ที่เราแยกไฟล์ไว้
import DashboardOverview from './DashboardOverview';
import AnalyticsReports from './AnalyticsReports';
import IncomeReport from './IncomeReport';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ฟังก์ชันสำหรับสลับแสดงผลหน้าต่างๆ ตาม Tab ที่เลือก
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'analytics':
        return <AnalyticsReports />;
      case 'income':
        return <IncomeReport />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Section */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={mfuLogo} alt="MFU Logo" className="sidebar-logo-img" />
          <div>
            <h2 style={{ color: '#8E1523', margin: 0, fontSize: '18px' }}>MFU Academy Dashboard</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Admin Panel</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><span className="nav-icon">⊞</span> Dashboard</button>
          <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><span className="nav-icon">📊</span> Analytics & Reports</button>
          <button className={`nav-item ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}><span className="nav-icon">💲</span> Income Report</button>
        </nav>
      </aside>

      {/* Main Content Section */}
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
                <button className="dropdown-item logout-btn" onClick={() => alert("Logout Success")}>Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* 👇 เรียกใช้ฟังก์ชันแสดงเนื้อหาตรงนี้ 👇 */}
        <div className="admin-content-area">
          {renderContent()}
        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;