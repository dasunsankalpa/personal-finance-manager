import React from 'react';
import { Calendar } from 'lucide-react';

export default function MonthlySpendingCard({ total }) {
  return (
    <div className="total-card">
      <div className="total-card-left">
        <div className="total-icon-wrap">
          <Calendar size={22} />
        </div>
        <div>
          <p className="total-label">Monthly Spending</p>
          <p className="total-sub">This month's expenses</p>
        </div>
      </div>
      <div className="total-amount">
        <span className="total-currency">Rs.</span>
        {total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}