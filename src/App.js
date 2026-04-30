
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NotificationPage from './pages/NotificationPage';
import StartPage from './pages/StartPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logoutUser, saveUserDefault } from './api';
import { 
  CircleUser, Sun, Moon, EllipsisVertical, LogOut, Wallet, 
  Utensils, Car, Lightbulb, Home, Smartphone, 
  Pill, GraduationCap, Sparkles, Vault, Siren, Plus, Bell
} from 'lucide-react';
import jarLogo from './jar.png';
import './App.css';

const UserProfile = ({ name = "Dasun" }) => {
  return (
    <div className="user-profile">
      <div className="user-icon">
        <CircleUser size={32} strokeWidth={1.5} />
      </div>
      <span className="user-name">{name}</span>
    </div>
  );
};

const DateDisplay = () => {
  const [today, setToday] = useState("");

  useEffect(() => {
    const updateDate = () => {
      const options = {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      const formattedDate = new Intl.DateTimeFormat('en-US', options).format(new Date());
      setToday(formattedDate);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="date-display">
      <span className="date-label">Today</span>
      <span className="date-value">{today}</span>
    </div>
  );
};

const INITIAL_CATEGORIES = [
  { id: 'food', name: 'Food & Groceries', description: 'Meals and home supplies', icon: <Utensils size={20} /> },
  { id: 'transport', name: 'Transport', description: 'Travel expenses', icon: <Car size={20} /> },
  { id: 'utilities', name: 'Utilities', description: 'Electricity, water, and gas', icon: <Lightbulb size={20} /> },
  { id: 'housing', name: 'Housing or Rent', description: 'Monthly home payment', icon: <Home size={20} /> },
  { id: 'communication', name: 'Communication', description: 'Phone and internet', icon: <Smartphone size={20} /> },
  { id: 'healthcare', name: 'Healthcare', description: 'Medicine and treatment', icon: <Pill size={20} /> },
  { id: 'education', name: 'Education', description: 'School and learning', icon: <GraduationCap size={20} /> },
  { id: 'household', name: 'Household Essentials', description: 'Cleaning and personal care', icon: <Sparkles size={20} /> },
  { id: 'savings', name: 'Savings or Emergency Fund', description: 'Future or urgent needs', icon: <Vault size={20} /> },
  { id: 'unexpected', name: 'Unexpected Spending', description: 'Unplanned things', icon: <Siren size={20} /> },
];

const SalarySection = ({ salary, onSalaryChange, salaryDate, onSalaryDateChange }) => {
  return (
    <div className="salary-section">
      <div className="salary-info">
        <div className="salary-icon">
          <Wallet size={32} />
        </div>
        <div className="salary-text">
          <h3 style={{ color: '#ffffff', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Income</h3>
          <p style={{ color: '#ffffff', margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 600 }}>Net Monthly Salary</p>
        </div>
      </div>

      <div className="salary-date-wrapper">
        <span className="salary-date-label" style={{ color: '#ffffff' }}>📅 Salary Date</span>
        <input
          type="date"
          className="salary-date-field"
          value={salaryDate || ''}
          onChange={(e) => onSalaryDateChange(e.target.value)}
        />
        {salaryDate && (
          <span className="salary-date-hint" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Financial period starts {new Date(salaryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div className="salary-input-wrapper">
        <span className="currency-label" style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>Rs.</span>
        <input 
          type="number" 
          className="salary-field" 
          value={salary || ''}
          onChange={(e) => onSalaryChange(e.target.value)}
          placeholder="0.00"
          style={{ color: '#ffffff', background: 'transparent', border: 'none', fontFamily: 'inherit', fontSize: '1.25rem', fontWeight: 700, width: '150px', textAlign: 'right', padding: '0 8px' }}
        />
      </div>

      {/* Balance block removed */}
    </div>
  );
};


function AppContent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [authPage, setAuthPage] = useState('start');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [budgets, setBudgets] = useState({});
  const [salary, setSalary] = useState(0);
  const [salaryDate, setSalaryDate] = useState('');
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [balanceWarningMsg, setBalanceWarningMsg] = useState(null);

  const fetchNotificationCount = useCallback(async (userId, token) => {
    try {
      const [spikeRes, readRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/spikeNotifications/${encodeURIComponent(userId)}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/notify/readIds/${encodeURIComponent(userId)}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const spikeData = await spikeRes.json();
      const readData  = await readRes.json();
      if (spikeData.success && readData.success) {
        const readIds = readData.readIds || [];
        const unreadSpikes = (spikeData.data || []).filter(n => !n.read && !readIds.includes(n.id));
        // Check balance warning - only count if not yet seen
        const balanceUnseen = balanceWarningMsg &&
          localStorage.getItem('balance_warning_seen') !== balanceWarningMsg ? 1 : 0;
        setNotificationCount(unreadSpikes.length + balanceUnseen);
      }
    } catch {}
  }, [balanceWarningMsg]);

  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      const token = localStorage.getItem('token');
      // Check if new user (no defaultExp record)
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/userDefault/${encodeURIComponent(user.userId)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (!data || Object.keys(data).length === 0 || !data.categories) {
            setIsNewUser(true);
          }
        })
        .catch(() => {});
      fetchNotificationCount(user.userId, token);
      const interval = setInterval(() => fetchNotificationCount(user.userId, token), 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.userId, fetchNotificationCount]);

  useEffect(() => {
    if (showSetup && user?.userId) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/userDefault/${encodeURIComponent(user.userId)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Object.keys(data).length > 0) setIsExistingUser(true);
          if (data.salary) setSalary(data.salary);
          if (data.salaryDate) setSalaryDate(data.salaryDate);
          if (data.budgets) setBudgets(data.budgets);
        })
        .catch(() => {});
    }
  }, [showSetup, user?.userId]);

  const addCustomCategory = () => {
    const newId = `custom-${Date.now()}`;
    const newCat = { 
      id: newId, 
      name: 'Other Expense', 
      description: 'Custom added category', 
      icon: <Wallet size={20} />,
      isCustom: true 
    };
    setCategories([...categories, newCat]);
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setIsMenuOpen(false);
  };

  const handleBudgetChange = (catId, period, type, value) => {
    setBudgets(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [period]: {
          ...prev[catId]?.[period],
          [type]: value
        }
      }
    }));
  };

  const saveDefaultBudget = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const email = user?.email;
      if (!email) {
        alert('No email found. Please logout and login again.');
        return;
      }

      // Set default budgets
      const defaultBudgets = {};
      categories.forEach(cat => {
        defaultBudgets[cat.id] = {
          daily: { min: 0, max: 1000 },
          monthly: { min: 0, max: 10000 }
        };
      });

      const payload = {
        email,
        salary: salary || 50000, // default salary
        budgets: defaultBudgets,
        categories: categories.map(({ icon, ...rest }) => rest),
      };

      const data = await saveUserDefault(payload);
      if (!data.success) throw new Error(data.message || 'Save failed');
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); }, 2000);
      // Reload the dashboard or something, but since it's mock, maybe refresh categories
      // For simplicity, assume it's saved
    } catch (err) {
      console.error('Save error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleQweClick = () => {
    setSaveSuccess(true);
    setTimeout(() => { setSaveSuccess(false); }, 2000);
  };

  // Add function to update category name
  const updateCategoryName = (catId, newName) => {
    setCategories(prevCategories =>
      prevCategories.map(cat =>
        cat.id === catId ? { ...cat, name: newName } : cat
      )
    );
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authPage === 'start') return <StartPage onNavigate={async (page, u) => {
      if (page === 'dashboard') { login(u); }
      else if (page === '_login_success_') {
        login(u);
        try {
          const r = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/userDefault/${encodeURIComponent(u.userId)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
          const data = await r.json();
          setIsNewUser(Object.keys(data).length === 0);
        } catch { setIsNewUser(false); }
      }
      else { setAuthPage(page); }
    }} />;
    if (authPage === 'signup') return <SignupPage onLogin={() => setAuthPage('login')} onNavigate={setAuthPage} />;
    if (authPage === 'forgot') return <ForgotPasswordPage onNavigate={setAuthPage} />;
    return <LoginPage onLogin={async (u) => {
      login(u);
      try {
        const r = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/userDefault/${encodeURIComponent(u.userId)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const data = await r.json();
        setIsNewUser(Object.keys(data).length === 0);
      } catch { setIsNewUser(false); }
    }} onNavigate={setAuthPage} />;
  }

  return (
    <div className="App">
      <header className="dashboard-header">
        <div className="app-title-section">
          <div className="logo-wrapper">
            <img src={jarLogo} alt="Money Flow Monitor Logo" className="app-logo" />
            <h1 className="app-topic" style={{cursor: 'pointer'}} onClick={() => { setShowSetup(false); setShowNotifications(false); }}>Money Flow Monitor</h1>
          </div>
        </div>

        <div className="right-section">
          <UserProfile name={user?.name || user?.email || 'User'} />
          <DateDisplay />
          
          <div className="bell-btn-wrap">
            <button className="menu-trigger" onClick={async () => {
              setShowNotifications(true);
              setIsMenuOpen(false);
              const storedUser = JSON.parse(localStorage.getItem('user'));
              const userId = storedUser?.userId;
              const token = localStorage.getItem('token');
              if (!userId || !token) return;
              try {
                const r = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/spikeNotifications/${encodeURIComponent(userId)}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await r.json();
                if (data.success && data.data.length > 0) {
                  await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/notify/markRead`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, notifications: data.data }),
                  });
                }
                // Re-fetch count after marking read so red dot clears on refresh
                await fetchNotificationCount(userId, token);
              } catch {}
            }}>
              <Bell size={22} />
            </button>
            {notificationCount > 0 && <span className="notification-dot"></span>}
          </div>

          <div className="menu-container">
            <button className="menu-trigger" onClick={() => {
              if (showNotifications) {
                setShowNotifications(false);
                setShowSetup(false);
              } else {
                setIsMenuOpen(!isMenuOpen);
              }
            }}>
              <EllipsisVertical size={24} />
            </button>
            {isMenuOpen && (
              <div className="dropdown-menu">
                <button className="menu-item" onClick={toggleTheme}>
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button className="menu-item logout" onClick={async () => { 
                  try {
                    await logoutUser();
                    logout();
                    setIsMenuOpen(false);
                  } catch (error) {
                    console.error('Logout error:', error);
                    // Still logout on frontend even if API call fails
                    logout();
                    setIsMenuOpen(false);
                  }
                }}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {!showSetup && !showNotifications ? (
        <main>
          <Dashboard setShowSetup={setShowSetup} saveDefaultBudget={saveDefaultBudget} handleQweClick={handleQweClick} onBalanceWarning={(msg) => { setBalanceWarningMsg(msg); if (msg) setNotificationCount(prev => prev > 0 ? prev : 1); }} />
          {saveSuccess && (
            <div className="save-toast">
              <span className="save-toast-icon">✓</span>
              Today expenses saved successfully!
            </div>
          )}
        </main>
      ) : showNotifications ? (
        <main>
          <NotificationPage onBack={() => {
            setShowNotifications(false);
            setShowSetup(false);
          }} balanceWarning={balanceWarningMsg} />
        </main>
      ) : (
        <main className="budget-setup-container">
          <h2>Setup Your Budget Range</h2>
          <p>Estimate your spending range for each category.</p>
          
          <SalarySection salary={salary} onSalaryChange={setSalary} salaryDate={salaryDate} onSalaryDateChange={setSalaryDate} />
          
          <div className="category-list">
            {categories.map(cat => (
              <div key={cat.id} className="category-card">
                <div className="category-info">
                  <div className="cat-icon">{cat.icon}</div>
                  <div className="cat-text">
                    {cat.isCustom ? (
                      <input 
                        type="text" 
                        className={`cat-name-input ${cat.name !== 'Other Expense' ? 'is-named' : ''}`} 
                        value={cat.name}
                        onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                        placeholder="Category Name"
                      />
                    ) : (
                      <span className="cat-name-static">{cat.name}</span>
                    )}
                    <span className="cat-desc">{cat.description}</span>
                  </div>
                </div>
                <div className="budget-inputs">
                  <div className="range-row">
                    <span className="range-label">Daily</span>
                    <div className="input-pair">
                      <input 
                        type="number" 
                        className="budget-input" 
                        placeholder="Min"
                        value={budgets[cat.id]?.daily?.min || ''}
                        onChange={(e) => handleBudgetChange(cat.id, 'daily', 'min', e.target.value)}
                      />
                      <span className="range-separator">-</span>
                      <input 
                        type="number" 
                        className="budget-input" 
                        placeholder="Max"
                        value={budgets[cat.id]?.daily?.max || ''}
                        onChange={(e) => handleBudgetChange(cat.id, 'daily', 'max', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="range-row">
                    <span className="range-label">Monthly</span>
                    <div className="input-pair">
                      <input 
                        type="number" 
                        className="budget-input" 
                        placeholder="Min"
                        value={budgets[cat.id]?.monthly?.min || ''}
                        onChange={(e) => handleBudgetChange(cat.id, 'monthly', 'min', e.target.value)}
                      />
                      <span className="range-separator">-</span>
                      <input 
                        type="number" 
                        className="budget-input" 
                        placeholder="Max"
                        value={budgets[cat.id]?.monthly?.max || ''}
                        onChange={(e) => handleBudgetChange(cat.id, 'monthly', 'max', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="setup-actions-corner">
            <button className="secondary-btn add-btn left-corner" type="button" onClick={addCustomCategory}>
              <Plus size={18} />
              Add More Categories
            </button>
            <button
              className="primary-btn right-corner"
              onClick={async () => {
                try {
                  const categoriesToSave = categories.map(({ icon, ...rest }) => rest);
                  const storedUser = JSON.parse(localStorage.getItem('user'));
                  const userId = storedUser?.userId;
                  const email = storedUser?.email;

                  if (!userId || !email) {
                    alert('User info not found. Please logout and login again.');
                    return;
                  }

                  const payload = {
                    userId,
                    email,
                    salary: Number(salary),
                    salaryDate,
                    budgets,
                    categories: categoriesToSave,
                  };

                  const data = await saveUserDefault(payload);
                  if (!data.success) throw new Error(data.message || 'Save failed');
                  setSaveSuccess(true);
                  setTimeout(() => { setSaveSuccess(false); setShowSetup(false); }, 2000);
                } catch (err) {
                  console.error('Save error:', err);
                  alert('Error: ' + err.message);
                }
              }}
            >
              {isExistingUser ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </main>
      )}

      {/* Guidance Popup - Centered Glassmorphic Style */}
      {isNewUser && !showSetup && !showNotifications && (
        <div className="onboarding-overlay">
          <div className="onboarding-box">
            <div className="onboarding-icon">
              <img src={jarLogo} alt="Jar Icon" className="popup-logo" />
            </div>
            <h2 className="onboarding-title">Start Your Saving Journey</h2>
            <p className="onboarding-desc">
              Track your money flow and reach your financial goals faster.
              Let's set up your budget to get started. Please fill in 10 day-to-day life expenses.
            </p>
            <div className="button-group">
              <button
                className="secondary-btn"
                onClick={() => setIsNewUser(false)}
              >
                Later
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setIsNewUser(false);
                  setShowSetup(true);
                }}
              >
                Start Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
