import React, { useState, useEffect } from 'react';
import { CSVLink } from "react-csv";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function AnalyticsReports() {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  
  const [monthlyLearnersChart, setMonthlyLearnersChart] = useState(new Array(12).fill(0));
  const [monthlyPurchasedChart, setMonthlyPurchasedChart] = useState(new Array(12).fill(0));
  
  // 👇 เพิ่ม State สำหรับควบคุมการ เปิด-ปิด เส้นกราฟ เหมือนหน้า Dashboard
  const [showLearners, setShowLearners] = useState(true);
  const [showPurchased, setShowPurchased] = useState(true);

  const [analyticsStats, setAnalyticsStats] = useState({ totalLearners: 0, purchasedCourses: 0 }); 
  const [reportData, setReportData] = useState([]);

  const [rawCourses, setRawCourses] = useState([]);
  const [rawUsers, setRawUsers] = useState([]); 
  const [rawIncome, setRawIncome] = useState([]); 

  const [monthlyIncomeData, setMonthlyIncomeData] = useState(new Array(12).fill(0));
  const [monthlyIncomeDetails, setMonthlyIncomeDetails] = useState(Array.from({ length: 12 }, () => ({})));

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const courseRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course');
        const courses = await courseRes.json();
        const userRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/total-users');
        const users = await userRes.json();
        setRawCourses(courses);
        setRawUsers(users); 
      } catch (error) { console.error("Error fetching Public Data:", error); }
    };
    fetchPublicData();
  }, []);

  useEffect(() => {
    const fetchIncomeData = async () => {
      const token = localStorage.getItem('mfuAdminToken');
      if (token) {
        try {
          const incomeRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/income-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          });
          const incomeData = await incomeRes.json();
          setRawIncome(Array.isArray(incomeData) ? incomeData : []);
        } catch (err) { console.error("Failed to fetch income data", err); }
      }
    };
    fetchIncomeData();
  }, []); 

