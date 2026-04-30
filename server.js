const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'money_flow_monitor_jwt_secret_key_2026_change_this_in_production';

app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb+srv://dasunsankalpapathirana_db_user:111@cluster0.czzjaud.mongodb.net/logDB?retryWrites=true&w=majority';

// ── Schemas ──────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  userId:    { type: String, unique: true, required: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const defaultExpSchema = new mongoose.Schema({
  userId:     { type: String, required: true, unique: true },
  email:      { type: String, required: true },
  salary:     { type: Number, default: 0 },
  salaryDate: { type: String, default: '' },
  categories: [{ id: String, name: String, description: String, isCustom: { type: Boolean, default: false } }],
  budgets:    { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt:  { type: Date, default: Date.now },
});

const expenseItemSchema = new mongoose.Schema({
  category:          String,
  amount:            Number,
  note:              String,
  additionalPayment: { type: Number, default: 0 },
});

const dailyExpSchema = new mongoose.Schema({
  userId:            { type: String, required: true },
  date:              { type: String, required: true },
  expenses:          [expenseItemSchema],
  totalAmount:       { type: Number, default: 0 },
  additionalPayment: { type: Number, default: 0 },
  updatedAt:         { type: Date, default: Date.now },
});
dailyExpSchema.index({ userId: 1, date: 1 }, { unique: true });

const monthlyExpSchema = new mongoose.Schema({
  userId:            { type: String, required: true },
  month:             { type: String, required: true },
  expenses:          [expenseItemSchema],
  totalAmount:       { type: Number, default: 0 },
  additionalPayment: { type: Number, default: 0 },
  updatedAt:         { type: Date, default: Date.now },
});
monthlyExpSchema.index({ userId: 1, month: 1 }, { unique: true });

const notifySchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  notifId:   { type: String, required: true },
  type:      { type: String },
  title:     { type: String },
  message:   { type: String },
  category:  { type: String },
  readAt:    { type: Date, default: null },
  autoSaved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
notifySchema.index({ userId: 1, notifId: 1 }, { unique: true });

// ── Models ────────────────────────────────────────────────
const User = mongoose.model('Register', userSchema, 'register');
let DefaultExp, DailyExp, MonthlyExp, Notify;

// ── Connect ───────────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB logDB');
    const expenceDB = mongoose.connection.useDb('expenceDB');
    DefaultExp = expenceDB.model('DefaultExp', defaultExpSchema, 'defaultExp');
    DailyExp   = expenceDB.model('DailyExp',   dailyExpSchema,   'dailyExp');
    MonthlyExp = expenceDB.model('MonthlyExp', monthlyExpSchema, 'monthlyExp');
    Notify     = mongoose.connection.useDb('logDB').model('Notify', notifySchema, 'notify');
    console.log('expenceDB models ready: defaultExp, dailyExp, monthlyExp | logDB: notify');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// ── Helpers ───────────────────────────────────────────────
