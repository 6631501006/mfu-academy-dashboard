import React, { useState, useEffect } from 'react';
import { CSVLink } from "react-csv";
// 👇 1. Import เครื่องมือกราฟ
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// 👇 2. Register กราฟ
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function AnalyticsReports() {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  
  // 👇 3. เพิ่ม State สำหรับเลือกปี และเก็บข้อมูลกราฟ
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyChartData, setMonthlyChartData] = useState(new Array(12).fill(0));

  const [analyticsStats, setAnalyticsStats] = useState({ totalLearners: 0, successfulEnrollments: 0 });
  const [reportData, setReportData] = useState([]);

  // ดึงข้อมูลหมวดหมู่ (ทำครั้งเดียว)
  useEffect(() => {
    fetch('http://localhost:5001/api/categories')
      .then(res => res.json()).then(data => setCategories(data)).catch(err => console.error(err));
  }, []);

  // ดึงข้อมูลสถิติ และ กราฟ (อัปเดตเมื่อเปลี่ยน หมวดหมู่ หรือ ปี)
  useEffect(() => {
    // 1. ดึงตัวเลขการ์ด
    fetch(`http://localhost:5001/api/analytics-stats?catId=${selectedCat}`)
      .then(res => res.json()).then(data => setAnalyticsStats(data)).catch(err => console.error(err));

    // 2. ดึงข้อมูลสำหรับ Export
    fetch(`http://localhost:5001/api/sales-report?catId=${selectedCat}`)
      .then(res => res.json()).then(data => setReportData(data)).catch(err => console.error(err));

    // 👇 3. ดึงข้อมูลกราฟเส้นรายเดือน
    fetch(`http://localhost:5001/api/analytics-monthly-enrollments?catId=${selectedCat}&year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        let chartData = new Array(12).fill(0); // สร้าง 0 รอไว้ 12 เดือน
        data.forEach(item => {
          const m = parseInt(item.month);
          if(m >= 1 && m <= 12) {
            chartData[m - 1] = parseInt(item.total_enrollments);
          }
        });
        setMonthlyChartData(chartData);
      })
      .catch(err => console.error("Error fetching line chart:", err));

  }, [selectedCat, selectedYear]); // 👈 สั่งให้โหลดใหม่เมื่อเปลี่ยนหมวดหมู่หรือปี

  return (
    <div className="analytics-page">
      
      {/* --- แถบ Filter และปุ่ม Export --- */}
      <div className="analytics-filter-container">
        <div className="filter-left">
          <span className="filter-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Select Category:
          </span>
          <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="category-select">
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
        </div>

        <CSVLink data={reportData} filename={`MFU-Academy-Report-${selectedCat === 'all' ? 'All' : selectedCat}.csv`} className="btn-export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Report
        </CSVLink>
      </div>

      {/* --- Stat Cards --- */}
      <div className="analytics-cards-grid">
        <div className="analytics-simple-card">
          <p>Total Learners (Unique Users)</p>
          <h3>{analyticsStats.totalLearners.toLocaleString()}</h3>
        </div>
        <div className="analytics-simple-card">
          <p>Successful Enrollments (Total Courses)</p>
          <h3>{analyticsStats.successfulEnrollments.toLocaleString()}</h3>
        </div>
      </div>

      {/* --- 👇 กราฟแนวโน้มการซื้อคอร์ส 👇 --- */}
      <div className="admin-chart-container" style={{ marginTop: '24px' ,bbackground: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Enrollment Trends</h3>
          
          {/* Dropdown เลือกปีสำหรับกราฟนี้ */}
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', outline: 'none' }}
          >
            <option value="2024">Year 2024</option>
            <option value="2025">Year 2025</option>
            <option value="2026">Year 2026</option>
          </select>
        </div>

        <div style={{ height: '350px', width: '100%' }}>
          <Line 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [{
                label: 'Course Enrollments',
                data: monthlyChartData,
                borderColor: '#8E1523', // เส้นสีแดง MFU
                backgroundColor: '#8E1523',
                borderWidth: 3,
                pointBackgroundColor: '#8E1523',
                pointRadius: 4,
                tension: 0.4 // ทำให้เส้นสมูท
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } }, // ซ่อนกล่องสีด้านบน
              scales: {
                y: { 
                  beginAtZero: true,
                  min: 0,
                  ticks: { 
                    stepSize: 1, // บังคับให้แกน Y เป็นจำนวนเต็ม (เพราะคนซื้อ 1.5 คอร์สไม่ได้)
                    color: '#999', 
                    font: { size: 12 } 
                  },
                  grid: { color: '#f0f0f0', borderDash: [5, 5] }
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
  );
}

export default AnalyticsReports;