import React, { useState, useEffect, useCallback } from 'react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const CATEGORY_COLORS = ['#8E1523', '#D4A038', '#C42026', '#E06D53', '#E8907E', '#4C5A73'];

function DashboardOverview() {
  
  // State สำหรับเก็บค่า Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // State สำหรับเก็บข้อมูลภาพรวม 
  const [adminStats, setAdminStats] = useState({ 
    totalRevenue: 0, 
    totalCourses: 0, 
    totalLearners: 0 
  });
  
  // State สำหรับเก็บข้อมูลกราฟ
  const [categoryDist, setCategoryDist] = useState([]);
  const [monthlyLearnersData, setMonthlyLearnersData] = useState(new Array(12).fill(0));
  const [monthlyIncomeData, setMonthlyIncomeData] = useState(new Array(12).fill(0));

  // State สำหรับควบคุมการเปิด-ปิดเส้นกราฟ 
  const [showLearners, setShowLearners] = useState(true);
  const [showIncome, setShowIncome] = useState(true);

  // ฟังก์ชันตรวจสอบว่าวันที่อยู่ในช่วงที่เลือกหรือไม่
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
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        //  ดึงข้อมูล Course
        const courseRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course');
        const allCourses = await courseRes.json();

        let totalLearnersCount = 0;
        let tempMonthlyLearners = new Array(12).fill(0);
        let categoryCounts = {};

        // ประมวลผลข้อมูล Course เพื่อคำนวณสถิติและจัดเตรียมข้อมูลสำหรับกราฟ
        allCourses.forEach(course => {
          const orders = course.orderDetail || [];
          const catName = course.category?.categoryName || 'Other';
          
          // เก็บสถิติจำนวนวิชาในแต่ละหมวดหมู่
          categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;

          // ละเว้นการนับ E-book หรือ In-house จากยอดนักเรียน
          const isEbookOrInhouse = catName.toLowerCase().includes('e-book') || catName.toLowerCase().includes('in-house');
          
          if (!isEbookOrInhouse) {
            orders.forEach(order => {
              if (!isWithinDateRange(order.createdAt)) return;

              totalLearnersCount += 1;

              // สะสมยอดเข้ากราฟตามปีที่เลือกใน Dropdown
              const orderDate = new Date(order.createdAt);
              if (orderDate.getFullYear().toString() === selectedYear) {
                tempMonthlyLearners[orderDate.getMonth()] += 1; 
              }
            });
          }
        });

        const formattedCatDist = Object.keys(categoryCounts).map(key => ({ 
          label: key, 
          value: categoryCounts[key] 
        }));


        // ดึงข้อมูลรายได้
        let totalRevenueSum = 0;
        let tempMonthlyIncome = new Array(12).fill(0); 
        const token = localStorage.getItem('mfuAdminToken');

        if (token) {
          try {
            const incomeRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/income-report', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
              }
            });
            const incomeData = await incomeRes.json();
            
            if (Array.isArray(incomeData)) {
              incomeData.forEach(item => {
                const dateStr = item.createdAt || item.orderDate || item.date;
                if (!dateStr) return;
                if (!isWithinDateRange(dateStr)) return;

                const amount = Number(item.amount || item.price || item.total || 0);
                totalRevenueSum += amount;
                
                const d = new Date(dateStr);
                if (d.getFullYear().toString() === selectedYear) {
                  tempMonthlyIncome[d.getMonth()] += amount; 
                }
              });
            }
          } catch (e) { 
            console.error("Failed to fetch income report", e); 
          }
        }

        // อัพเดท State
        setMonthlyLearnersData(tempMonthlyLearners);
        setMonthlyIncomeData(tempMonthlyIncome); 
        setCategoryDist(formattedCatDist);
        setAdminStats({ 
          totalCourses: allCourses.length, 
          totalLearners: totalLearnersCount, 
          totalRevenue: totalRevenueSum 
        });

      } catch (error) { 
        console.error("Error fetching dashboard data:", error); 
      }
    };

    fetchDashboardData();
    
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, startDate, endDate]);

  return (
    <div>
      {/* --- Filter --- */}
      <div className="analytics-filter-container" style={{ marginBottom: '24px', display: 'flex', gap: '20px', background: '#fff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #eaeaea', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9f9f9', padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <span style={{ fontSize: '14px', color: '#555' }}>📅 Filter by Date:</span>
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

      {/* --- Card --- */}
      <div className="admin-stat-grid">
        <div className="admin-card">
          <div className="card-info">
            <p>Total Gross Revenue</p>
            <h3>฿{adminStats.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="card-icon green-icon"><span>$</span></div>
        </div>
        <div className="admin-card">
          <div className="card-info">
            <p>Total Courses</p>
            <h3>{adminStats.totalCourses.toLocaleString()}</h3>
          </div>
          <div className="card-icon red-icon"><span>📖</span></div>
        </div>
        <div className="admin-card">
          <div className="card-info">
            <p>Total Learners</p>
            <h3>{adminStats.totalLearners.toLocaleString()}</h3>
          </div>
          <div className="card-icon blue-icon"><span>🎓</span></div>
        </div>
      </div>

      {/* --- Line Chart (Enrollments & Income) --- */}
      <div className="admin-chart-container" style={{ marginTop: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        
        {/* Header กราฟ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Monthly Course Enrollments & Income</h3>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* คลิกเพื่อซ่อน/แสดงเส้นกราฟ */}
            <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>
              <span onClick={() => setShowLearners(!showLearners)} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: showLearners ? 1 : 0.4, transition: '0.2s', fontWeight: showLearners ? '600' : 'normal' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#8E1523' }}></div> Learners
              </span>
              <span onClick={() => setShowIncome(!showIncome)} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: showIncome ? 1 : 0.4, transition: '0.2s', fontWeight: showIncome ? '600' : 'normal' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#D4A038' }}></div> Income
              </span>
            </div>
            
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', outline: 'none' }}>
              {/* Filter ปีในกราฟ*/}
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        {/* ตัวกราฟ Line */}
        <div style={{ height: '350px', width: '100%' }}>
          <Line 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                { 
                  label: 'Learners', 
                  data: monthlyLearnersData, 
                  hidden: !showLearners, 
                  borderColor: '#8E1523', 
                  backgroundColor: '#8E1523', 
                  borderWidth: 3, 
                  pointBackgroundColor: '#8E1523', 
                  pointRadius: 4, 
                  tension: 0.4, 
                  yAxisID: 'y' 
                },
                { 
                  label: 'Income', 
                  data: monthlyIncomeData, 
                  hidden: !showIncome, 
                  borderColor: '#D4A038', 
                  backgroundColor: '#D4A038', 
                  borderWidth: 3, 
                  pointBackgroundColor: '#D4A038', 
                  pointRadius: 4, 
                  tension: 0.4, 
                  yAxisID: 'y1' 
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
                    label: (ctx) => { 
                      if (ctx.datasetIndex === 0) return `${ctx.raw} Learners`; 
                      return `฿${ctx.raw.toLocaleString()} THB`; 
                    } 
                  } 
                } 
              }, 
              scales: { 
                y: { 
                  type: 'linear', 
                  display: showLearners, 
                  position: 'left', 
                  beginAtZero: true, 
                  min: 0, 
                  ticks: { stepSize: 1, color: '#999', font: { size: 12 } }, 
                  grid: { color: '#f0f0f0', borderDash: [5, 5] }, 
                  title: { display: true, text: 'Learners', align: 'center', color: '#8E1523', font: { size: 12, weight: 'bold' } } 
                },
                y1: { 
                  type: 'linear', 
                  display: showIncome, 
                  position: 'right', 
                  beginAtZero: true, 
                  min: 0, 
                  ticks: { 
                    color: '#999', 
                    font: { size: 12 }, 
                    callback: function(value) { return '฿' + value.toLocaleString(); } 
                  }, 
                  grid: { drawOnChartArea: false }, 
                  title: { display: true, text: 'Income (THB)', align: 'center', color: '#D4A038', font: { size: 12, weight: 'bold' } } 
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

      {/* --- Doughnut Chart (Category Distribution) --- */}
      <div className="admin-chart-container" style={{ marginTop: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Course Distribution by Category</h3>
        </div>
        
        <div className="doughnut-chart-content">
          <div className="doughnut-wrapper">
            <Doughnut 
              data={{ 
                labels: categoryDist.map(d => d.label), 
                datasets: [{ 
                  data: categoryDist.map(d => d.value), 
                  backgroundColor: CATEGORY_COLORS, 
                  borderWidth: 0, 
                  hoverOffset: 5 
                }] 
              }} 
              options={{ 
                maintainAspectRatio: false, 
                cutout: '65%', 
                plugins: { 
                  legend: { display: false }, 
                  tooltip: { callbacks: { label: (ctx) => `${ctx.raw} Courses` } } 
                } 
              }} 
            />
          </div>
          
          {/* Custom Legend แสดงด้านล่างกราฟ */}
          <div className="custom-legend-bottom">
            {categoryDist.map((item, index) => (
              <div key={index} className="legend-item-horizontal">
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}></span>
                  <span className="legend-text">{item.label}</span>
                </div>
                <div className="legend-value">{item.value.toLocaleString()} Courses</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default DashboardOverview;