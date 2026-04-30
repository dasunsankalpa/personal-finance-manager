import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#22c55e'];
const todayStr = new Date().toISOString().slice(0, 10);

export default function CategoryChart({ dailyExpenses = [], monthlyExpenses = [] }) {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDailyExp, setSelectedDailyExp] = useState(dailyExpenses);
  const [loading, setLoading] = useState(false);

  // When date changes fetch from API, when today use prop data
  useEffect(() => {
    if (selectedDate === todayStr) {
      setSelectedDailyExp(dailyExpenses);
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token) return;
    setLoading(true);
    fetch(`${API}/dailyExp/${encodeURIComponent(userId)}/${selectedDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) setSelectedDailyExp(res.data?.expenses || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate, dailyExpenses]);

  const dayToDayData = selectedDailyExp
    .filter(exp => exp && Number(exp.amount) > 0)
    .map(exp => ({ name: exp.category, value: Number(exp.amount) }));

  const monthlyData = monthlyExpenses
    .filter(exp => exp && Number(exp.amount) > 0)
    .map(exp => ({ name: exp.category, value: Number(exp.amount) }));

  const dayToDayTotal = dayToDayData.reduce((sum, item) => sum + item.value, 0);
  const monthlyTotal  = monthlyData.reduce((sum, item) => sum + item.value, 0);
  const grandTotal    = dayToDayTotal + monthlyTotal;

  const CustomTooltip = ({ active, payload, chartType }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    const total = chartType === 'monthly' ? monthlyTotal : dayToDayTotal;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-name">{name}</p>
        <p className="tooltip-value">Rs. {value.toLocaleString('en-LK')}</p>
        <p className="tooltip-percentage">{percentage}% of {chartType === 'monthly' ? 'monthly' : 'day-to-day'} expenses</p>
      </div>
    );
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <span className="dash-card-title">Expense Breakdown</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Date picker */}
          <input
            type="date"
            max={todayStr}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px',
              border: '1px solid var(--border-color)', background: 'var(--bg-app)',
              color: 'var(--text-main)', cursor: 'pointer', outline: 'none',
            }}
          />
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--icon-bg)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              Today
            </button>
          )}
          <span className="dash-card-badge">Rs. {grandTotal.toLocaleString('en-LK')}</span>
        </div>
      </div>

      {!isToday && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '8px 0 0', textAlign: 'right' }}>
          📅 Showing expenses for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
      )}

      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: monthlyData.length > 0 && dayToDayData.length > 0 ? '1fr 1fr' : '1fr',
          gap: '20px',
          marginTop: '15px'
        }}>
          {monthlyData.length > 0 && (
            <div>
              <h4 style={{ textAlign: 'center', marginBottom: '10px', color: '#6366f1', fontSize: '16px', fontWeight: 'bold' }}>
                Monthly Expenses<br />
                <span style={{ fontSize: '14px', fontWeight: 'normal' }}>Rs. {monthlyTotal.toLocaleString('en-LK')}</span>
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={monthlyData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {monthlyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip chartType="monthly" />} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="legend-label">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {dayToDayData.length > 0 && (
            <div>
              <h4 style={{ textAlign: 'center', marginBottom: '10px', color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>
                {isToday ? 'Today' : selectedDate} — Day-to-Day<br />
                <span style={{ fontSize: '14px', fontWeight: 'normal' }}>Rs. {dayToDayTotal.toLocaleString('en-LK')}</span>
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={dayToDayData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {dayToDayData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip chartType="day-to-day" />} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="legend-label">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {dayToDayData.length === 0 && monthlyData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              No expense data for {isToday ? 'today' : selectedDate}
            </div>
          )}
        </div>
      )}

      {(monthlyData.length > 0 || dayToDayData.length > 0) && !loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px' }}>
          {monthlyData.length > 0 && (
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#6366f1' }}>Monthly Total</div>
              <div>Rs. {monthlyTotal.toLocaleString('en-LK')}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{grandTotal > 0 ? ((monthlyTotal / grandTotal) * 100).toFixed(1) : 0}% of all</div>
            </div>
          )}
          {dayToDayData.length > 0 && (
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#10b981' }}>Day-to-Day Total</div>
              <div>Rs. {dayToDayTotal.toLocaleString('en-LK')}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{grandTotal > 0 ? ((dayToDayTotal / grandTotal) * 100).toFixed(1) : 0}% of all</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
