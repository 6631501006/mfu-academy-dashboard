import React, { useState, useEffect } from 'react';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut as DoughnutChart, Bar as BarChart } from 'react-chartjs-2'; 

// 👇 1. Import ปฏิทินและสไตล์ของมันเข้ามา
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import mfuLogo from './assets/mfu-logo.png';
import AdminDashboard from './AdminDashboard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

function App() {
  const [view, setView] = useState('general');
  const [stats, setStats] = useState({ totalLearners: 0, totalCourses: 0 });
  const [topCourses, setTopCourses] = useState([]);
  const [catDist, setCatDist] = useState([]);
  
  // 👇 2. เปลี่ยน State ให้รับค่าเป็นช่วงวันที่ (Array) แทน
  const [selectedCat, setSelectedCat] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange; // แยกค่าเริ่มต้นและสิ้นสุดออกมาใช้งาน
  const [displayLimit, setDisplayLimit] = useState('5');

  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course');
      const allCourses = await response.json();

      let filteredCourses = allCourses;
      if (selectedCat !== 'all') {
        filteredCourses = allCourses.filter(course => 
          course.categoryId === parseInt(selectedCat) || 
          (course.category && course.category.id === parseInt(selectedCat))
        );
      }

      let totalLearnersCount = 0;
      let chartBarData = [];
      let categoryCounts = {};

      filteredCourses.forEach(course => {
        let validOrders = course.orderDetail || [];

        // 👇 3. ระบบกรองวันที่ (รองรับ Date Object จากปฏิทินใหม่)
        if (startDate || endDate) {
          validOrders = validOrders.filter(order => {
            const orderDate = new Date(order.createdAt); 
            const start = startDate ? new Date(startDate) : new Date('2000-01-01');
            const end = endDate ? new Date(endDate) : new Date('2100-01-01');
            end.setHours(23, 59, 59, 999); 
            
            return orderDate >= start && orderDate <= end;
          });
        }

        totalLearnersCount += validOrders.length;

        if (validOrders.length > 0 || (!startDate && !endDate)) {
          chartBarData.push({ name: course.courseName, value: validOrders.length });
        }

        const catName = course.category ? course.category.categoryName : 'Other';
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      });

      chartBarData.sort((a, b) => b.value - a.value);
      if (displayLimit !== 'all') {
        chartBarData = chartBarData.slice(0, parseInt(displayLimit)); 
      }

      const formattedCatDist = Object.keys(categoryCounts).map(key => ({ label: key, value: categoryCounts[key] }));

      setStats({ totalLearners: totalLearnersCount, totalCourses: filteredCourses.length });
      setTopCourses(chartBarData);
      setCatDist(formattedCatDist);

    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  useEffect(() => { 
    if (view === 'general') fetchData(); 
  }, [selectedCat, startDate, endDate, displayLimit, view]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('https://auth-mlii.mfu.ac.th/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password }) 
      });
      const data = await response.json();
      if (response.ok && data.accessToken) {
        localStorage.setItem('mfuAdminToken', data.accessToken);
        const fakeUser = { firstname: 'Admin', lastname: username, role: 'Administrator' };
        alert(`Login Success! Welcome ${username}`);
        setLoggedInUser(fakeUser);
        setView('admin'); 
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.message || "Invalid Username or Password"); 
      }
    } catch (err) {
      setLoginError("Failed to connect to MFU Authentication Server.");
    }
  };

  if (view === 'admin') {
    return <AdminDashboard user={loggedInUser} setView={setView} setLoggedInUser={setLoggedInUser} />;
  }

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
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter your email" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" />
            </div>
            {loginError && <div className="error-message">{loginError}</div>}
            <button type="submit" className="login-submit-btn">Sign In</button>
          </form>
          <button onClick={() => setView('general')} className="back-link">&larr; Back to Public Dashboard</button>
        </div>
      </div>
    );
  }

  return (
      <>
        <nav className="top-navbar">
          <div className="navbar-brand">
            <img src={mfuLogo} alt="MFU Logo" className="navbar-logo" />
            <h2 style={{ color: '#8E1523', margin: 0, fontSize: '20px' }}>MFU Academy Dashboard</h2>
          </div>
          <div>
            <button onClick={() => setView('login')} style={{ padding: '8px 20px', borderRadius: '8px', background: '#8E1523', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Admin Login
            </button>
          </div>
        </nav>
  
        <div className="dashboard-wrapper">
          <div className="header-section">
            <div>
              <h1 style={{ color: '#8E1523', margin: '0 0 5px 0', fontSize: '24px' }}>Dashboard Overview</h1>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Mae Fah Luang University</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              
              {/* 👇 4. ปฏิทิน Range Picker แบบไม่มี วว/ดด/ปปปป กวนใจ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <span style={{ fontSize: '14px', color: '#555' }}>📅 Date:</span>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  placeholderText="Select date range..."
                  dateFormat="dd/MM/yyyy"
                  className="custom-date-picker"
                />
              </div>

              <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', cursor: 'pointer' }}>
                <option value="all">All Categories</option>
                <option value="1">Online Course</option>
                <option value="2">E-Book</option>
                <option value="3">In-house Training</option>
              </select>
              
              <button 
                // 👇 อัปเดต Reset ให้เคลียร์ค่าปฏิทินด้วย
                onClick={() => { setSelectedCat('all'); setDateRange([null, null]); setDisplayLimit('5'); }} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
              >
                Reset Filter
              </button>
            </div>
          </div>
  
          <div className="stat-container">
            <div className="stat-card">
              <div className="stat-info"><h3>Total Learners</h3><h2>{stats.totalLearners.toLocaleString()}</h2></div>
              <div className="icon-box" style={{ background: '#E7F0FF', color: '#2563EB' }}>👥</div>
            </div>
            <div className="stat-card">
              <div className="stat-info"><h3>Total Courses</h3><h2>{stats.totalCourses}</h2></div>
              <div className="icon-box" style={{ background: '#FCE7E9', color: '#8E1523' }}>📖</div>
            </div>
          </div>
  
          <div className="chart-container">
            <div className="chart-card" style={{ flex: 1.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0' }}>
                <h3 style={{ margin: 0, color: '#333' }}>Course Popularity</h3>
                <select 
                  value={displayLimit} 
                  onChange={(e) => setDisplayLimit(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="5">Top 5</option>
                  <option value="all">Show All Courses</option>
                </select>
              </div>

              <div style={{ height: '350px', overflowY: displayLimit === 'all' ? 'auto' : 'hidden', paddingRight: '10px' }}> 
                <div style={{ height: displayLimit === 'all' ? `${Math.max(350, topCourses.length * 40)}px` : '100%', position: 'relative' }}>
                  <BarChart 
                    data={{
                      labels: topCourses.map(item => item.name),
                      datasets: [{ label: 'Enrollments', data: topCourses.map(item => item.value), backgroundColor: '#8E1523', borderRadius: 4 }]
                    }} 
                    options={{ 
                      indexAxis: 'y', 
                      maintainAspectRatio: false, 
                      plugins: { legend: { display: false } },
                      scales: { x: { ticks: { stepSize: 1 } } } 
                    }} 
                  />
                </div>
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