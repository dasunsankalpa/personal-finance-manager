const today = new Date().toISOString().slice(0, 10);
const thisMonth = new Date().toISOString().slice(0, 7);
const monthDate = (d) => `${thisMonth}-${d}`;

export const MOCK_EXPENSES = [
  // Daily expenses (today)
  { id: 1,  amount: 3500, category: 'Food & Groceries',          date: today,           note: 'Supermarket run' },
  { id: 2,  amount: 1200, category: 'Transport',                  date: today,           note: 'Fuel' },
  { id: 3,  amount: 450,  category: 'Food & Groceries',          date: today,           note: 'Lunch' },
  { id: 4,  amount: 800,  category: 'Household Essentials',       date: today,           note: 'Cleaning supplies' },
  { id: 5,  amount: 600,  category: 'Unexpected Spending',        date: today,           note: 'Car repair' },
  { id: 12, amount: 250,  category: 'Food & Groceries',          date: today,           note: 'Coffee' },
  { id: 13, amount: 300,  category: 'Transport',                  date: today,           note: 'Parking' },
  { id: 14, amount: 150,  category: 'Communication',             date: today,           note: 'Data recharge' },
  { id: 15, amount: 700,  category: 'Healthcare',                date: today,           note: 'Medicine' },
  { id: 16, amount: 400,  category: 'Education',                 date: today,           note: 'Books' },
  // Monthly payments (this month)
  { id: 6,  amount: 25000, category: 'Housing or Rent',           date: monthDate('01'), note: 'Monthly rent' },
  { id: 7,  amount: 3200,  category: 'Utilities',                 date: monthDate('02'), note: 'Electricity bill' },
  { id: 8,  amount: 1800,  category: 'Communication',             date: monthDate('03'), note: 'Mobile & internet' },
  { id: 9,  amount: 4500,  category: 'Education',                 date: monthDate('04'), note: 'Online course' },
  { id: 10, amount: 5000,  category: 'Savings or Emergency Fund', date: monthDate('05'), note: 'Monthly savings' },
  { id: 11, amount: 2200,  category: 'Healthcare',                date: monthDate('06'), note: 'Pharmacy' },
  { id: 17, amount: 1500,  category: 'Housing or Rent',           date: monthDate('07'), note: 'Maintenance' },
  { id: 18, amount: 2800,  category: 'Utilities',                 date: monthDate('08'), note: 'Water bill' },
  { id: 19, amount: 1200,  category: 'Communication',             date: monthDate('09'), note: 'Cable TV' },
  { id: 20, amount: 3000,  category: 'Education',                 date: monthDate('10'), note: 'Tuition fee' },
  { id: 21, amount: 4000,  category: 'Savings or Emergency Fund', date: monthDate('11'), note: 'Emergency fund' },
  { id: 22, amount: 1800,  category: 'Healthcare',                date: monthDate('12'), note: 'Dental checkup' },
];

export const fetchExpenses = () => {
  // Always return mock expenses for frontend-only mode
  return Promise.resolve(MOCK_EXPENSES);
};

export const addExpense = (expense) => {
  // Mock implementation: add to local array (but since it's mock, just return success)
  MOCK_EXPENSES.push({ ...expense, id: MOCK_EXPENSES.length + 1 });
  return Promise.resolve({ success: true });
};
