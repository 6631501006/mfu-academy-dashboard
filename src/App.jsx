import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement 
} from 'chart.js';
import { Doughnut as DoughnutChart, Bar as BarChart } from 'react-chartjs-2'; 
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import mfuLogo from './assets/mfu-logo.png';
import AdminDashboard from './AdminDashboard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const CATEGORY_COLORS = ['#8E1523', '#D4A038', '#C42026', '#E06D53', '#E8907E', '#4C5A73'];

function App() {
  const [view, setView] = useState('general');// ควบคุมการสลับหน้าจอ
  // State สำหรับเก็บข้อมูลสถิติและกราฟ
  const [stats, setStats] = useState({ totalLearners: 0, totalCourses: 0 });
  const [topCourses, setTopCourses] = useState([]);
  const [catDist, setCatDist] = useState([]);

  // State สำหรับเก็บค่าตัวกรอง (Filters)
  const [selectedCat, setSelectedCat] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange; 
  const [displayLimit, setDisplayLimit] = useState('5');

  // State สำหรับระบบ Login
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Helper function สำหรับตรวจสอบว่าวันที่อยู่ในช่วงที่เลือกหรือไม่
  const isWithinDateRange = useCallback((dateString) => {
    if (!startDate && !endDate) return true;
    
    const targetDate = new Date(dateString);
    if (startDate && targetDate < startDate) return false;
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (targetDate > end) return false;
    }
    
    return true;
  }, [startDate, endDate]);

  // ดึงข้อมูลจาก API และคำนวณสถิติ
  const fetchData = async () => {
    try {
      const [courseResponse, userResponse] = await Promise.all([
        fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course'),
        fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/total-users')
      ]);

      // แปลงข้อมูลที่ได้ให้อยู่ในรูป JSON
      const allCourses = await courseResponse.json();
      const allUsers = await userResponse.json();

      // กรองจำนวนนักเรียนตามวันที่สมัคร
      const validUsers = allUsers.filter(user => isWithinDateRange(user.createdAt));
      const totalUniqueLearners = validUsers.length;

      // กรองคอร์สตามหมวดหมู่
      const filteredCourses = selectedCat === 'all' 
        ? allCourses 
        : allCourses.filter(course => 
            course.categoryId === parseInt(selectedCat) || 
            course.category?.id === parseInt(selectedCat)
          );

      let chartBarData = [];
      const categoryCounts = {};

      filteredCourses.forEach(course => {
        const orders = course.orderDetail || [];
        // นับยอดลงทะเบียนเฉพาะช่วงวันที่เลือก
        const validOrders = orders.filter(order => isWithinDateRange(order.createdAt));

        // ถ้ามียอดคนเรียน ให้ใส่ข้อมูลลงกราฟแท่ง
        if (validOrders.length > 0 || (!startDate && !endDate)) {
          chartBarData.push({ name: course.courseName, value: validOrders.length });
        }

        // นับจำนวนวิชาในแต่ละหมวดหมู่ เพื่อทำกราฟโดนัท
        const catName = course.category?.categoryName || 'Other';
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      });

      // จัดเรียงคอร์สที่คนเรียนเยอะสุดไปน้อยสุด
      chartBarData.sort((a, b) => b.value - a.value);
      if (displayLimit !== 'all') {
        chartBarData = chartBarData.slice(0, parseInt(displayLimit)); 
      }

      const formattedCatDist = Object.keys(categoryCounts).map(key => ({ 
        label: key, 
        value: categoryCounts[key] 
      }));

      //อัปเดตลง State เพื่อให้หน้าจอเปลี่ยนตาม
      setStats({ totalLearners: totalUniqueLearners, totalCourses: filteredCourses.length });
      setTopCourses(chartBarData);
      setCatDist(formattedCatDist);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => { 
    if (view === 'general') {
      fetchData(); 
    }

  }, [selectedCat, startDate, endDate, displayLimit, view]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      // ส่ง Username/Password ไปตรวจสอบกับ API
      const response = await fetch('https://auth-mlii.mfu.ac.th/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) 
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        // บันทึก Token ลง Browser เพื่อใช้เรียก API หลังบ้าน
        localStorage.setItem('mfuAdminToken', data.accessToken);
        
        const realUser = { 
          firstname: data.firstname || 'Admin', 
          lastname: data.lastname || 'User', 
          role: data.role || 'Administrator' 
        };

        alert(`Login Success! Welcome ${realUser.firstname}`);
        setLoggedInUser(realUser);
        setView('admin'); 
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.message || "Invalid Username or Password"); 
      }
    } catch (err) {
      console.error("Login Error:", err);
      setLoginError("Failed to connect to authentication server.");
    }
  };

  // ฟังก์ชันสำหรับปุ่ม Reset Filter
  const handleResetFilter = () => {
    setSelectedCat('all');
    setDateRange([null, null]);
    setDisplayLimit('5');
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

  return (
    <>
      <nav className="top-navbar">
        <div className="navbar-brand">
          <img src={mfuLogo} alt="MFU Logo" className="navbar-logo" />
          <h2 style={{ color: '#8E1523', margin: 0, fontSize: '20px' }}>MFU Academy Dashboard</h2>
        </div>
        <div>
          <button 
            onClick={() => setView('login')} 
            style={{ 
              padding: '8px 20px', 
              borderRadius: '8px', 
              background: '#8E1523', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold' 
            }}
          >
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
              onClick={handleResetFilter} 
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
            >
              Reset Filter
            </button>
          </div>
        </div>

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
                    datasets: [{ 
                      label: 'Enrollments', 
                      data: topCourses.map(item => item.value), 
                      backgroundColor: '#8E1523', 
                      borderRadius: 4 
                    }]
                  }} 
                  options={{ 
                    indexAxis: 'y', 
                    maintainAspectRatio: false, 
                    plugins: { 
                      legend: { display: false },
                      tooltip: { callbacks: { label: (ctx) => `${ctx.raw} Learners` } }
                    },
                    scales: { 
                      x: { 
                        ticks: { stepSize: 1 },
                        title: {
                          display: true,
                          text: 'Learners',
                          align: 'center', 
                          color: '#666',
                          font: { size: 12, weight: 'bold' }
                        }
                      } 
                    } 
                  }} 
                />
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Course Categories</h3>
            <div className="doughnut-chart-content">
              <div className="doughnut-wrapper" style={{ height: '220px', position: 'relative' }}>
                <DoughnutChart 
                  data={{
                    labels: catDist.map(item => item.label), 
                    datasets: [{ 
                      data: catDist.map(item => item.value), 
                      backgroundColor: CATEGORY_COLORS, 
                      borderWidth: 0, 
                      hoverOffset: 5 
                    }]
                  }} 
                  options={{ 
                    cutout: '65%', 
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: { callbacks: { label: (ctx) => `${ctx.raw} Courses` } }
                    } 
                  }}
                />
              </div>
              <div className="custom-legend-bottom" style={{ marginTop: '20px' }}>
                {catDist.map((item, index) => (
                  <div key={index} className="legend-item-horizontal" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <div className="legend-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555' }}>
                      <span className="legend-dot" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}></span>
                      <span className="legend-text">{item.label}</span>
                    </div>
                    <div className="legend-value" style={{ fontWeight: '600', color: '#333' }}>
                      {item.value.toLocaleString()} Courses
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;