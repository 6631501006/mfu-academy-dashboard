import React, { useState, useEffect } from 'react';
import { CSVLink } from "react-csv";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function AnalyticsReports() {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [monthlyChartData, setMonthlyChartData] = useState(new Array(12).fill(0));
  const [analyticsStats, setAnalyticsStats] = useState({ totalLearners: 0, successfulEnrollments: 0 });
  const [reportData, setReportData] = useState([]);

  // State สำหรับเก็บข้อมูลดิบ
  const [rawCourses, setRawCourses] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawIncome, setRawIncome] = useState([]); 

  const [monthlyIncomeData, setMonthlyIncomeData] = useState(new Array(12).fill(0));
  const [monthlyIncomeDetails, setMonthlyIncomeDetails] = useState(Array.from({ length: 12 }, () => ({})));

  // 1. ดึงข้อมูล Public (คอร์สและผู้ใช้) 
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const courseRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course');
        const courses = await courseRes.json();
        
        const userRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/total-users');
        const users = await userRes.json();

        setRawCourses(courses);
        setRawUsers(users);

        const cats = [];
        const catMap = new Set();
        courses.forEach(c => {
          if (c.category && !catMap.has(c.category.id)) {
            catMap.add(c.category.id);
            cats.push({ id: c.category.id, name: c.category.categoryName });
          }
        });
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching Public Data:", error);
      }
    };
    fetchPublicData();
  }, []);

  // 👇 2. ดึงข้อมูลรายได้ (Income) -> แก้ให้ดึงแค่ครั้งเดียว และดึงมา "ทั้งหมดทุกปี"
  useEffect(() => {
    const fetchIncomeData = async () => {
      const token = localStorage.getItem('mfuAdminToken');
      if (token) {
        try {
          const incomeRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/income-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
            // 💥 เอา body ที่ส่ง year ออกไป เพื่อให้ API คายข้อมูลทั้งหมดมาให้เรา
          });
          const incomeData = await incomeRes.json();
          setRawIncome(Array.isArray(incomeData) ? incomeData : []);
        } catch (err) {
          console.error("Failed to fetch income data", err);
        }
      }
    };
    fetchIncomeData();
  }, []); // 💥 เอา selectedYear ออกจากวงเล็บนี้ เพื่อไม่ให้มันยิง API พร่ำเพรื่อ

 // 3. ประมวลผลและคำนวณข้อมูลทั้งหมด
 useEffect(() => {
  if (rawCourses.length === 0) return;

  let enrollmentsCount = 0;
  let mData = new Array(12).fill(0); 

  // --- ส่วนที่ 1: กราฟจำนวนคนลงทะเบียน (จาก all-course) ---
  let filteredCourses = rawCourses;
  if (selectedCat !== 'all') {
    filteredCourses = rawCourses.filter(c => c.category?.id === parseInt(selectedCat) || c.categoryId === parseInt(selectedCat));
  }

  filteredCourses.forEach(course => {
    const orders = course.orderDetail || [];
    enrollmentsCount += orders.length; 
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      if (date.getFullYear().toString() === selectedYear) {
        mData[date.getMonth()] += 1;
      }
    });
  });

  // --- ส่วนที่ 2: กราฟรายได้ และ Export CSV (จาก income-report โดยตรง) ---
  let mIncome = new Array(12).fill(0); 
  let mIncomeDetails = Array.from({ length: 12 }, () => ({})); 
  let csvData = []; 

  rawIncome.forEach(item => {
    // 👇 สลับเอา createdAt ขึ้นก่อน เพราะมันเก็บเวลาแม่นยำกว่า orderDateTime ที่มักจะตัดเป็นเที่ยงคืน
    const dateStr = item.createdAt || item.orderDateTime;
    if (!dateStr) return;

    const date = new Date(dateStr);
    
    const price = Number(item.amount || item.detailSumTotal || 0); 
    const finalCourseName = item.courseName || `Course ID: ${item.courseId}`;

    const matchedCourse = rawCourses.find(c => c.id === item.courseId);
    const categoryName = matchedCourse?.category?.categoryName || 'Other';

    if (selectedCat !== 'all') {
      const catId = matchedCourse?.category?.id || matchedCourse?.categoryId;
      if (catId !== parseInt(selectedCat)) return; 
    }

    // 👇 ประกอบร่างเวลาเอง (HH:mm:ss) เพื่อบังคับให้ Excel แสดงผลแบบข้อความ ไม่ให้มันซ่อน
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    // 💥 1. ยัดลงไฟล์ Excel ทันที!
    csvData.push({
      "Order No.": item.orderNo || "-",
      "Learner Name": `${item.customerFirstname || item.userFirstname || ''} ${item.customerLastname || item.userLastname || ''}`.trim(),
      "Course Name": finalCourseName,
      "Category": categoryName,
      "Price (THB)": price,
      "Date": date.toLocaleDateString('th-TH'),
      "Time": formattedTime // ใช้เวลาที่เราประกอบร่างเอง
    });

    // 💥 2. ทำกราฟรายได้ (ครอบด้วย if เช็คปี เพื่อให้กราฟเปลี่ยนตาม Dropdown)
    if (date.getFullYear().toString() === selectedYear) {
      const monthIndex = date.getMonth();
      mIncome[monthIndex] += price;
      if (!mIncomeDetails[monthIndex][finalCourseName]) {
        mIncomeDetails[monthIndex][finalCourseName] = { count: 0, total: 0 };
      }
      mIncomeDetails[monthIndex][finalCourseName].count += 1;
      mIncomeDetails[monthIndex][finalCourseName].total += price;
    }
  });

  setMonthlyChartData(mData);
  setMonthlyIncomeData(mIncome); 
  setMonthlyIncomeDetails(mIncomeDetails); 
  setReportData(csvData); 
  setAnalyticsStats({ totalLearners: rawUsers.length, successfulEnrollments: enrollmentsCount });

}, [selectedCat, selectedYear, rawCourses, rawUsers, rawIncome]);

  return (
    <div className="analytics-page">
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
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* 👇 เปลี่ยนชื่อไฟล์ให้สื่อว่าดึงมาหมดทุกปีแล้ว (All Years) */}
        <CSVLink data={reportData} filename={`MFU-Academy-IncomeReport-AllYears.csv`} className="btn-export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Report
        </CSVLink>
      </div>

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

      <div className="admin-chart-container" style={{ marginTop: '24px' ,background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Enrollment Trends</h3>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', outline: 'none' }}>
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
              plugins: { 
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw} Enrollments` } } 
              },
              scales: {
                y: { beginAtZero: true, min: 0, ticks: { stepSize: 1, color: '#999', font: { size: 12 } }, grid: { color: '#f0f0f0', borderDash: [5, 5] }, title: { display: true, text: 'Enrollments', align: 'null', color: '#8E1523', font: { size: 12, weight: 'bold' } } },
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
              datasets: [{
                label: 'Income (THB)',
                data: monthlyIncomeData,
                backgroundColor: '#D4A038', 
                borderRadius: 4
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                legend: { display: false },
                tooltip: { 
                  titleFont: { size: 14 },
                  bodyFont: { size: 13 },
                  padding: 12,
                  callbacks: { 
                    label: (ctx) => `Total Income: ฿${ctx.raw.toLocaleString()}`,
                    afterBody: (ctxItems) => {
                      const monthIndex = ctxItems[0].dataIndex;
                      const details = monthlyIncomeDetails[monthIndex];
                      
                      if (!details || Object.keys(details).length === 0) return [];
                      
                      let lines = ['', '--- Course Breakdown ---'];
                      Object.entries(details).forEach(([courseName, data]) => {
                        lines.push(`• ${courseName}: ${data.count} sold (฿${data.total.toLocaleString()})`);
                      });
                      
                      return lines;
                    }
                  } 
                } 
              },
              scales: {
                y: { 
                  beginAtZero: true, 
                  min: 0, 
                  ticks: { 
                    color: '#999', 
                    font: { size: 12 },
                    callback: function(value) { return '฿' + value.toLocaleString(); }
                  }, 
                  grid: { color: '#f0f0f0', borderDash: [5, 5] }, 
                  title: { display: true, text: 'Income (THB)', align: 'null', color: '#D4A038', font: { size: 12, weight: 'bold' } } 
                },
                x: { grid: { display: false }, ticks: { color: '#999', font: { size: 12 } } }
              }
            }}
          />
        </div>
      </div>

    </div>
  );
}

export default AnalyticsReports;