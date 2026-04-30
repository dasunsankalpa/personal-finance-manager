import React, { useState } from 'react';
import './Dashboard.css';

// Placeholder data for demonstration
const expenses = [
  { amount: 500, category: 'Food', date: '2026-04-23', note: 'Lunch' },
  { amount: 1200, category: 'Transport', date: '2026-04-22', note: 'Taxi' },
  { amount: 3000, category: 'Utilities', date: '2026-04-21', note: 'Electricity bill' },
  { amount: 1500, category: 'Entertainment', date: '2026-04-20', note: 'Movie' },
];

const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);

export default function Dashboard() {
  const [showRecent, setShowRecent] = useState(false);
  return (
    <div className="dashboard-container">
      <div className="dashboard-card total-spending">
        <h2>Total Spending</h2>
        <p className="amount">LKR {totalSpending.toLocaleString()}</p>
      </div>

      <div
        className={`dashboard-card recent-expenses clickable${showRecent ? ' open' : ''}`}
        onClick={() => setShowRecent((prev) => !prev)}
        style={{ cursor: 'pointer' }}
      >
        <h2>Recent Expenses {showRecent ? '▲' : '▼'}</h2>
        {showRecent && (
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={i}>
                  <td>LKR {e.amount.toLocaleString()}</td>
                  <td>{e.category}</td>
                  <td>{e.date}</td>
                  <td>{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-card category-chart">
        <h2>Spending by Category</h2>
        <div className="chart-placeholder">[Pie Chart Placeholder]</div>
      </div>
    </div>
  );
}
