import React, { useState, useEffect } from 'react';
import './Admin.css';
import mfuLogo from './assets/mfu-logo.png';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [adminStats, setAdminStats] = useState({
    totalRevenue: 0,
    totalCourses: 0,
    totalLearners: 0
  });

  const [monthlyData, setMonthlyData] = useState(new Array(12).fill(0));

  useEffect(() => {
    fetch('http://localhost:5001/api/admin-stats')
      .then(res => res.json())
      .then(data => setAdminStats(data))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:5001/api/monthly-income?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        let chartData = new Array(12).fill(0);
        data.forEach(item => {
          const m = parseInt(item.month);
          if(m >= 1 && m <= 12) {
            chartData[m - 1] = parseFloat(item.total);
          }
        });
        setMonthlyData(chartData);
      })
      .catch(err => console.error("Error fetching line chart:", err));
  }, [selectedYear]);

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

        <div className="admin-content-area">
          {activeTab === 'dashboard' ? (
            <div>
              <div className="admin-stat-grid">
                <div className="admin-card">
                  <div className="card-info"><p>Total Gross Revenue</p><h3>฿{adminStats.totalRevenue.toLocaleString()}</h3></div>
                  <div className="card-icon green-icon"><span>$</span></div>
                </div>
                <div className="admin-card">
                  <div className="card-info"><p>Total Courses</p><h3>{adminStats.totalCourses.toLocaleString()}</h3></div>
                  <div className="card-icon red-icon"><span>📖</span></div>
                </div>
                <div className="admin-card">
                  <div className="card-info"><p>Total Learners</p><h3>{adminStats.totalLearners.toLocaleString()}</h3></div>
                  <div className="card-icon blue-icon"><span>🎓</span></div>
                </div>
              </div>

              <div className="admin-chart-container" style={{ marginTop: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Monthly Income Trends</h3>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                <div style={{ height: '350px', width: '100%' }}>
                  <Line 
                    data={{
                      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                      datasets: [{
                        label: 'Revenue (THB)',
                        data: monthlyData,
                        borderColor: '#8E1523',
                        backgroundColor: '#8E1523',
                        borderWidth: 3,
                        pointBackgroundColor: '#8E1523',
                        pointRadius: 4,
                        tension: 0.4
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { 
                          beginAtZero: true,
                          min: 0, // 👈 ล็อคไว้ให้เริ่มที่ 0 เสมอ ไม่ติดลบแน่นอน
                          grid: { color: '#f0f0f0', borderDash: [5, 5] },
                          ticks: { color: '#999', font: { size: 12 } }
                        },
                        x: {
                          grid: { display: false },
                          ticks: { color: '#999', font: { size: 12 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
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