useEffect(() => {
  if (rawCourses.length === 0 || rawUsers.length === 0) return;

  let totalLearnersCount = 0;
  let mLearners = new Array(12).fill(0); 

  rawUsers.forEach(user => {
    if (!user.createdAt) return;
    const joinDate = new Date(user.createdAt);
    
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      end.setHours(23, 59, 59, 999);
      if (joinDate < start || joinDate > end) return;
    }

    const joinYear = joinDate.getFullYear().toString();
    totalLearnersCount++;

    if (joinYear === selectedYear) {
      mLearners[joinDate.getMonth()] += 1;
    }
  });

  let purchasedCount = 0;
  let mPurchased = new Array(12).fill(0); 
  let mIncome = new Array(12).fill(0); 
  let mIncomeDetails = Array.from({ length: 12 }, () => ({})); 
  let csvData = []; 

  rawIncome.forEach(item => {
    const dateStr = item.createdAt || item.orderDateTime;
    if (!dateStr) return;

    const date = new Date(dateStr);

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      end.setHours(23, 59, 59, 999);
      if (date < start || date > end) return;
    }

    const orderYear = date.getFullYear().toString();
    const price = Number(item.amount || item.detailSumTotal || 0); 
    const finalCourseName = item.courseName || `Course ID: ${item.courseId}`;
    const matchedCourse = rawCourses.find(c => c.id === item.courseId);
    const categoryName = matchedCourse?.category?.categoryName || 'Other';

    if (selectedCourse !== 'all') {
      if (item.courseId !== parseInt(selectedCourse)) return; 
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    csvData.push({
      "Course Name": finalCourseName,
      "Category": categoryName,
      "Learner Name": `${item.customerFirstname || item.userFirstname || ''} ${item.customerLastname || item.userLastname || ''}`.trim(),
      "Price (THB)": price,
      "Date": date.toLocaleDateString('th-TH'),
      "Time": formattedTime 
    });

    purchasedCount++;

    if (orderYear === selectedYear) {
      const monthIndex = date.getMonth();
      mPurchased[monthIndex] += 1;
      mIncome[monthIndex] += price;
      
      if (!mIncomeDetails[monthIndex][finalCourseName]) {
        mIncomeDetails[monthIndex][finalCourseName] = { count: 0, total: 0 };
      }
      mIncomeDetails[monthIndex][finalCourseName].count += 1;
      mIncomeDetails[monthIndex][finalCourseName].total += price;
    }
  });

  setMonthlyLearnersChart(mLearners);
  setMonthlyPurchasedChart(mPurchased);
  setMonthlyIncomeData(mIncome); 
  setMonthlyIncomeDetails(mIncomeDetails); 
  setReportData(csvData); 
  
  setAnalyticsStats({ totalLearners: totalLearnersCount, purchasedCourses: purchasedCount });

}, [selectedCourse, selectedYear, rawCourses, rawUsers, rawIncome, startDate, endDate]);

  return (
    <div className="analytics-page">
      <div className="analytics-filter-container" style={{ flexWrap: 'wrap' }}>
        <div className="filter-left" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="filter-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Course:</span>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="category-select" style={{ maxWidth: '200px' }}>
              <option value="all">All Courses</option>
              {rawCourses.map(course => (<option key={course.id} value={course.id}>{course.courseName}</option>))}
            </select>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9f9f9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd' }}>
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

        </div>

        <CSVLink data={reportData} filename={`MFU-Academy-AnalyticsReport-AllYears.csv`} className="btn-export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Report
        </CSVLink>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-card">
          <div className="card-info"><p>Total Learners (Users)</p><h3>{analyticsStats.totalLearners.toLocaleString()}</h3></div>
          <div className="card-icon blue-icon"><span>🎓</span></div>
        </div>
        <div className="admin-card">
          <div className="card-info"><p>Purchased Courses</p><h3>{analyticsStats.purchasedCourses.toLocaleString()}</h3></div>
          <div className="card-icon red-icon"><span>📖</span></div>
        </div>
      </div>

      <div className="admin-chart-container" style={{ marginTop: '24px' ,background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Enrollment Trends</h3>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* 👇 เพิ่มลูกเล่นคลิกเปิด-ปิดเส้นกราฟ เหมือนหน้า Dashboard */}
            <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>
              <span 
                onClick={() => setShowLearners(!showLearners)} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: showLearners ? 1 : 0.4, transition: '0.2s', fontWeight: showLearners ? '600' : 'normal' }}
              >
                <div style={{width: 12, height: 12, borderRadius: '50%', background: '#2563EB'}}></div> Learners
              </span>
              <span 
                onClick={() => setShowPurchased(!showPurchased)} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: showPurchased ? 1 : 0.4, transition: '0.2s', fontWeight: showPurchased ? '600' : 'normal' }}
              >
                <div style={{width: 12, height: 12, borderRadius: '50%', background: '#8E1523'}}></div> Purchased
              </span>
            </div>

            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', outline: 'none' }}>
              <option value="2024">Year 2024</option><option value="2025">Year 2025</option><option value="2026">Year 2026</option>
            </select>
          </div>
        </div>
        <div style={{ height: '350px', width: '100%' }}>
          <Line 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                { 
                  label: 'Learners (Users)', 
                  data: monthlyLearnersChart, 
                  hidden: !showLearners, // 👇 เชื่อมกับ State เพื่อปิดเส้นเมื่อโดนคลิก
                  borderColor: '#2563EB', 
                  backgroundColor: '#2563EB', 
                  borderWidth: 3, 
                  pointBackgroundColor: '#2563EB', 
                  pointRadius: 4, 
                  tension: 0.4 
                },
                { 
                  label: 'Purchased Courses', 
                  data: monthlyPurchasedChart, 
                  hidden: !showPurchased, // 👇 เชื่อมกับ State เพื่อปิดเส้นเมื่อโดนคลิก
                  borderColor: '#8E1523', 
                  backgroundColor: '#8E1523', 
                  borderWidth: 3, 
                  pointBackgroundColor: '#8E1523', 
                  pointRadius: 4, 
                  tension: 0.4 
                }
              ]
            }}
            options={{
              responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => { if(ctx.datasetIndex === 0) return `${ctx.raw} Users`; return `${ctx.raw} Courses`; } } } },
              scales: { 
                // ซ่อนสเกลแกน Y ถ้าปิดทั้ง 2 เส้น
                y: { display: (showLearners || showPurchased), beginAtZero: true, min: 0, ticks: { stepSize: 1, color: '#999', font: { size: 12 } }, grid: { color: '#f0f0f0', borderDash: [5, 5] }, title: { display: true, text: 'Count', color: '#333', font: { size: 12, weight: 'bold' } } }, 
                x: { grid: { display: false }, ticks: { color: '#999', font: { size: 12 } } } 
              }
            }}
          />
        </div>
      </div>

      <div className="admin-chart-container" style={{ marginTop: '24px' ,background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Monthly Income Breakdown</h3>
          <span style={{ fontSize: '12px', color: '#888' }}>* Hover on bars to see course details</span>
        </div>
        <div style={{ height: '350px', width: '100%' }}>
          <Bar 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [{ label: 'Income (THB)', data: monthlyIncomeData, backgroundColor: '#D4A038', borderRadius: 4 }]
            }}
            options={{
              responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { titleFont: { size: 14 }, bodyFont: { size: 13 }, padding: 12, callbacks: { label: (ctx) => `Total Income: ฿${ctx.raw.toLocaleString()}`, afterBody: (ctxItems) => { const monthIndex = ctxItems[0].dataIndex; const details = monthlyIncomeDetails[monthIndex]; if (!details || Object.keys(details).length === 0) return []; let lines = ['', '--- Course Breakdown ---']; Object.entries(details).forEach(([courseName, data]) => { lines.push(`• ${courseName}: ${data.count} sold (฿${data.total.toLocaleString()})`); }); return lines; } } } },
              scales: { y: { beginAtZero: true, min: 0, ticks: { color: '#999', font: { size: 12 }, callback: function(value) { return '฿' + value.toLocaleString(); } }, grid: { color: '#f0f0f0', borderDash: [5, 5] }, title: { display: true, text: 'Income (THB)',  color: '#D4A038', font: { size: 12, weight: 'bold' } } }, x: { grid: { display: false }, ticks: { color: '#999', font: { size: 12 } } } }
            }}
          />
        </div>
      </div>

    </div>
  );
}

export default AnalyticsReports;