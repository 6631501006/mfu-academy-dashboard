import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

function DashboardOverview() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [adminStats, setAdminStats] = useState({ totalRevenue: 0, totalCourses: 0, totalLearners: 0 });
  const [monthlyData, setMonthlyData] = useState(new Array(12).fill(0));
  const [categoryDist, setCategoryDist] = useState([]);

  const categoryColors = ['#8E1523', '#D4A038', '#C42026', '#E06D53', '#E8907E', '#4C5A73'];

  useEffect(() => {
    fetch('http://localhost:5001/api/admin-stats')
      .then(res => res.json()).then(data => setAdminStats(data)).catch(err => console.error(err));

    fetch('http://localhost:5001/api/admin-category-dist')
      .then(res => res.json()).then(data => setCategoryDist(data)).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:5001/api/monthly-income?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        let chartData = new Array(12).fill(0);
        data.forEach(item => {
          const m = parseInt(item.month);
          if(m >= 1 && m <= 12) { chartData[m - 1] = parseFloat(item.total); }
        });
        setMonthlyData(chartData);
      })
      .catch(err => console.error(err));
  }, [selectedYear]);

  return (
    <div>
      {/* 1. Stat Cards */}
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

      {/* 2. Monthly Income Line Chart */}
      <div className="admin-chart-container" style={{ marginTop: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Monthly Income Trends</h3>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', outline: 'none' }}>
            <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
          </select>
        </div>
        <div style={{ height: '350px', width: '100%' }}>
          <Line 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [{ label: 'Revenue (THB)', data: monthlyData, borderColor: '#8E1523', backgroundColor: '#8E1523', borderWidth: 3, pointBackgroundColor: '#8E1523', pointRadius: 4, tension: 0.4 }]
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, min: 0, grid: { color: '#f0f0f0', borderDash: [5, 5] }, ticks: { color: '#999', font: { size: 12 } } }, x: { grid: { display: false }, ticks: { color: '#999', font: { size: 12 } } } } }}
          />
        </div>
      </div>

      {/* 3. Learner Distribution Doughnut Chart */}
      <div className="admin-chart-container" style={{ marginTop: '30px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: '20px' }}><h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Learner Distribution by Category</h3></div>
        <div className="doughnut-chart-content">
          <div className="doughnut-wrapper">
            <Doughnut 
              data={{ labels: categoryDist.map(d => d.label), datasets: [{ data: categoryDist.map(d => d.value), backgroundColor: categoryColors, borderWidth: 0, hoverOffset: 5 }] }} 
              options={{ maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }} 
            />
          </div>
          <div className="custom-legend-bottom">
            {categoryDist.map((item, index) => (
              <div key={index} className="legend-item-horizontal">
                <div className="legend-label"><span className="legend-dot" style={{ backgroundColor: categoryColors[index % categoryColors.length] }}></span><span className="legend-text">{item.label}</span></div>
                <div className="legend-value">{item.value.toLocaleString()} Learners</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;