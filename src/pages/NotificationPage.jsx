import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingUp, Repeat, CheckCircle, X } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const DUMMY_NOTIFICATIONS = [];

const iconMap = {
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: '#fef3c7' },
  spike:   { icon: TrendingUp,    color: '#ef4444', bg: '#fee2e2' },
  repeat:  { icon: Repeat,        color: '#8b5cf6', bg: '#ede9fe' },
  info:    { icon: CheckCircle,   color: '#4682B4', bg: '#dbeafe' },
};

export default function NotificationPage({ onBack, balanceWarning }) {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token) return;

    Promise.all([
      fetch(`${API}/spikeNotifications/${encodeURIComponent(userId)}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/notify/readIds/${encodeURIComponent(userId)}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([spikeRes, readRes]) => {
        if (spikeRes.success) {
          const readIds = readRes.success ? (readRes.readIds || []) : [];
          const spikeNotifs = spikeRes.data.map(n => ({
            ...n,
            read: readIds.includes(n.id),
            // Use earliest spike date as createdAt for 3-day auto-save check
            createdAt: n.dates?.[0] ? new Date(n.dates[0]).toISOString() : new Date().toISOString(),
          }));

          // Add balance warning notification if present
          const balanceNotif = balanceWarning ? [{
            id: 'balance_warning',
            type: 'warning',
            title: 'Balance Sustainability Warning',
            message: balanceWarning,
            time: 'Just now',
            // Mark as read if user has already opened notifications with this same warning
            read: localStorage.getItem('balance_warning_seen') === balanceWarning,
          }] : [];

          setNotifications([...balanceNotif, ...spikeNotifs]);

          // Auto-save notifications older than 3 days to notify collection
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          const oldUnread = spikeNotifs.filter(n => !readIds.includes(n.id) && new Date(n.createdAt) <= threeDaysAgo);
          if (oldUnread.length > 0) {
            fetch(`${API}/notify/autoSave`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, notifications: oldUnread }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [balanceWarning]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const saveToNotify = (notifList) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token || !notifList.length) return;
    // Save balance warning seen state to localStorage
    notifList.forEach(n => {
      if (n.id === 'balance_warning') {
        localStorage.setItem('balance_warning_seen', n.message);
      }
    });
    const dbNotifs = notifList.filter(n => n.id !== 'balance_warning');
    if (!dbNotifs.length) return;
    fetch(`${API}/notify/markRead`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, notifications: dbNotifs }),
    }).catch(() => {});
  };

  const markAllRead = () => {
    const unread = notifications.filter(n => !n.read);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    saveToNotify(unread);
  };

  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const markRead = (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      // Save to notify collection on first click
      saveToNotify([notif]);
    }
  };

  const filtered = filter === 'all' ? notifications : filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-title-wrap">
            <Bell size={22} color="#4682B4" />
            <h2 className="notif-title">Notifications</h2>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="notif-mark-all" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      <div className="notif-filters">
        {['all', 'unread', 'warning', 'spike', 'repeat', 'info'].map(f => (
          <button
            key={f}
            className={`notif-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="notif-list">
        {filtered.length === 0 ? (
          <div className="notif-empty">
            <Bell size={40} color="#cbd5e1" />
            <p>No notifications here</p>
          </div>
        ) : (
          filtered.map(n => {
            const { icon: Icon, color, bg } = iconMap[n.type];
            return (
              <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                <div className="notif-icon-wrap" style={{ background: bg }}>
                  <Icon size={18} color={color} />
                </div>
                <div className="notif-content">
                  <div className="notif-item-header">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-time">{n.time}</span>
                  </div>
                  <p className="notif-msg">{n.message}</p>
                </div>
                {!n.read && <span className="notif-dot" />}
                <button className="notif-dismiss" onClick={e => { e.stopPropagation(); dismiss(n.id); }}>
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
