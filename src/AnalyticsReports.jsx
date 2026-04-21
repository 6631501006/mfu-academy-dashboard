import React, { useState, useEffect, useCallback } from 'react';
import { CSVLink } from "react-csv";
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function AnalyticsReports() {
  
  // State สำหรับ Filters
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  
  // State สำหรับเก็บข้อมูลกราฟและสถิติ
  const [monthlyLearnersChart, setMonthlyLearnersChart] = useState(new Array(12).fill(0));
  const [monthlyPurchasedChart, setMonthlyPurchasedChart] = useState(new Array(12).fill(0));
  const [monthlyIncomeData, setMonthlyIncomeData] = useState(new Array(12).fill(0));
  const [monthlyIncomeDetails, setMonthlyIncomeDetails] = useState(Array.from({ length: 12 }, () => ({})));
  
  const [analyticsStats, setAnalyticsStats] = useState({ totalLearners: 0, purchasedCourses: 0 }); 
  const [reportData, setReportData] = useState([]); // สำหรับ CSV Export

  // State สำหรับเก็บข้อมูลดิบจาก API
  const [rawCourses, setRawCourses] = useState([]);
  const [rawUsers, setRawUsers] = useState([]); 
  const [rawIncome, setRawIncome] = useState([]); 

  // State สำหรับ Interactive Legend
  const [showLearners, setShowLearners] = useState(true);
  const [showPurchased, setShowPurchased] = useState(true);

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

  // ดึงข้อมูล Public (วิชาและผู้ใช้) เมื่อหน้าเว็บโหลดครั้งแรก
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [courseRes, userRes] = await Promise.all([
          fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course'),
          fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/total-users')
        ]);
        
        const courses = await courseRes.json();
        const users = await userRes.json();
        
        setRawCourses(courses);
        setRawUsers(users); 
      } catch (error) { 
        console.error("Error fetching Public Data:", error); 
      }
    };
    fetchPublicData();
  }, []);

  // ดึงข้อมูล Private (รายได้)
  useEffect(() => {
    const fetchIncomeData = async () => {
      const token = localStorage.getItem('mfuAdminToken');
      if (!token) return;

      try {
        const incomeRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/income-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const incomeData = await incomeRes.json();
        setRawIncome(Array.isArray(incomeData) ? incomeData : []);
      } catch (err) { 
        console.error("Failed to fetch income data:", err); 
      }
    };
    fetchIncomeData();
  }, []); 

  useEffect(() => {
    // ป้องกันการทำงานหากยังดึงข้อมูลไม่เสร็จ
    if (rawCourses.length === 0 || rawUsers.length === 0) return;

    // ประมวลผล Users (Learners)
    let totalLearnersCount = 0;
    let tempMonthlyLearners = new Array(12).fill(0); 

    rawUsers.forEach(user => {
      if (!user.createdAt || !isWithinDateRange(user.createdAt)) return;

      totalLearnersCount++;

      // เก็บยอดรวมรายเดือน ตามปีที่เลือกใน Dropdown
      const joinDate = new Date(user.createdAt);
      if (joinDate.getFullYear().toString() === selectedYear) {
        tempMonthlyLearners[joinDate.getMonth()] += 1;
      }
    });

    // ประมวลผล Income & Purchased Courses 
    let purchasedCount = 0;
    let tempMonthlyPurchased = new Array(12).fill(0); 
    let tempMonthlyIncome = new Array(12).fill(0); 
    let tempIncomeDetails = Array.from({ length: 12 }, () => ({})); 
    let csvData = []; 

    rawIncome.forEach(item => {
      const dateStr = item.createdAt || item.orderDateTime;
      if (!dateStr || !isWithinDateRange(dateStr)) return;

      // กรองตามรายวิชา
      if (selectedCourse !== 'all' && item.courseId !== parseInt(selectedCourse)) return; 

      const date = new Date(dateStr);
      const orderYear = date.getFullYear().toString();
      const price = Number(item.amount || item.detailSumTotal || 0); 
      const matchedCourse = rawCourses.find(c => c.id === item.courseId);
      
      const finalCourseName = matchedCourse?.courseName || `Course ID: ${item.courseId}`;
      const categoryName = matchedCourse?.category?.categoryName || 'Other';

      // จัดเตรียมข้อมูลสำหรับ Export CSV
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      csvData.push({
        "Course Name": finalCourseName,
        "Category": categoryName,
        "Learner Name": `${item.customerFirstname || item.userFirstname || ''} ${item.customerLastname || item.userLastname || ''}`.trim(),
        "Price (THB)": price,
        "Date": date.toLocaleDateString('th-TH'),
        "Time": `${hours}:${minutes}:${seconds}`
      });

      purchasedCount++;

      // สะสมยอดกราฟ (รายเดือน) ตามปีที่เลือก
      if (orderYear === selectedYear) {
        const monthIdx = date.getMonth();
        tempMonthlyPurchased[monthIdx] += 1;
        tempMonthlyIncome[monthIdx] += price;
        
        // บันทึกรายละเอียดการขายรายวิชาในเดือนนั้น (ใช้แสดงใน Tooltip กราฟแท่ง)
        if (!tempIncomeDetails[monthIdx][finalCourseName]) {
          tempIncomeDetails[monthIdx][finalCourseName] = { count: 0, total: 0 };
        }
        tempIncomeDetails[monthIdx][finalCourseName].count += 1;
        tempIncomeDetails[monthIdx][finalCourseName].total += price;
      }
    });

    // อัปเดต State
    setMonthlyLearnersChart(tempMonthlyLearners);
    setMonthlyPurchasedChart(tempMonthlyPurchased);
    setMonthlyIncomeData(tempMonthlyIncome); 
    setMonthlyIncomeDetails(tempIncomeDetails); 
    setReportData(csvData); 
    setAnalyticsStats({ 
      totalLearners: totalLearnersCount, 
      purchasedCourses: purchasedCount 
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, selectedYear, rawCourses, rawUsers, rawIncome, startDate, endDate]);

  return (
    <div className="analytics-page">
      
      {/* Filter Bar */}
      <div className="analytics-filter-container" style={{ flexWrap: 'wrap' }}>
        <div className="filter-left" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="filter-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg> Course:
            </span>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="category-select" style={{ maxWidth: '200px' }}>
              <option value="all">All Courses</option>
              {rawCourses.map(course => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
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

        {/* ปุ่ม Export CSV */}
        <CSVLink data={reportData} filename={`MFU-Academy-AnalyticsReport-AllYears.csv`} className="btn-export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Report
        </CSVLink>
      </div>

      {/* Card */}
      <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-card">
          <div className="card-info">
            <p>Total Learners (Users)</p>
            <h3>{analyticsStats.totalLearners.toLocaleString()}</h3>
          </div>
          <div className="card-icon blue-icon"><span>🎓</span></div>
        </div>
        <div className="admin-card">
          <div className="card-info">
            <p>Purchased Courses</p>
            <h3>{analyticsStats.purchasedCourses.toLocaleString()}</h3>
          </div>
          <div className="card-icon red-icon"><span>📖</span></div>
        </div>
      </div>

      {/* --- Line Chart (Enrollments) --- */}
      <div className="admin-chart-container" style={{ marginTop: '24px' ,background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Enrollment Trends</h3>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* คลิกเพื่อซ่อน/แสดงเส้นกราฟ */}
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
              {/* Filter ปีในกราฟ*/}
              <option value="2024">Year 2024</option>
              <option value="2025">Year 2025</option>
              <option value="2026">Year 2026</option>
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
                  hidden: !showLearners, 
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
                  hidden: !showPurchased, 
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
              responsive: true, 
              maintainAspectRatio: false, 
              plugins: { 
                legend: { display: false }, 
                tooltip: { 
                  callbacks: { 
                    label: (ctx) => ctx.datasetIndex === 0 ? `${ctx.raw} Users` : `${ctx.raw} Courses`
                  } 
                } 
              },
              scales: { 
                y: { 
                  display: (showLearners || showPurchased), 
                  beginAtZero: true, 
                  min: 0, 
                  ticks: { stepSize: 1, color: '#999', font: { size: 12 } }, 
                  grid: { color: '#f0f0f0', borderDash: [5, 5] }, 
                  title: { display: true, text: 'Count', color: '#333', font: { size: 12, weight: 'bold' } } 
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

      {/* --- Bar Chart (Income Breakdown) --- */}
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
                    callback: (value) => '฿' + value.toLocaleString()
                  }, 
                  grid: { color: '#f0f0f0', borderDash: [5, 5] }, 
                  title: { display: true, text: 'Income (THB)', color: '#D4A038', font: { size: 12, weight: 'bold' } } 
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