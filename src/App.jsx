import React, { useState, useEffect } from 'react';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut as DoughnutChart, Bar as BarChart } from 'react-chartjs-2'; 
import mfuLogo from './assets/mfu-logo.png';
import AdminDashboard from './AdminDashboard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

function App() {
  const [view, setView] = useState('general');
  const [stats, setStats] = useState({ totalLearners: 0, totalCourses: 0 });
  const [topCourses, setTopCourses] = useState([]);
  const [catDist, setCatDist] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');

  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  //  1. เพิ่ม State สำหรับเก็บข้อมูล User เมื่อล็อกอินสำเร็จ
  const [loggedInUser, setLoggedInUser] = useState(null);

  const fetchData = (catId) => {
    fetch(`http://localhost:5001/api/stats?categoryId=${catId}`)
      .then(res => res.json()).then(data => setStats(data));
    
    fetch(`http://localhost:5001/api/top-courses?categoryId=${catId}`)
      .then(res => res.json()).then(data => setTopCourses(data));

    fetch(`http://localhost:5001/api/category-dist?categoryId=${catId}`)
      .then(res => res.json()).then(data => setCatDist(data));
  };

  useEffect(() => { 
    if (view === 'general') {
      fetchData(selectedCat); 
    }
  }, [selectedCat, view]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password }) 
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 2.เก็บข้อมูล User เข้า State 
        setLoggedInUser(data.user);
        setView('admin'); 
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.message || "Login failed"); 
      }
    } catch (err) {
      setLoginError("Failed to connect to the server.");
    }
  };

  //3.หน้า ADMIN DASHBOARD 
  if (view === 'admin') {
    return (
      <AdminDashboard 
        user={loggedInUser} 
        setView={setView} 
        setLoggedInUser={setLoggedInUser} 
      />
    );
  }

  // --- หน้า LOGIN FORM ---
  if (view === 'login') {
    return (
      <div className="login-page-wrapper">
        <div className="login-box">
          <img src={mfuLogo} alt="MFU Logo" className="login-logo" />
          <h2>Admin Login</h2>
          <p className="login-subtitle">Please sign in to access the dashboard</p>
          
          <form onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <label>Email / Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="Enter your email" 
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Enter password" 
              />
            </div>

            {loginError && <div className="error-message">{loginError}</div>}

            <button type="submit" className="login-submit-btn">Sign In</button>
          </form>
          
          <button onClick={() => setView('general')} className="back-link">
            &larr; Back to Public Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- หน้า PUBLIC DASHBOARD ---
  return (
      <>
        {/* --- 1. Navbar (แถบบนสุด) --- */}
        <nav className="top-navbar">
          {/* ฝั่งซ้าย: โลโก้ และชื่อย่อ */}
          <div className="navbar-brand">
            <img src={mfuLogo} alt="MFU Logo" className="navbar-logo" />
            <h2 style={{ color: '#8E1523', margin: 0, fontSize: '20px' }}>MFU Academy Dashboard</h2>
          </div>
  
          {/* ฝั่งขวา: ปุ่ม Login */}
          <div>
            <button 
              onClick={() => setView('login')}
              style={{ padding: '8px 20px', borderRadius: '8px', background: '#8E1523', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Admin Login
            </button>
          </div>
        </nav>
  
        {/* --- 2. เนื้อหา Dashboard (อยู่ใต้ Navbar) --- */}
        <div className="dashboard-wrapper">
          
          {/* Header ของ Dashboard */}
          <div className="header-section">
            <div>
              <h1 style={{ color: '#8E1523', margin: '0 0 5px 0', fontSize: '24px' }}>
                Dashboard Overview
              </h1>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Mae Fah Luang University</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '14px' }}>Showing: <b>{selectedCat === 'all' ? 'All Categories' : `Category ${selectedCat}`}</b></span>
              <select 
                value={selectedCat} 
                onChange={(e) => setSelectedCat(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">All Categories</option>
                <option value="1">Online Course</option>
                <option value="2">E-Book</option>
                <option value="3">In-house Training</option>
              </select>
              <button 
                onClick={() => setSelectedCat('all')} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
              >
                Reset Filter
              </button>
            </div>
          </div>
  
          {/* --- Stat Cards --- */}
          <div className="stat-container">
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Learners</h3>
                <h2>{stats.totalLearners.toLocaleString()}</h2>
              </div>
              <div className="icon-box" style={{ background: '#E7F0FF', color: '#2563EB' }}>👥</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Courses</h3>
                <h2>{stats.totalCourses}</h2>
              </div>
              <div className="icon-box" style={{ background: '#FCE7E9', color: '#8E1523' }}>📖</div>
            </div>
          </div>
  
          {/* --- Charts --- */}
          <div className="chart-container">
            <div className="chart-card" style={{ flex: 1.5 }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Top 5 Course Popularity</h3>
              <div style={{ height: '350px', position: 'relative' }}> 
                <BarChart 
                  data={{
                    labels: topCourses.map(item => item.name),
                    datasets: [{ label: 'Enrollments', data: topCourses.map(item => item.value), backgroundColor: '#8E1523', borderRadius: 4 }]
                  }} 
                  options={{ 
                    indexAxis: 'y', 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        ticks: {
                          stepSize: 1 // บังคับให้เพิ่มทีละ 1 
                        }
                      }
                    } 
                  }} 
                />
              </div>
            </div>
  
            <div className="chart-card" style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Course Categories</h3>
              <div style={{ position: 'relative', height: '300px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <DoughnutChart 
                  data={{
                    labels: catDist.map(item => item.label), 
                    datasets: [{ data: catDist.map(item => item.value), backgroundColor: ['#8E1523', '#BD9946', '#D9D9D9', '#333333'], borderWidth: 0, hoverOffset: 4 }]
                  }} 
                  options={{ cutout: '75%', plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>
  
        </div>
      </>
  );
}

export default App;