function generateUserId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `USER_${timestamp}_${random}`.toUpperCase();
}

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ── Auth Routes ───────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    const hashedPassword = await bcrypt.hash(password, 10);
    let userId;
    do { userId = generateUserId(); } while (await User.findOne({ userId }));
    const newUser = await new User({ userId, name, email, password: hashedPassword }).save();
    const token = jwt.sign({ userId: newUser.userId, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, message: 'User registered successfully', user: { userId: newUser.userId, name: newUser.name, email: newUser.email }, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Login successful', user: { userId: user.userId, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { userId: user.userId, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DefaultExp Routes ─────────────────────────────────────
// GET /api/userDefault/:userId
app.get('/api/userDefault/:userId', authenticateToken, async (req, res) => {
  try {
    const record = await DefaultExp.findOne({ userId: req.params.userId });
    res.json(record || {});
  } catch (err) {
    console.error('Get userDefault error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/userDefault
app.post('/api/userDefault', authenticateToken, async (req, res) => {
  try {
    const { userId, email, salary, salaryDate, categories, budgets } = req.body;
    if (!userId || !email)
      return res.status(400).json({ success: false, message: 'userId and email are required' });
    let record = await DefaultExp.findOne({ userId });
    if (record) {
      record.email      = email;
      record.salary     = salary;
      record.salaryDate = salaryDate || record.salaryDate;
      record.categories = categories;
      record.budgets    = budgets;
      record.updatedAt  = new Date();
    } else {
      record = new DefaultExp({ userId, email, salary, salaryDate: salaryDate || '', categories, budgets, updatedAt: new Date() });
    }
    await record.save();
    res.json({ success: true, message: 'Default expenses saved', data: {
      _id: record._id, userId: record.userId, email: record.email,
      salary: record.salary, salaryDate: record.salaryDate
    }});
  } catch (err) {
    console.error('Save userDefault error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DailyExp Routes ───────────────────────────────────────
// GET /api/dailyExp/:userId/:date  (date = YYYY-MM-DD)
app.get('/api/dailyExp/:userId/:date', authenticateToken, async (req, res) => {
  try {
    const record = await DailyExp.findOne({ userId: req.params.userId, date: req.params.date });
    res.json({ success: true, data: record || { expenses: [], totalAmount: 0 } });
  } catch (err) {
    console.error('Get dailyExp error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/dailyExp  — save/update daily expenses
app.post('/api/dailyExp', authenticateToken, async (req, res) => {
  try {
    const { userId, date, expenses } = req.body;
    if (!userId || !date)
      return res.status(400).json({ success: false, message: 'userId and date are required' });
    const totalAmount = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    let record = await DailyExp.findOne({ userId, date });
    if (record) {
      record.expenses = expenses;
      record.totalAmount = totalAmount;
      record.updatedAt = new Date();
    } else {
      record = new DailyExp({ userId, date, expenses, totalAmount, updatedAt: new Date() });
    }
    await record.save();
    res.json({ success: true, message: 'Daily expenses saved', data: record });
  } catch (err) {
    console.error('Save dailyExp error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dailyExp/:userId  — get all daily records for a user
app.get('/api/dailyExp/:userId', authenticateToken, async (req, res) => {
  try {
    const records = await DailyExp.find({ userId: req.params.userId }).sort({ date: -1 });
    const dailyAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
    res.json({ success: true, dailyAmount, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── MonthlyExp Routes ─────────────────────────────────────
// GET /api/monthlyExp/:userId/:month  (month = YYYY-MM)
app.get('/api/monthlyExp/:userId/:month', authenticateToken, async (req, res) => {
  try {
    const record = await MonthlyExp.findOne({ userId: req.params.userId, month: req.params.month });
    res.json({ success: true, data: record || { expenses: [], totalAmount: 0 } });
  } catch (err) {
    console.error('Get monthlyExp error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/monthlyExp  — save/update monthly expenses
app.post('/api/monthlyExp', authenticateToken, async (req, res) => {
  try {
    const { userId, month, expenses } = req.body;
    if (!userId || !month)
      return res.status(400).json({ success: false, message: 'userId and month are required' });
    const totalAmount = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    let record = await MonthlyExp.findOne({ userId, month });
    if (record) {
      record.expenses = expenses;
      record.totalAmount = totalAmount;
      record.updatedAt = new Date();
    } else {
      record = new MonthlyExp({ userId, month, expenses, totalAmount, updatedAt: new Date() });
    }
    await record.save();
    res.json({ success: true, message: 'Monthly expenses saved', data: record });
  } catch (err) {
    console.error('Save monthlyExp error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/monthlyExp/:userId  — get all monthly records for a user
app.get('/api/monthlyExp/:userId', authenticateToken, async (req, res) => {
  try {
    const records = await MonthlyExp.find({ userId: req.params.userId }).sort({ month: -1 });
    const monthlyAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
    res.json({ success: true, monthlyAmount, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chartData/:userId/:year — sum dailyExp and monthlyExp amounts per month for the year
app.get('/api/chartData/:userId/:year', authenticateToken, async (req, res) => {
  try {
    const { userId, year } = req.params;

    // Sum dailyExp amounts and additionalPayment per month
    const dailyRecords = await DailyExp.find({ userId, date: { $regex: `^${year}-` } });
    const dailyByMonth = {};
    const additionalByMonth = {};
    dailyRecords.forEach(r => {
      const month = r.date.slice(0, 7);
      dailyByMonth[month] = (dailyByMonth[month] || 0) +
        (r.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      additionalByMonth[month] = (additionalByMonth[month] || 0) +
        (r.expenses || []).reduce((sum, e) => sum + Math.abs(Number(e.additionalPayment || 0)), 0) +
        Math.abs(Number(r.additionalPayment || 0));
    });

    // Sum monthlyExp amounts and additionalPayment per month
    const monthlyRecords = await MonthlyExp.find({ userId, month: { $regex: `^${year}-` } });
    const monthlyByMonth = {};
    monthlyRecords.forEach(r => {
      monthlyByMonth[r.month] = (r.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      additionalByMonth[r.month] = (additionalByMonth[r.month] || 0) +
        (r.expenses || []).reduce((sum, e) => sum + Math.abs(Number(e.additionalPayment || 0)), 0) +
        Math.abs(Number(r.additionalPayment || 0));
    });

    // Build 12-month result
    const result = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      result.push({
        month:             key,
        dailyAmount:       dailyByMonth[key]      || 0,
        monthlyAmount:     monthlyByMonth[key]    || 0,
        additionalAmount:  additionalByMonth[key] || 0,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('chartData error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/spikeNotifications/:userId — detect additional payment spikes per category within a week
app.get('/api/spikeNotifications/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get last 7 days date range
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);

    // Format as YYYY-MM-DD strings
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const startDate = fmt(weekAgo);
    const endDate   = fmt(today);

    console.log(`Spike check for ${userId}: ${startDate} to ${endDate}`);

    // Fetch all daily records within the last 7 days
    const records = await DailyExp.find({ userId }).sort({ date: 1 });
    console.log(`Total records found for user: ${records.length}`);

    const weekRecords = records.filter(r => r.date >= startDate && r.date <= endDate);

    // Count additional payment occurrences per category
    const categoryCount = {};
    const categoryDates = {};
    weekRecords.forEach(r => {
      (r.expenses || []).forEach(e => {
        if (e.additionalPayment && Math.abs(Number(e.additionalPayment)) > 0) {
          const cat = e.category;
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          if (!categoryDates[cat]) categoryDates[cat] = [];
          categoryDates[cat].push(r.date);
        }
      });
    });

    console.log('Category counts:', categoryCount);

    // Build spike notifications for categories with 3+ occurrences
    const notifications = [];
    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count >= 3) {
        const ordinal = count === 3 ? '3rd' : count === 4 ? '4th' : `${count}th`;
        notifications.push({
          id: `spike_${category}`,
          type: 'spike',
          category,
          count,
          title: `${ordinal} Additional Payment Spike — ${category}`,
          message: `The "${category}" category has exceeded its budget ${count} times this week (${categoryDates[category].join(', ')}). Please review your spending.`,
          dates: categoryDates[category],
          time: 'This week',
        });
      }
    });

    // Check which notifications have already been read from notify collection
    const readRecords = await Notify.find({ userId, readAt: { $ne: null } });
    const readIds = readRecords.map(r => r.notifId);
    const notificationsWithReadState = notifications.map(n => ({
      ...n,
      read: readIds.includes(n.id),
    }));

    res.json({ success: true, data: notificationsWithReadState });
  } catch (err) {
    console.error('spikeNotifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ── Notify Routes ─────────────────────────────────────────
app.post('/api/notify/markRead', authenticateToken, async (req, res) => {
  try {
    const { userId, notifications } = req.body;
    if (!userId || !notifications?.length)
      return res.status(400).json({ success: false, message: 'userId and notifications required' });
    for (const n of notifications) {
      const exists = await Notify.findOne({ userId, notifId: n.id });
      if (!exists) {
        await new Notify({ userId, notifId: n.id, type: n.type, title: n.title, message: n.message, category: n.category || '', readAt: new Date(), autoSaved: false }).save();
      } else if (!exists.readAt) {
        exists.readAt = new Date();
        await exists.save();
      }
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/notify/readIds/:userId', authenticateToken, async (req, res) => {
  try {
    const records = await Notify.find({ userId: req.params.userId, readAt: { $ne: null } });
    res.json({ success: true, readIds: records.map(r => r.notifId) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/notify/autoSave', authenticateToken, async (req, res) => {
  try {
    const { userId, notifications } = req.body;
    if (!userId || !notifications?.length)
      return res.status(400).json({ success: false, message: 'userId and notifications required' });
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    let saved = 0;
    for (const n of notifications) {
      const exists = await Notify.findOne({ userId, notifId: n.id });
      if (!exists) {
        const createdAt = new Date(n.createdAt || Date.now());
        if (createdAt <= threeDaysAgo) {
          await new Notify({ userId, notifId: n.id, type: n.type, title: n.title, message: n.message, category: n.category || '', readAt: null, autoSaved: true }).save();
          saved++;
        }
      }
    }
    res.json({ success: true, autoSaved: saved });
  } catch (err) {
    console.error('autoSave error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/logout', (req, res) => res.json({ success: true, message: 'Logged out successfully' }));

app.post('/api/refresh-token', authenticateToken, async (req, res) => {
  try {
    const newToken = jwt.sign({ userId: req.user.userId, email: req.user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token: newToken });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  exec('start http://localhost:3000');
});
