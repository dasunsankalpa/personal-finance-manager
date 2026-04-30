import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const thisYear = new Date().getFullYear();
const thisMonthIdx = new Date().getMonth();

const MonthlyExpenseChart = ({ yearlyExpenses = [], selectedYear = thisYear, onYearChange, dailyAmount = 0, monthlyAmount = 0, additionalAmount = 0 }) => {

  const monthlyData = React.useMemo(() => {
    const map = {};
    for (let m = 0; m < 12; m++) {
      const key = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
      map[key] = {
        month:      new Date(selectedYear, m).toLocaleDateString('en-US', { month: 'short' }),
        monthly:    0,
        dayToDay:   0,
        additional: 0,
        isCurrent:  selectedYear === thisYear && m === thisMonthIdx,
      };
    }

    (yearlyExpenses || []).forEach(rec => {
      const key = rec.month;
      if (!map[key]) return;
      map[key].dayToDay   = rec.dailyAmount      || 0;
      map[key].monthly    = rec.monthlyAmount    || 0;
      map[key].additional = rec.additionalAmount || 0;
    });

    if (selectedYear === thisYear) {
      const currentKey = `${thisYear}-${String(thisMonthIdx + 1).padStart(2, '0')}`;
      if (map[currentKey]) {
        if (dailyAmount > 0)      map[currentKey].dayToDay   = dailyAmount;
        if (monthlyAmount > 0)   map[currentKey].monthly    = monthlyAmount;
        if (additionalAmount > 0) map[currentKey].additional = additionalAmount;
      }
    }

    const hasAny = Object.values(map).some(m => m.monthly > 0 || m.dayToDay > 0 || m.additional > 0);
    if (!hasAny && selectedYear < thisYear) {
      const demo2025 = [[25000,13000,2000],[24500,11000,1500],[26000,16000,3500],[27000,20000,4000],[25500,14500,2500],[24000,12500,1800],[27000,17500,3000],[26000,15500,2200],[28000,19000,3800],[29000,21000,4500],[27500,18000,3200],[30000,23000,5000]];
      const demo = demo2025;
      Object.keys(map).forEach((key, i) => { map[key].monthly = demo[i][0]; map[key].dayToDay = demo[i][1]; map[key].additional = demo[i][2]; });
    }

    const values = Object.values(map);
    const peakTotal = Math.max(...values.map(m => m.monthly + m.dayToDay + m.additional));
    values.forEach(m => { m.isPeak = (m.monthly + m.dayToDay + m.additional) === peakTotal && peakTotal > 0; });
    return values;
  }, [yearlyExpenses, selectedYear, dailyAmount, monthlyAmount, additionalAmount]);

  const totalMonthly    = monthlyData.reduce((s, m) => s + m.monthly, 0);
  const totalDayToDay   = monthlyData.reduce((s, m) => s + m.dayToDay, 0);
  const totalAdditional = monthlyData.reduce((s, m) => s + m.additional, 0);
  const grandTotal = totalMonthly + totalDayToDay + totalAdditional;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s, e) => s + e.value, 0);
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '180px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '14px' }}>{label} {selectedYear}</p>
        {payload.map((entry, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
            <span style={{ color: entry.color, fontSize: '12px' }}>● {entry.name}</span>
            <span style={{ fontWeight: '600', fontSize: '12px' }}>Rs. {entry.value.toLocaleString('en-LK')}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Total</span>
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>Rs. {total.toLocaleString('en-LK')}</span>
        </div>
      </div>
    );
  };

  const peakMonth = monthlyData.find(m => m.isPeak)?.month;

  const CustomXAxisTick = ({ x, y, payload }) => (
    <text x={x} y={y + 12} textAnchor="middle" fontSize={12}
      fill={payload.value === peakMonth ? '#ef4444' : '#6b7280'}
      fontWeight={payload.value === peakMonth ? 700 : 400}>
      {payload.value}
    </text>
  );

  const btnStyle = { background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6' };

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <span className="dash-card-title">Yearly Expense Overview</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={btnStyle} onClick={() => onYearChange?.(selectedYear - 1)}>‹</button>
          <span style={{ fontWeight: '600', fontSize: '14px', minWidth: '40px', textAlign: 'center' }}>{selectedYear}</span>
          <button style={{ ...btnStyle, opacity: selectedYear >= thisYear ? 0.4 : 1 }} disabled={selectedYear >= thisYear} onClick={() => onYearChange?.(selectedYear + 1)}>›</button>
          <span className="dash-card-badge">Rs. {grandTotal.toLocaleString('en-LK')}</span>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} width={55} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Legend iconType="circle" iconSize={9} wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
            <Bar dataKey="monthly" name="Monthly Expenses" fill="#6366f1" radius={[4, 4, 0, 0]}>
              {monthlyData.map((_, i) => (
                <Cell key={i} fill="#6366f1" opacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="dayToDay" name="Day-to-Day Expenses" fill="#10b981" radius={[4, 4, 0, 0]}>
              {monthlyData.map((_, i) => (
                <Cell key={i} fill="#10b981" opacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="additional" name="Additional Payments" fill="#f59e0b" radius={[4, 4, 0, 0]}>
              {monthlyData.map((_, i) => (
                <Cell key={i} fill="#f59e0b" opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyExpenseChart;
