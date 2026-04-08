import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

function DashboardOverview() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const [adminStats, setAdminStats] = useState({ totalRevenue: 0, totalCourses: 0, totalLearners: 0 });
  const [categoryDist, setCategoryDist] = useState([]);
  
  const [monthlyLearnersData, setMonthlyLearnersData] = useState(new Array(12).fill(0));
  const [monthlyIncomeData, setMonthlyIncomeData] = useState(new Array(12).fill(0));

  const [showLearners, setShowLearners] = useState(true);
  const [showIncome, setShowIncome] = useState(true);

  const categoryColors = ['#8E1523', '#D4A038', '#C42026', '#E06D53', '#E8907E', '#4C5A73'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const courseRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course');
        const allCourses = await courseRes.json();

        let tCourses = allCourses.length;
        let tLearners = 0;
        let monthlyLearners = new Array(12).fill(0);
        let catCounts = {};

        allCourses.forEach(course => {
          const orders = course.orderDetail || [];
          const catName = course.category?.categoryName || 'Other';
          catCounts[catName] = (catCounts[catName] || 0) + 1;

          const isEbookOrInhouse = catName.toLowerCase().includes('e-book') || catName.toLowerCase().includes('in-house');
          
          if (!isEbookOrInhouse) {
            orders.forEach(order => {
              const orderDate = new Date(order.createdAt);
              
              if (startDate || endDate) {
                const start = startDate ? new Date(startDate) : new Date('2000-01-01');
                const end = endDate ? new Date(endDate) : new Date('2100-01-01');
                end.setHours(23, 59, 59, 999);
                if (orderDate < start || orderDate > end) return;
              }

              tLearners += 1;

              if (orderDate.getFullYear().toString() === selectedYear) {
                monthlyLearners[orderDate.getMonth()] += 1; 
              }
            });
          }
        });

        setMonthlyLearnersData(monthlyLearners);
        const formattedCatDist = Object.keys(catCounts).map(key => ({ label: key, value: catCounts[key] }));
        setCategoryDist(formattedCatDist);

        const token = localStorage.getItem('mfuAdminToken');
        let tRevenue = 0;
        let mIncome = new Array(12).fill(0); 
        
        if (token) {
          try {
            const incomeRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/income-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const incomeData = await incomeRes.json();
            
            if (Array.isArray(incomeData)) {
              incomeData.forEach(item => {
                const dateStr = item.createdAt || item.orderDate || item.date;
                if (!dateStr) return;
                
                const d = new Date(dateStr);

                if (startDate || endDate) {
                  const start = startDate ? new Date(startDate) : new Date('2000-01-01');
                  const end = endDate ? new Date(endDate) : new Date('2100-01-01');
                  end.setHours(23, 59, 59, 999);
                  if (d < start || d > end) return;
                }

                const amount = Number(item.amount || item.price || item.total || 0);
                tRevenue += amount;
                
                if (d.getFullYear().toString() === selectedYear) {
                  mIncome[d.getMonth()] += amount; 
                }
              });
            }
          } catch (e) { console.error("Failed to fetch income report", e); }
        }

        setMonthlyIncomeData(mIncome); 
        setAdminStats({ totalCourses: tCourses, totalLearners: tLearners, totalRevenue: tRevenue });

      } catch (error) { console.error("Error fetching dashboard data:", error); }
    };

    fetchDashboardData();
  }, [selectedYear, startDate, endDate]);

  return (
    <div>
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
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Monthly Course Enrollments & Income</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#666', cursor: 'pointer', userSelect: 'none' }}>
              <span onClick={() => setShowLearners(!showLearners)} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: showLearners ? 1 : 0.4, transition: '0.2s', fontWeight: showLearners ? '600' : 'normal' }}>
                <div style={{width: 12, height: 12, borderRadius: '50%', background: '#8E1523'}}></div> Learners
              </span>
              <span onClick={() => setShowIncome(!showIncome)} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: showIncome ? 1 : 0.4, transition: '0.2s', fontWeight: showIncome ? '600' : 'normal' }}>
                <div style={{width: 12, height: 12, borderRadius: '50%', background: '#D4A038'}}></div> Income
              </span>
            </div>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', outline: 'none' }}>
              <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
            </select>
          </div>
        </div>
        <div style={{ height: '350px', width: '100%' }}>
          <Line 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                { label: 'Learners', data: monthlyLearnersData, hidden: !showLearners, borderColor: '#8E1523', backgroundColor: '#8E1523', borderWidth: 3, pointBackgroundColor: '#8E1523', pointRadius: 4, tension: 0.4, yAxisID: 'y' },
                { label: 'Income', data: monthlyIncomeData, hidden: !showIncome, borderColor: '#D4A038', backgroundColor: '#D4A038', borderWidth: 3, pointBackgroundColor: '#D4A038', pointRadius: 4, tension: 0.4, yAxisID: 'y1' }
              ]
            }}
            options={{ 
              responsive: true, maintainAspectRatio: false, 
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => { if (ctx.datasetIndex === 0) return `${ctx.raw} Learners`; return `฿${ctx.raw.toLocaleString()} THB`; } } } }, 
              scales: { 
                y: { type: 'linear', display: showLearners, position: 'left', beginAtZero: true, min: 0, ticks: { stepSize: 1, color: '#999', font: { size: 12 } }, grid: { color: '#f0f0f0', borderDash: [5, 5] }, title: { display: true, text: 'Learners', align: 'center', color: '#8E1523', font: { size: 12, weight: 'bold' } } },
                y1: { type: 'linear', display: showIncome, position: 'right', beginAtZero: true, min: 0, ticks: { color: '#999', font: { size: 12 }, callback: function(value) { return '฿' + value.toLocaleString(); } }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Income (THB)', align: 'center', color: '#D4A038', font: { size: 12, weight: 'bold' } } }, 
                x: { grid: { display: false }, ticks: { color: '#999', font: { size: 12 } } } 
              } 
            }}
          />
        </div>
      </div>

      <div className="admin-chart-container" style={{ marginTop: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: '20px' }}><h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Course Distribution by Category</h3></div>
        <div className="doughnut-chart-content">
          <div className="doughnut-wrapper">
            <Doughnut data={{ labels: categoryDist.map(d => d.label), datasets: [{ data: categoryDist.map(d => d.value), backgroundColor: categoryColors, borderWidth: 0, hoverOffset: 5 }] }} options={{ maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw} Courses` } } } }} />
          </div>
          <div className="custom-legend-bottom">
            {categoryDist.map((item, index) => (
              <div key={index} className="legend-item-horizontal">
                <div className="legend-label"><span className="legend-dot" style={{ backgroundColor: categoryColors[index % categoryColors.length] }}></span><span className="legend-text">{item.label}</span></div>
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