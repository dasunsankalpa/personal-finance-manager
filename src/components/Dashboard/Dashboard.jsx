import React, { useState, useEffect, useCallback } from 'react';
import RecentExpensesTable from './RecentExpensesTable';
import MonthlyPaymentsCard from './MonthlyPaymentsCard';
import CategoryChart from './CategoryChart';
import MonthlyExpenseChart from './MonthlyExpenseChart';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const today = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().toISOString().slice(0, 7);
const currentYear = new Date().getFullYear();

const getDaysLeftInMonth = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
};

export default function Dashboard({ setShowSetup, handleQweClick, onBalanceWarning }) {
  const [userDefault, setUserDefault] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [yearlyExpenses, setYearlyExpenses] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dailyAmount, setDailyAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [additionalAmount, setAdditionalAmount] = useState(0);
  const [monthlyDailyTotal, setMonthlyDailyTotal] = useState(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token) return;
    fetch(`${API}/userDefault/${encodeURIComponent(userId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data?.categories) setUserDefault(data); })
      .catch(() => {});
  }, []);

  const fetchChartData = useCallback(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token) return;

    fetch(`${API}/dailyExp/${encodeURIComponent(userId)}/${today}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setDailyExpenses(res.data?.expenses || []);
          setDailyAmount(res.data?.totalAmount || 0);
        }
      })
      .catch(() => {});

    fetch(`${API}/dailyExp/${encodeURIComponent(userId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const monthTotal = res.data
            .filter(r => r.date && r.date.startsWith(currentMonth))
            .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
          setMonthlyDailyTotal(monthTotal);
        }
      })
      .catch(() => {});

    fetch(`${API}/monthlyExp/${encodeURIComponent(userId)}/${currentMonth}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setMonthlyExpenses(res.data?.expenses || []);
          setMonthlyAmount(res.data?.totalAmount || 0);
        }
      })
      .catch(() => {});

    fetch(`${API}/chartData/${encodeURIComponent(userId)}/${selectedYear}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) setYearlyExpenses(res.data || []);
        if (res.success && res.data) {
          const total = res.data.reduce((sum, r) => sum + (r.additionalAmount || 0), 0);
          setAdditionalAmount(total);
        }
      })
      .catch(() => {});
  }, [selectedYear]);

  useEffect(() => { fetchChartData(); }, [selectedYear, fetchChartData]);

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [fetchChartData]);

  // Balance sustainability warning
  useEffect(() => {
    if (!userDefault?.salary) return;
    const salary  = Number(userDefault.salary);
    const balance = salary - monthlyAmount - monthlyDailyTotal;
    const daysLeft = getDaysLeftInMonth();
    const expectedDailyBudget = Math.floor(salary / 30);

    if (dailyAmount > 0 && daysLeft > 0 && balance > 0) {
      const actualDaysCanLast = Math.floor(balance / dailyAmount);
      if (dailyAmount > expectedDailyBudget && actualDaysCanLast < daysLeft) {
        const msg = `⚠️ Please consider your spending — at this rate your salary will last only ${actualDaysCanLast} day${actualDaysCanLast !== 1 ? 's' : ''} 😥😥😥`;
        onBalanceWarning?.(msg);
      } else {
        onBalanceWarning?.(null);
      }
    } else if (balance <= 0) {
      const msg = `⚠️ Your balance is Rs. ${balance.toLocaleString('en-LK')} — you have exceeded your salary budget! 😥😥😥`;
      onBalanceWarning?.(msg);
    } else {
      onBalanceWarning?.(null);
    }
  }, [userDefault, dailyAmount, monthlyAmount, monthlyDailyTotal, onBalanceWarning]);

  const handleQweClickWithRefresh = () => {
    handleQweClick();
    fetchChartData();
  };

  return (
    <div className="dashboard-grid">

      {userDefault?.salary > 0 && (
        <div className="balance-card" style={{ background: 'linear-gradient(135deg, #4682B4 0%, #2c5282 100%)', color: 'white', border: 'none', boxShadow: '0 8px 24px rgba(70,130,180,0.35)' }}>
          <div className="balance-item">
            <span className="balance-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Salary</span>
            <span className="balance-value" style={{ color: '#ffffff', fontWeight: 700 }}>Rs. {Number(userDefault.salary).toLocaleString('en-LK')}</span>
          </div>
          <div className="balance-divider" style={{ background: 'rgba(255,255,255,0.25)' }} />
          <div className="balance-item">
            <span className="balance-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Monthly Spent</span>
            <span className="balance-value" style={{ color: '#fca5a5', fontWeight: 700 }}>- Rs. {monthlyAmount.toLocaleString('en-LK')}</span>
          </div>
          <div className="balance-divider" style={{ background: 'rgba(255,255,255,0.25)' }} />
          <div className="balance-item">
            <span className="balance-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Daily Spent (Month)</span>
            <span className="balance-value" style={{ color: '#fca5a5', fontWeight: 700 }}>- Rs. {monthlyDailyTotal.toLocaleString('en-LK')}</span>
          </div>
          <div className="balance-divider" style={{ background: 'rgba(255,255,255,0.25)' }} />
          <div className="balance-item">
            <span className="balance-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Balance</span>
            <span className="balance-value" style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.2rem' }}>
              Rs. {(Number(userDefault.salary) - monthlyAmount - monthlyDailyTotal).toLocaleString('en-LK')}
            </span>
          </div>
        </div>
      )}

      <div className="dashboard-bottom">
        <RecentExpensesTable setShowSetup={setShowSetup} handleQweClick={handleQweClickWithRefresh} userDefault={userDefault} />
        <MonthlyPaymentsCard setShowSetup={setShowSetup} handleQweClick={handleQweClickWithRefresh} userDefault={userDefault} />
      </div>
      <CategoryChart dailyExpenses={dailyExpenses} monthlyExpenses={monthlyExpenses} />
      <MonthlyExpenseChart yearlyExpenses={yearlyExpenses} selectedYear={selectedYear} onYearChange={setSelectedYear} dailyAmount={dailyAmount} monthlyAmount={monthlyAmount} additionalAmount={additionalAmount} />
    </div>
  );
}
