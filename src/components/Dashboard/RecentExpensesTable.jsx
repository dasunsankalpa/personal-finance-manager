import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const COLORS = ['#f59e0b','#3b82f6','#10b981','#6366f1','#ec4899','#ef4444','#8b5cf6','#14b8a6','#22c55e','#f97316'];

function getDateOptions() {
  const options = [];
  for (let i = 0; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    options.push(d.toISOString().split('T')[0]);
  }
  return options;
}

export default function RecentExpensesTable({ expenses, setShowSetup, handleQweClick, updateExpense, userDefault }) {
  const dateOptions = getDateOptions();
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]);
  const budgets = userDefault?.budgets || {};
  const categories = userDefault?.categories || [];

  const [rowData, setRowData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [popupCatId, setPopupCatId] = useState(null);
  const [popupNote, setPopupNote] = useState('');
  const [removedCats, setRemovedCats] = useState([]);

  const hasDaily    = (catId) => budgets[catId]?.daily?.max   || budgets[catId]?.daily?.min;
  const hasMonthly  = (catId) => budgets[catId]?.monthly?.max || budgets[catId]?.monthly?.min;

  const allDailyCats = categories.filter(cat => hasDaily(cat.id) && !hasMonthly(cat.id));
  const dailyCats = allDailyCats.filter(cat => !removedCats.includes(cat.id));

  // Reset removed cats when date changes
  useEffect(() => { setRemovedCats([]); }, [selectedDate]);

  // Trigger fill-missing dummy records once userDefault is loaded
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token || allDailyCats.length === 0) return;
    fetch(`${API}/dailyExp/fillMissing`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, categories: allDailyCats.map(c => c.id) }),
    }).catch(() => {});
  }, [userDefault, allDailyCats]);

  // Load logs for selected date
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token || allDailyCats.length === 0) return;
    fetch(`${API}/dailyExp/${encodeURIComponent(userId)}/${selectedDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const loaded = {};
          res.data.expenses?.forEach(exp => {
            loaded[exp.category] = { amount: exp.amount, note: exp.note, isDummy: res.data.isDummy };
          });
          setRowData(loaded);
        }
      })
      .catch(() => {});
  }, [selectedDate, userDefault, allDailyCats.length]);

  const getCategoryRange = (catId) => {
    const daily = budgets[catId]?.daily;
    if (!daily) return '— - —';
    const min = daily.min ?? '—';
    const max = daily.max ?? '—';
    return `${min !== '—' ? Number(min).toLocaleString('en-LK') : '—'} - ${max !== '—' ? Number(max).toLocaleString('en-LK') : '—'}`;
  };

  const getAdditionalPayment = (catId, amount) => {
    const max = budgets[catId]?.daily?.max;
    if (max == null) return 0;
    return Number(max) - Number(amount || 0);
  };

  const handleAmountChange = (catId, value) => {
    setRowData(prev => ({ ...prev, [catId]: { ...prev[catId], amount: value, isDummy: false } }));
    const max = budgets[catId]?.daily?.max;
    if (max != null && Number(max) - Number(value || 0) < 0) {
      const currentNote = rowData[catId]?.note || '';
      if (!currentNote.trim()) openNotePopup(catId);
    }
  };

  const handleNoteChange = (catId, value) => {
    setRowData(prev => ({ ...prev, [catId]: { ...prev[catId], note: value, isDummy: false } }));
  };

  const openNotePopup = (catId) => {
    setPopupCatId(catId);
    setPopupNote(rowData[catId]?.note === 'auto-filled' ? '' : rowData[catId]?.note || '');
    setShowNotePopup(true);
  };

  const saveNotePopup = () => {
    if (popupCatId) handleNoteChange(popupCatId, popupNote);
    setShowNotePopup(false);
    setPopupCatId(null);
    setPopupNote('');
  };

  const removeCategory = (catId) => {
    setRemovedCats(prev => [...prev, catId]);
    setRowData(prev => { const n = { ...prev }; delete n[catId]; return n; });
  };

  const saveAll = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token) return;

    const missingNote = dailyCats.find(cat => {
      const amount = Number(rowData[cat.id]?.amount) || 0;
      const add = getAdditionalPayment(cat.id, amount);
      return add < 0 && !rowData[cat.id]?.note?.trim();
    });
    if (missingNote) {
      alert(`Please add a note for "${missingNote.name}" — a note is required when additional payment is negative.`);
      openNotePopup(missingNote.id);
      return;
    }

    setSaving(true);
    try {
      const expensesToSave = dailyCats.map(cat => {
        const amount = Number(rowData[cat.id]?.amount) || 0;
        const add = getAdditionalPayment(cat.id, amount);
        return {
          category: cat.id,
          amount,
          note: rowData[cat.id]?.note || '',
          ...(add < 0 ? { additionalPayment: add } : {}),
        };
      });
      const res = await fetch(`${API}/dailyExp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date: selectedDate, expenses: expensesToSave }),
      }).then(r => r.json());
      if (!res.success) { alert(res.message); return; }
      handleQweClick();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash-card" style={{ position: 'relative', paddingBottom: '50px' }}>
      <div className="dash-card-header">
        <span className="dash-card-title">Today Payment</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            {dateOptions.map(d => (
              <option key={d} value={d}>{d === dateOptions[0] ? `Today (${d})` : d}</option>
            ))}
          </select>
          <span className="dash-card-badge">{dailyCats.filter(c => rowData[c.id]?.amount > 0).length} filled</span>
        </div>
      </div>
      <div className="table-wrap">
        <table className="expense-table">
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>Category</th>
              <th>Min-Max Range</th>
              <th>Note</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Additional Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dailyCats.map((cat, i) => {
              const amount = rowData[cat.id]?.amount ?? '';
              const note = rowData[cat.id]?.note || '';
              const isDummy = rowData[cat.id]?.isDummy;
              const additional = getAdditionalPayment(cat.id, amount);
              return (
                <tr key={cat.id} style={{ opacity: isDummy ? 0.6 : 1 }}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="cat-badge" style={{ '--badge-color': COLORS[i % COLORS.length] }}>
                      {cat.name}
                    </span>
                    {isDummy && (
                      <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#f59e0b', color: '#fff', borderRadius: '4px', padding: '1px 5px' }}>
                        auto
                      </span>
                    )}
                    <button
                      onClick={() => removeCategory(cat.id)}
                      title="Remove from today's entry"
                      style={{ marginLeft: '6px', background: 'none', border: '1.5px solid #ef4444', borderRadius: '50%', cursor: 'pointer', color: '#ef4444', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, lineHeight: 1, padding: 0, verticalAlign: 'middle', flexShrink: 0 }}
                    >−</button>
                  </td>
                  <td className="range-cell" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {getCategoryRange(cat.id)}
                  </td>
                  <td className="note-cell">
                    <span
                      onClick={() => openNotePopup(cat.id)}
                      style={{
                        cursor: 'pointer', textDecoration: 'underline',
                        color: (additional < 0 && !note.trim()) ? '#ef4444' : isDummy ? 'var(--text-muted)' : 'var(--primary)',
                        fontWeight: (additional < 0 && !note.trim()) ? 700 : 400,
                      }}
                    >
                      {isDummy ? 'auto-filled' : (note || (additional < 0 ? '⚠ Required' : '—'))}
                    </span>
                  </td>
                  <td className="amount-cell" style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                      style={{ width: '90px', textAlign: 'right', border: `1px solid ${isDummy ? '#f59e0b' : 'var(--border-color)'}`, borderRadius: '4px', padding: '2px 4px', background: 'transparent', color: 'var(--text-main)' }}
                      placeholder="0"
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '0.9rem', color: '#dc2626' }}>
                    {additional < 0 ? `Rs. ${additional.toLocaleString('en-LK')}` : ''}
                  </td>
                  <td style={{display:'none'}}></td>
                </tr>
              );
            })}
            {dailyCats.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No daily categories set up yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNotePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '400px', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#333' }}>Edit Note</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem',
              color: getAdditionalPayment(popupCatId, rowData[popupCatId]?.amount) < 0 ? '#ef4444' : 'var(--text-muted)',
              fontWeight: getAdditionalPayment(popupCatId, rowData[popupCatId]?.amount) < 0 ? 600 : 400
            }}>
              {allDailyCats.find(c => c.id === popupCatId)?.name || ''}
              {getAdditionalPayment(popupCatId, rowData[popupCatId]?.amount) < 0
                ? ' – why you passing your average maximum value provide reason'
                : ' – Note'}
            </p>
            <textarea
              value={popupNote}
              onChange={(e) => setPopupNote(e.target.value)}
              style={{ width: '100%', minHeight: '60px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Enter note..."
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button onClick={() => setShowNotePopup(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveNotePopup} style={{ padding: '8px 16px', border: 'none', background: 'var(--primary)', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>OK</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setShowSetup(true)} style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
        Add New Category & Update
      </button>
      <button
        onClick={saveAll}
        disabled={saving}
        style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
      >
        {saving ? 'Saving...' : 'day update'}
      </button>
    </div>
  );
}
