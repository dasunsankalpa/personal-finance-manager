import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function TotalSpendingCard({ expenses }) {
  // Calculate monthly spending for the current year
  const monthlyData = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = {};

    // Initialize all months with zero
    for (let month = 0; month < 12; month++) {
      const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      const monthName = new Date(currentYear, month).toLocaleDateString('en-US', { month: 'short' });
      monthlyExpenses[monthKey] = { month: monthName, amount: 0 };
    }

    // Add actual expenses - process all expenses regardless of date format
    expenses
      .filter(exp => exp && exp.amount)
      .forEach(exp => {
        let targetMonth = new Date().getMonth(); // Default to current month

        try {
          if (exp.date) {
            const date = new Date(exp.date);
            if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
              targetMonth = date.getMonth();
            }
          }
        } catch (error) {
          // Keep default current month
        }

        const monthKey = `${currentYear}-${String(targetMonth + 1).padStart(2, '0')}`;
        monthlyExpenses[monthKey].amount += Number(exp.amount);
      });

    // If no expenses at all, add some demo data
    const hasAnyExpenses = Object.values(monthlyExpenses).some(month => month.amount > 0);
    if (!hasAnyExpenses && expenses.length === 0) {
      // Add demo data for current year
      const demoAmounts = [15000, 12000, 18000, 22000, 16000, 14000, 19000, 17000, 21000, 23000, 20000, 25000];
      for (let month = 0; month < 12; month++) {
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        monthlyExpenses[monthKey].amount = demoAmounts[month];
      }
    }

    // Return all months in order
    return Object.keys(monthlyExpenses)
      .sort()
      .map(key => monthlyExpenses[key]);
  }, [expenses]);

  const currentMonthTotal = monthlyData[new Date().getMonth()]?.amount || 0;
  const previousMonthIndex = new Date().getMonth() - 1;
  const previousMonthTotal = previousMonthIndex >= 0 ? (monthlyData[previousMonthIndex]?.amount || 0) : 0;
  const change = previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-name">{label}</p>
          <p className="tooltip-value">Rs. {payload[0].value.toLocaleString('en-LK')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="total-card">
      <div className="total-card-left">
        <div className="total-icon-wrap">
          <Calendar size={22} />
        </div>
        <div>
          <p className="total-label">Monthly Spending</p>
          <p className="total-sub">
            {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last month
          </p>
        </div>
      </div>
      <div className="total-amount">
        <span className="total-currency">Rs.</span>
        {currentMonthTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
      </div>

      {/* Monthly Bar Chart */}
      <div style={{
        marginTop: '15px',
        height: '120px',
        width: '100%'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#6b7280' }}
              interval={0}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="amount"
              fill="#6366f1"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
