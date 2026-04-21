import React, { useState } from 'react';
import './Admin.css';
import mfuLogo from './assets/mfu-logo.png';

import DashboardOverview from './DashboardOverview';
import AnalyticsReports from './AnalyticsReports';
import IncomeReport from './IncomeReport';


const NAV_MENU = [
  { id: 'dashboard', title: 'Dashboard Overview', icon: '⊞' },
  { id: 'analytics', title: 'Analytics & Reports', icon: '📊' },
  { id: 'income', title: 'Income Report', icon: '💲' }
];

function AdminDashboard({ user, setView, setLoggedInUser }) {
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ใช้ Object Destructuring พร้อมกำหนด Default Values (Fallback)
  
  const { 
    firstname = 'Admin', 
    lastname = 'User', 
    role = 'Administrator' 
  } = user || {};

  const currentTabInfo = NAV_MENU.find(menu => menu.id === activeTab) || NAV_MENU[0];

  // Handlers & Render Functions
  
  const handleLogout = () => {
    setLoggedInUser(null);
    setView('general');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsReports />;
      case 'income':
        return <IncomeReport />;
      case 'dashboard':
      default:
        return <DashboardOverview />;
    }
  };

  // UI
  return (
    <div className="admin-layout">
      
      {/* --- Sidebar --- */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={mfuLogo} alt="MFU Logo" className="sidebar-logo-img" />
          <div>
            <h2 className="sidebar-title" style={{ color: '#8E1523', margin: 0, fontSize: '18px' }}>MFU Academy</h2>
            <p className="sidebar-subtitle" style={{ color: '#666', margin: 0, fontSize: '12px' }}>Admin Panel</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {NAV_MENU.map((menu) => (
            <button 
              key={menu.id}
              className={`nav-item ${activeTab === menu.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(menu.id)}
            >
              <span className="nav-icon">{menu.icon}</span> {menu.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="header-title" style={{ color: '#333', margin: '0 0 5px 0', fontSize: '20px' }}>
              {currentTabInfo.title}
            </h1>
            <p className="header-subtitle" style={{ color: '#666', margin: 0, fontSize: '13px' }}>Mae Fah Luang University</p>
          </div>
          
          <div className="admin-profile-container">
            <div className="admin-profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              
              <div className="profile-info" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#6B2126' }}>
                  {firstname} {lastname}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>{role}</div>
              </div>
              
              <div className="profile-avatar">
                <img 
                  src={`https://ui-avatars.com/api/?name=${firstname}+${lastname}&background=8E1523&color=fff`} 
                  alt="Admin Avatar" 
                  style={{ width: '100%', borderRadius: '50%' }}
                />
              </div>
              
              <span style={{ 
                marginLeft: '5px', 
                fontSize: '12px', 
                color: '#666', 
                transform: isProfileOpen ? 'rotate(180deg)' : 'none', 
                transition: '0.3s' 
              }}>▼</span>
            </div>
            
            {isProfileOpen && (
              <div className="profile-dropdown">
                <button className="dropdown-item logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* --- Content Area --- */}
        <div className="admin-content-area">
          {renderContent()}
        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;