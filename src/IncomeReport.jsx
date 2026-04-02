import React, { useState, useEffect } from 'react';
import { CSVLink } from "react-csv";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function IncomeReport() {
  const [categories, setCategories] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCat, setSelectedCat] = useState('all');
  
  // 👇 เพิ่ม State สำหรับ Filter ของ Chart
  const [chartLimit, setChartLimit] = useState('10');
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAvailableCourses, setTotalAvailableCourses] = useState(0); // 👈 State การ์ดคอร์สที่มีทั้งหมด
  const [totalCoursesSold, setTotalCoursesSold] = useState(0); 
  
  const [reportData, setReportData] = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const [rawCourses, setRawCourses] = useState([]);
  const [rawIncome, setRawIncome] = useState([]);

  const [breakdownPage, setBreakdownPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const courseRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/all-course');
        const courses = await courseRes.json();
        setRawCourses(courses);

        const cats = [];
        const catMap = new Set();
        courses.forEach(c => {
          if (c.category && !catMap.has(c.category.id)) {
            catMap.add(c.category.id);
            cats.push({ id: c.category.id, name: c.category.categoryName });
          }
        });
        setCategories(cats);

        const token = localStorage.getItem('mfuAdminToken');
        if (token) {
          const incomeRes = await fetch('https://api-academy-payment.mfu.ac.th/dashboard-data/income-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          });
          const incomeData = await incomeRes.json();
          setRawIncome(Array.isArray(incomeData) ? incomeData : []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (rawCourses.length === 0 || rawIncome.length === 0) return;

    setBreakdownPage(1);
    setTransactionPage(1);

    // 👇 นับจำนวน "คอร์สทั้งหมด" ตาม Filter
    let filteredCourses = rawCourses;
    if (selectedCat !== 'all') {
      filteredCourses = rawCourses.filter(c => c.category?.id === parseInt(selectedCat) || c.categoryId === parseInt(selectedCat));
    }
    setTotalAvailableCourses(filteredCourses.length);

    let tRevenue = 0;
    let tCoursesSold = 0;
    let breakdownMap = {};
    let transactions = [];
    let csvExp = [];

    rawIncome.forEach(item => {
      const dateStr = item.orderDateTime || item.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      
      if (selectedYear !== 'all' && date.getFullYear().toString() !== selectedYear) return;

      const courseId = item.courseId;
      const matchedCourse = rawCourses.find(c => c.id === courseId);
      
      if (selectedCat !== 'all') {
        const catId = matchedCourse?.category?.id || matchedCourse?.categoryId;
        if (catId !== parseInt(selectedCat)) return;
      }

      const price = Number(item.amount || item.detailSumTotal || 0);
      const courseName = matchedCourse ? matchedCourse.courseName : `Course ID: ${courseId}`;
      const catName = matchedCourse?.category?.categoryName || 'Other';
      const learnerName = `${item.customerFirstname || item.userFirstname || ''} ${item.customerLastname || item.userLastname || ''}`.trim() || 'Unknown Learner';

      tRevenue += price;
      
      if (!breakdownMap[courseName]) {
        breakdownMap[courseName] = { count: 0, total: 0, pricePerUnit: price };
        tCoursesSold++; 
      }
      breakdownMap[courseName].count += 1;
      breakdownMap[courseName].total += price;

      transactions.push({
        transactionId: item.orderNo || item.id,
        orderDate: date, 
        learnerName: learnerName,
        coursePurchased: courseName,
        amount: price
      });

      // ยัดลง CSV (ไม่มีข้อมูล Total Courses ที่เพิ่งเพิ่มมา)
      csvExp.push({
        "Order No.": item.orderNo || "-",
        "Learner Name": learnerName,
        "Course Name": courseName,
        "Category": catName,
        "Price (THB)": price,
        "Date": date.toLocaleDateString('th-TH'),
        "Time": date.toLocaleTimeString('th-TH')
      });
    });

    const bData = Object.entries(breakdownMap).map(([name, data]) => ({
      courseName: name,
      pricePerUnit: data.pricePerUnit,
      totalLearners: data.count,
      totalRevenue: data.total
    })).sort((a, b) => b.totalRevenue - a.totalRevenue); 

    transactions.sort((a, b) => b.orderDate - a.orderDate);

    setTotalRevenue(tRevenue);
    setTotalCoursesSold(tCoursesSold);
    setBreakdownData(bData);
    setRecentTransactions(transactions);
    setReportData(csvExp);

  }, [selectedYear, selectedCat, rawCourses, rawIncome]);

  const totalTableLearners = breakdownData.reduce((sum, item) => sum + item.totalLearners, 0);
  const totalTableRevenue = breakdownData.reduce((sum, item) => sum + item.totalRevenue, 0);

  const formatDate = (dateObj) => {
    if (!dateObj) return '-';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const totalBreakdownPages = Math.ceil(breakdownData.length / itemsPerPage);
  const currentBreakdownData = breakdownData.slice((breakdownPage - 1) * itemsPerPage, breakdownPage * itemsPerPage);

  const totalTransactionPages = Math.ceil(recentTransactions.length / itemsPerPage);
  const currentTransactionData = recentTransactions.slice((transactionPage - 1) * itemsPerPage, transactionPage * itemsPerPage);

  // 👇 จัดการข้อมูลกราฟให้สัมพันธ์กับ Filter (Top 10 / All)
  const displayedChartData = chartLimit === 'all' ? breakdownData : breakdownData.slice(0, 10);
  
  // คำนวณความสูงของกล่องกราฟ ถ้ายาวมากให้ยืดออกเพื่อไม่ให้แท่งเบียดกัน
  const dynamicChartHeight = chartLimit === 'all' ? Math.max(350, displayedChartData.length * 35) : 350;

  const chartData = {
    labels: displayedChartData.map(d => d.courseName.length > 30 ? d.courseName.substring(0, 30) + '...' : d.courseName),
    datasets: [
      {
        label: 'Revenue (THB)',
        data: displayedChartData.map(d => d.totalRevenue),
        backgroundColor: '#D4A038',
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="income-page">
      
      <div className="income-filter-bar">
        <div className="income-filters-left">
          <div className="filter-item">
            <span className="filter-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
            <div className="filter-input-group">
              <label>Select Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="income-select">
                <option value="all">All Years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>
          <div className="filter-divider"></div>
          <div className="filter-item">
            <span className="filter-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
            <div className="filter-input-group">
              <label>Course Filter</label>
              <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="income-select">
                <option value="all">All Courses</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <CSVLink data={reportData} filename={`Income-Report-${selectedYear}-${selectedCat}.csv`} className="income-export-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Report
        </CSVLink>
      </div>

      {/* --- 👇 ปรับ Grid การ์ด ให้มี 3 ใบ ขนาดสมดุลกัน --- */}
      <div className="analytics-cards-grid" style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
        <div className="income-revenue-card" style={{ flex: 1, margin: 0 }}>
          <div className="revenue-card-header">
            <span className="revenue-icon">$</span><h2 style={{fontSize: '16px'}}>Total Gross Revenue</h2>
          </div>
          <h1 className="revenue-amount">฿{totalRevenue.toLocaleString()}</h1>
          <p className="revenue-subtext">Filtered by {selectedYear === 'all' ? 'All Years' : `Year ${selectedYear}`}</p>
        </div>

        {/* 🌟 เพิ่มการ์ด Total Courses */}
        <div className="income-revenue-card" style={{ flex: 1, margin: 0, backgroundColor: '#f0f4f8', border: '1px solid #d9e2ec' }}>
          <div className="revenue-card-header">
            <span className="revenue-icon" style={{ backgroundColor: '#334E68' }}>📚</span><h2 style={{ color: '#334E68', fontSize: '16px' }}>Total Courses</h2>
          </div>
          <h1 className="revenue-amount" style={{ color: '#102A43' }}>{totalAvailableCourses}</h1>
          <p className="revenue-subtext">Courses available in selected category</p>
        </div>

        <div className="income-revenue-card" style={{ flex: 1, margin: 0, backgroundColor: '#fcf8f2', border: '1px solid #f2e3c6' }}>
          <div className="revenue-card-header">
            <span className="revenue-icon" style={{ backgroundColor: '#D4A038' }}>📖</span><h2 style={{ color: '#D4A038', fontSize: '16px' }}>Courses Sold</h2>
          </div>
          <h1 className="revenue-amount" style={{ color: '#8E1523' }}>{totalCoursesSold}</h1>
          <p className="revenue-subtext">Unique courses generating income</p>
        </div>
      </div>

      {/* --- 👇 อัปเดตกราฟแท่ง ให้มีปุ่ม Filter Top 10 / All --- */}
      <div className="admin-chart-container" style={{ marginBottom: '24px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>Revenue by Course</h3>
          
          <select 
            value={chartLimit} 
            onChange={(e) => setChartLimit(e.target.value)} 
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            <option value="10">Top 10 Courses</option>
            <option value="all">Show All Courses</option>
          </select>
        </div>

        {/* 🌟 ถ้าเลือก All ให้มี Scroll Bar โผล่มาแทน เพื่อไม่ให้ Layout หน้าพัง */}
        <div style={{ height: '350px', width: '100%', overflowY: chartLimit === 'all' ? 'auto' : 'hidden', paddingRight: chartLimit === 'all' ? '10px' : '0' }}>
          <div style={{ height: `${dynamicChartHeight}px`, position: 'relative' }}>
            {breakdownData.length > 0 ? (
              <Bar 
                data={chartData}
                options={{
                  indexAxis: 'y', 
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => `฿${ctx.raw.toLocaleString()}` } }
                  },
                  scales: {
                    x: { 
                      beginAtZero: true, 
                      ticks: { color: '#999', font: { size: 12 }, callback: (val) => '฿' + val.toLocaleString() }, 
                      grid: { color: '#f0f0f0', borderDash: [5, 5] },
                      title: { display: true, text: 'Total Revenue (THB)', align: 'end', color: '#D4A038', font: { size: 12, weight: 'bold' } }
                    },
                    y: { grid: { display: false }, ticks: { color: '#666', font: { size: 11, weight: '500' } } }
                  }
                }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data available to display chart.</div>
            )}
          </div>
        </div>
      </div>

      <div className="income-breakdown-container">
        <h3 className="breakdown-title">Detailed Revenue Breakdown</h3>
        <div className="table-responsive">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th className="text-right">Price per Unit (THB)</th>
                <th className="text-right">Total Learners Enrolled</th>
                <th className="text-right">Total Revenue (THB)</th>
              </tr>
            </thead>
            <tbody>
              {currentBreakdownData.length > 0 ? (
                currentBreakdownData.map((row, index) => (
                  <tr key={index}>
                    <td className="course-name-cell">{row.courseName}</td>
                    <td className="text-right">฿{row.pricePerUnit.toLocaleString()}</td>
                    <td className="text-right">{row.totalLearners.toLocaleString()}</td>
                    <td className="text-right" style={{ fontWeight: '600', color: '#2b8a3e' }}>฿{row.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No data available.</td></tr>
              )}
            </tbody>
            {breakdownData.length > 0 && (
              <tfoot>
                <tr className="table-total-row">
                  <td>Total (All Pages)</td>
                  <td className="text-right">-</td>
                  <td className="text-right">{totalTableLearners.toLocaleString()}</td>
                  <td className="text-right">฿{totalTableRevenue.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {totalBreakdownPages > 1 && (
          <div className="pagination-container">
            <button className="pagination-btn" onClick={() => setBreakdownPage(prev => Math.max(1, prev - 1))} disabled={breakdownPage === 1}>&larr; Prev</button>
            <span className="pagination-text">Page {breakdownPage} of {totalBreakdownPages}</span>
            <button className="pagination-btn" onClick={() => setBreakdownPage(prev => Math.min(totalBreakdownPages, prev + 1))} disabled={breakdownPage === totalBreakdownPages}>Next &rarr;</button>
          </div>
        )}
      </div>

      <div className="income-breakdown-container" style={{ marginTop: '24px' }}>
        <h3 className="breakdown-title">Recent Transactions</h3>
        <div className="table-responsive">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date (DD/MM/YYYY)</th>
                <th>Learner Name</th>
                <th>Course Purchased</th>
                <th className="text-right">Amount (THB)</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactionData.length > 0 ? (
                currentTransactionData.map((tx, index) => (
                  <tr key={index}>
                    <td style={{ color: '#555' }}>{tx.transactionId || '-'}</td>
                    <td>{formatDate(tx.orderDate)}</td>
                    <td style={{ color: '#333', fontWeight: '500' }}>{tx.learnerName}</td>
                    <td>{tx.coursePurchased || '-'}</td>
                    <td className="text-right" style={{ color: '#333' }}>฿{tx.amount.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No recent transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalTransactionPages > 1 && (
          <div className="pagination-container">
            <button className="pagination-btn" onClick={() => setTransactionPage(prev => Math.max(1, prev - 1))} disabled={transactionPage === 1}>&larr; Prev</button>
            <span className="pagination-text">Page {transactionPage} of {totalTransactionPages}</span>
            <button className="pagination-btn" onClick={() => setTransactionPage(prev => Math.min(totalTransactionPages, prev + 1))} disabled={transactionPage === totalTransactionPages}>Next &rarr;</button>
          </div>
        )}
      </div>

    </div>
  );
}

export default IncomeReport;