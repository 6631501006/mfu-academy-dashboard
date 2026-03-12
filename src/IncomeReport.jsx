import React, { useState, useEffect } from 'react';
import { CSVLink } from "react-csv";

function IncomeReport() {
  const [categories, setCategories] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCat, setSelectedCat] = useState('all');
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [reportData, setReportData] = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // 👇 1. State สำหรับระบบแบ่งหน้า (Pagination)
  const [breakdownPage, setBreakdownPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const itemsPerPage = 10; // กำหนดให้แสดงหน้าละ 10 รายการ

  useEffect(() => {
    fetch('http://localhost:5001/api/categories')
      .then(res => res.json()).then(data => setCategories(data)).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // รีเซ็ตกลับไปหน้า 1 ทุกครั้งที่มีการเปลี่ยน Filter
    setBreakdownPage(1);
    setTransactionPage(1);

    fetch(`http://localhost:5001/api/income-total?year=${selectedYear}&catId=${selectedCat}`)
      .then(res => res.json()).then(data => setTotalRevenue(data.totalRevenue)).catch(err => console.error(err));

    fetch(`http://localhost:5001/api/income-breakdown?year=${selectedYear}&catId=${selectedCat}`)
      .then(res => res.json()).then(data => setBreakdownData(data)).catch(err => console.error(err));

    fetch(`http://localhost:5001/api/income-export?year=${selectedYear}&catId=${selectedCat}`)
      .then(res => res.json()).then(data => setReportData(data)).catch(err => console.error(err));

    fetch(`http://localhost:5001/api/recent-transactions?year=${selectedYear}&catId=${selectedCat}`)
      .then(res => res.json()).then(data => setRecentTransactions(data)).catch(err => console.error(err));
  }, [selectedYear, selectedCat]);

  // คำนวณยอดรวมทั้งหมดของตาราง Breakdown
  const totalTableLearners = breakdownData.reduce((sum, item) => sum + Number(item.totalLearners), 0);
  const totalTableRevenue = breakdownData.reduce((sum, item) => sum + Number(item.totalRevenue), 0);

  // ฟังก์ชันแปลงวันที่
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // 👇 2. Logic สำหรับแบ่งหน้าตาราง Breakdown
  const totalBreakdownPages = Math.ceil(breakdownData.length / itemsPerPage);
  const currentBreakdownData = breakdownData.slice((breakdownPage - 1) * itemsPerPage, breakdownPage * itemsPerPage);

  // 👇 3. Logic สำหรับแบ่งหน้าตาราง Transactions
  const totalTransactionPages = Math.ceil(recentTransactions.length / itemsPerPage);
  const currentTransactionData = recentTransactions.slice((transactionPage - 1) * itemsPerPage, transactionPage * itemsPerPage);

  return (
    <div className="income-page">
      
      {/* --- แถบ Filter ด้านบน --- */}
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
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
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

      {/* --- การ์ดแสดงรายได้รวม --- */}
      <div className="income-revenue-card" style={{ marginBottom: '24px' }}>
        <div className="revenue-card-header">
          <span className="revenue-icon">$</span><h2>Total Gross Revenue</h2>
        </div>
        <h1 className="revenue-amount">฿{Number(totalRevenue).toLocaleString()}</h1>
        <p className="revenue-subtext">Showing data for {selectedYear === 'all' ? 'All Years' : `Year ${selectedYear}`} {selectedCat !== 'all' ? ` • Filtered by Category` : ' • All Courses'}</p>
      </div>

      {/* --- ตารางที่ 1: Detailed Revenue Breakdown --- */}
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
                    <td className="text-right">฿{Number(row.pricePerUnit).toLocaleString()}</td>
                    <td className="text-right">{Number(row.totalLearners).toLocaleString()}</td>
                    <td className="text-right">฿{Number(row.totalRevenue).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No data available.</td></tr>
              )}
            </tbody>
            {/* แถว Total โชว์ผลรวมทั้งหมด (ไม่สนหน้า) */}
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

        {/* 👇 ส่วนควบคุมการเปลี่ยนหน้า ตารางที่ 1 👇 */}
        {totalBreakdownPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn" 
              onClick={() => setBreakdownPage(prev => Math.max(1, prev - 1))} 
              disabled={breakdownPage === 1}
            >
              &larr; Prev
            </button>
            <span className="pagination-text">Page {breakdownPage} of {totalBreakdownPages}</span>
            <button 
              className="pagination-btn" 
              onClick={() => setBreakdownPage(prev => Math.min(totalBreakdownPages, prev + 1))} 
              disabled={breakdownPage === totalBreakdownPages}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* --- ตารางที่ 2: Recent Transactions --- */}
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
                    <td className="text-right" style={{ color: '#333' }}>฿{Number(tx.amount).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No recent transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 👇 ส่วนควบคุมการเปลี่ยนหน้า ตารางที่ 2 👇 */}
        {totalTransactionPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn" 
              onClick={() => setTransactionPage(prev => Math.max(1, prev - 1))} 
              disabled={transactionPage === 1}
            >
              &larr; Prev
            </button>
            <span className="pagination-text">Page {transactionPage} of {totalTransactionPages}</span>
            <button 
              className="pagination-btn" 
              onClick={() => setTransactionPage(prev => Math.min(totalTransactionPages, prev + 1))} 
              disabled={transactionPage === totalTransactionPages}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default IncomeReport;