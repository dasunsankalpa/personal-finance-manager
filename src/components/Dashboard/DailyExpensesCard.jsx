import React from 'react';
import { Calendar } from 'lucide-react';

export default function DailyExpensesCard({ expenses }) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dailyExpenses = expenses.filter(e => e.date === today);
  const dailyTotal = dailyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Hardcoded categories as per user request
  const categories = [
    { id: 'food', name: 'Food & Groceries', description: 'Meals and home supplies' },
    { id: 'transport', name: 'Transport', description: 'Travel expenses' },
    { id: 'utilities', name: 'Utilities', description: 'Electricity, water, and gas' },
    { id: 'housing', name: 'Housing or Rent', description: 'Monthly home payment' },
    { id: 'communication', name: 'Communication', description: 'Phone and internet' },
    { id: 'healthcare', name: 'Healthcare', description: 'Medicine and treatment' },
  ];

  // Calculate amounts per category for today
  const categoryAmounts = categories.map(cat => {
    const catExpenses = dailyExpenses.filter(e => e.category === cat.id);
    const amount = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { ...cat, amount };
  });

  return (
    <div className="daily-expenses-card">
      <div className="daily-header">
        <div className="daily-icon-wrap">
          <Calendar size={22} />
        </div>
        <div>
          <p className="daily-label">Daily Expenses</p>
          <p className="daily-sub">Rs. {dailyTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })} today</p>
        </div>
      </div>
      <div className="daily-table">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {categoryAmounts.map(cat => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>{cat.description}</td>
                <td>{cat.amount > 0 ? `Rs. ${cat.amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}