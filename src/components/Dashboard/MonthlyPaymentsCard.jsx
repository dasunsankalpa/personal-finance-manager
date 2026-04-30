import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const currentMonth = new Date().toISOString().slice(0, 7);
const COLORS = ['#6366f1','#10b981','#ec4899','#8b5cf6','#22c55e','#ef4444','#f59e0b','#3b82f6','#14b8a6','#f97316'];

export default function MonthlyPaymentsCard({ expenses, setShowSetup, handleQweClick, updateExpense, userDefault }) {
  const budgets = userDefault?.budgets || {};
  const categories = userDefault?.categories || [];

  const [rowData, setRowData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [popupCatId, setPopupCatId] = useState(null);
  const [popupNote, setPopupNote] = useState('');
  const [removedCats, setRemovedCats] = useState([]);

  const hasMonthly = (catId) => budgets[catId]?.monthly?.max || budgets[catId]?.monthly?.min;
  const hasDaily    = (catId) => budgets[catId]?.daily?.max   || budgets[catId]?.daily?.min;

  const allMonthlyCats = categories.filter(cat => hasMonthly(cat.id) && !hasDaily(cat.id));
  const monthlyCats = allMonthlyCats.filter(cat => !removedCats.includes(cat.id));

  // Load this month's logs from DB on mount / when userDefault loads
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.userId;
    const token = localStorage.getItem('token');
    if (!userId || !token || monthlyCats.length === 0) return;

    fetch(`${API}/monthlyExp/${encodeURIComponent(userId)}/${currentMonth}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const loaded = {};
          res.data.expenses?.forEach(exp => { loaded[exp.category] = { amount: exp.amount, note: exp.note }; });
          setRowData(loaded);
        }
      })
      .catch(() => {});
  }, [userDefault, monthlyCats.length]);

  const getCategoryRange = (catId) => {
    const monthly = budgets[catId]?.monthly;
    if (!monthly) return '— - —';
    const min = monthly.min ?? '—';
    const max = monthly.max ?? '—';
    return `${min !== '—' ? Number(min).toLocaleString('en-LK') : '—'} - ${max !== '—' ? Number(max).toLocaleString('en-LK') : '—'}`;
  };

  const getAdditionalPayment = (catId, amount) => {
    const max = budgets[catId]?.monthly?.max;
    if (max == null) return 0;
    return Number(max) - Number(amount || 0);
  };

  const handleAmountChange = (catId, value) => {
    setRowData(prev => ({ ...prev, [catId]: { ...prev[catId], amount: value } }));
    const max = budgets[catId]?.monthly?.max;
    if (max != null && Number(max) - Number(value || 0) < 0) {
      const currentNote = rowData[catId]?.note || '';
      if (!currentNote.trim()) openNotePopup(catId);
    }
  };

  const handleNoteChange = (catId, value) => {
    setRowData(prev => ({ ...prev, [catId]: { ...prev[catId], note: value } }));
  };

  const openNotePopup = (catId) => {
    setPopupCatId(catId);
    setPopupNote(rowData[catId]?.note || '');
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

    // Block save if any negative additionalPayment has no note
    const missingNote = monthlyCats.find(cat => {
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
      const expenses = monthlyCats.map(cat => {
        const amount = Number(rowData[cat.id]?.amount) || 0;
        const add = getAdditionalPayment(cat.id, amount);
        return {
          category: cat.id,
          amount,
          note: rowData[cat.id]?.note || '',
          ...(add < 0 ? { additionalPayment: add } : {}),
        };
      });
      const res = await fetch(`${API}/monthlyExp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, month: currentMonth, expenses }),
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
        <span className="dash-card-title">Monthly Expenses</span>
        <span className="dash-card-badge">{monthlyCats.filter(c => rowData[c.id]?.amount > 0).length} this month</span>
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
              <th>Month</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {monthlyCats.map((cat, i) => {
              const amount = rowData[cat.id]?.amount ?? '';
              const note = rowData[cat.id]?.note || '';
              const additional = getAdditionalPayment(cat.id, amount);
              return (
                <tr key={cat.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="cat-badge" style={{ '--badge-color': COLORS[i % COLORS.length] }}>
                      {cat.name}
                    </span>
                    <button
                      onClick={() => removeCategory(cat.id)}
                      title="Remove from this month's entry"
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
                        color: (additional < 0 && !note.trim()) ? '#ef4444' : 'var(--primary)',
                        fontWeight: (additional < 0 && !note.trim()) ? 700 : 400,
                      }}
                    >
                      {note || (additional < 0 ? '⚠ Required' : '—')}
                    </span>
                  </td>
                  <td className="amount-cell" style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                      style={{ width: '90px', textAlign: 'right', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 4px', background: 'transparent', color: 'var(--text-main)' }}
                      placeholder="0"
                    />
                  </td>
                  <td style={{
                    textAlign: 'right', fontSize: '0.9rem',
                    color: '#dc2626'
                  }}>
                    {additional < 0 ? `Rs. ${additional.toLocaleString('en-LK')}` : ''}
                  </td>
                  <td>{currentMonth}</td>
                  <td style={{display:'none'}}></td>
                </tr>
              );
            })}
            {monthlyCats.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No monthly categories set up yet
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
              {allMonthlyCats.find(c => c.id === popupCatId)?.name || ''}
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
        {saving ? 'Saving...' : 'update'}
      </button>
    </div>
  );
}
