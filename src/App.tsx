/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PieChart, 
  User, 
  Plus, 
  LogOut, 
  TrendingUp, 
  Calendar, 
  Wallet,
  ChevronRight,
  Bell,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  target_id?: number;
}

interface SavingsTarget {
  id: number;
  name: string;
  amount: number;
  saved_amount: number;
  deadline: string;
  description: string;
  status: 'active' | 'completed';
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string, key?: React.Key }) => (
  <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 p-5", className)}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-600"
  };
  
  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2", 
        variants[variant], 
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input 
      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
      {...props}
    />
  </div>
);

const Select = ({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: { value: string, label: string }[] }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select 
      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
      {...props}
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// --- Pages ---

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { name, email, password } : { email, password };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
        navigate('/');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Connection error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <Wallet className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nabung Pintar</h1>
          <p className="text-slate-500">Kelola keuanganmu dengan cerdas</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input label="Nama Lengkap" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
            )}
            <Input label="Email" type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            
            <Button type="submit" className="w-full py-3 mt-2">
              {isRegister ? 'Daftar Sekarang' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-emerald-600 font-medium hover:underline"
            >
              {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ balance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeTargets, setActiveTargets] = useState<SavingsTarget[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [statsRes, transRes, targetRes] = await Promise.all([
        fetch(`/api/stats?userId=${user.id}`),
        fetch(`/api/transactions?userId=${user.id}`),
        fetch(`/api/targets?userId=${user.id}`)
      ]);
      setStats(await statsRes.json());
      setRecentTransactions((await transRes.json()).slice(0, 5));
      setActiveTargets((await targetRes.json()).filter((t: any) => t.status === 'active'));
    };
    fetchData();
  }, [user]);

  const chartData = [
    { name: 'Minggu 1', income: 4000000, expense: 2400000 },
    { name: 'Minggu 2', income: 3000000, expense: 1398000 },
    { name: 'Minggu 3', income: 2000000, expense: 9800000 },
    { name: 'Minggu 4', income: 2780000, expense: 3908000 },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Halo, {user?.name}! 👋</h1>
          <p className="text-slate-500">Berikut ringkasan keuanganmu hari ini.</p>
        </div>
        <button className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          <Bell size={20} />
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-600 border-none text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-medium mb-1">Total Saldo</p>
            <h2 className="text-3xl font-bold">{formatCurrency(stats.balance)}</h2>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100">
              <TrendingUp size={16} />
              <span>+12% dari bulan lalu</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Wallet size={120} />
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Pemasukan Bulan Ini</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.monthlyIncome)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Pengeluaran Bulan Ini</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.monthlyExpense)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Statistik Mingguan</h3>
            <Select 
              options={[{ value: 'month', label: 'Bulan Ini' }, { value: 'year', label: 'Tahun Ini' }]} 
              className="py-1.5 text-xs"
            />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#059669" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Active Targets */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Target Aktif</h3>
            <Link to="/targets" className="text-emerald-600 text-sm font-medium">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {activeTargets.length > 0 ? activeTargets.slice(0, 3).map(target => {
              const progress = (target.saved_amount / target.amount) * 100;
              return (
                <div key={target.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{target.name}</span>
                    <span className="text-slate-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <Target className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-400 text-sm">Belum ada target aktif</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900">Transaksi Terakhir</h3>
          <Link to="/transactions" className="text-emerald-600 text-sm font-medium">Lihat Semua</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTransactions.map(tx => (
            <div key={tx.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{tx.category}</p>
                  <p className="text-xs text-slate-500">{format(parseISO(tx.date), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <p className={cn(
                "font-bold",
                tx.type === 'income' ? "text-emerald-600" : "text-slate-900"
              )}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const Targets = () => {
  const { user } = useAuth();
  const [targets, setTargets] = useState<SavingsTarget[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTarget, setNewTarget] = useState({ name: '', amount: '', deadline: '', description: '' });

  const fetchTargets = async () => {
    const res = await fetch(`/api/targets?userId=${user?.id}`);
    setTargets(await res.json());
  };

  useEffect(() => { fetchTargets(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTarget, userId: user?.id })
    });
    setShowAdd(false);
    setNewTarget({ name: '', amount: '', deadline: '', description: '' });
    fetchTargets();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Target Tabungan</h1>
          <p className="text-slate-500">Wujudkan impianmu satu per satu.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={20} />
          <span className="hidden sm:inline">Tambah Target</span>
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targets.map(target => {
          const progress = (target.saved_amount / target.amount) * 100;
          const isCompleted = target.status === 'completed' || progress >= 100;

          return (
            <Card key={target.id} className="group hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Target size={24} />
                </div>
                {isCompleted ? (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={12} /> SELESAI
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">AKTIF</span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1">{target.name}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{target.description || 'Tidak ada deskripsi'}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Progres</span>
                  <span className="font-bold text-slate-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    className={cn("h-full rounded-full", isCompleted ? "bg-emerald-500" : "bg-emerald-500")}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{formatCurrency(target.saved_amount)}</span>
                  <span>{formatCurrency(target.amount)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                <Calendar size={14} />
                <span>Deadline: {target.deadline ? format(parseISO(target.deadline), 'dd MMM yyyy') : 'Tidak ada'}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Tambah Target Baru</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                  <Input label="Nama Target" placeholder="Contoh: Beli Laptop" value={newTarget.name} onChange={e => setNewTarget({...newTarget, name: e.target.value})} required />
                  <Input label="Nominal Target" type="number" placeholder="0" value={newTarget.amount} onChange={e => setNewTarget({...newTarget, amount: e.target.value})} required />
                  <Input label="Deadline" type="date" value={newTarget.deadline} onChange={e => setNewTarget({...newTarget, deadline: e.target.value})} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Deskripsi</label>
                    <textarea 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      rows={3}
                      value={newTarget.description}
                      onChange={e => setNewTarget({...newTarget, description: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAdd(false)}>Batal</Button>
                    <Button type="submit" className="flex-1">Simpan</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targets, setTargets] = useState<SavingsTarget[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState({ type: 'expense', category: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), targetId: '' });

  const fetchData = async () => {
    const [txRes, targetRes] = await Promise.all([
      fetch(`/api/transactions?userId=${user?.id}`),
      fetch(`/api/targets?userId=${user?.id}`)
    ]);
    setTransactions(await txRes.json());
    setTargets((await targetRes.json()).filter((t: any) => t.status === 'active'));
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTx, userId: user?.id })
    });
    setShowAdd(false);
    setNewTx({ type: 'expense', category: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), targetId: '' });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus transaksi ini?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaksi</h1>
          <p className="text-slate-500">Catat setiap pengeluaran dan pemasukanmu.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={20} />
          <span className="hidden sm:inline">Tambah Transaksi</span>
        </Button>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tanggal</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Kategori</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tipe</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nominal</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(tx.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{tx.category}</p>
                    <p className="text-xs text-slate-400">{tx.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-bold",
                      tx.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {tx.type === 'income' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(tx.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Tambah Transaksi</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button 
                      type="button"
                      onClick={() => setNewTx({...newTx, type: 'expense'})}
                      className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", newTx.type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500")}
                    >
                      Pengeluaran
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewTx({...newTx, type: 'income'})}
                      className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", newTx.type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500")}
                    >
                      Pemasukan
                    </button>
                  </div>
                  
                  <Input label="Kategori" placeholder="Contoh: Makan, Gaji, Transport" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} required />
                  <Input label="Nominal" type="number" placeholder="0" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} required />
                  <Input label="Tanggal" type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
                  
                  {newTx.type === 'income' && targets.length > 0 && (
                    <Select 
                      label="Hubungkan ke Target (Opsional)" 
                      options={[{ value: '', label: 'Tidak ada' }, ...targets.map(t => ({ value: String(t.id), label: t.name }))]}
                      value={newTx.targetId}
                      onChange={e => setNewTx({...newTx, targetId: e.target.value})}
                    />
                  )}

                  <Input label="Keterangan" placeholder="Catatan tambahan..." value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
                  
                  <div className="flex gap-3 mt-6">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAdd(false)}>Batal</Button>
                    <Button type="submit" className="flex-1">Simpan</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Reports = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/transactions?userId=${user.id}`).then(res => res.json()).then(setTransactions);
  }, [user]);

  const categories = transactions.reduce((acc: any, tx) => {
    if (tx.type === 'expense') {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    }
    return acc;
  }, {});

  const pieData = Object.entries(categories).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Keuangan</h1>
        <p className="text-slate-500">Analisis pengeluaranmu secara visual.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-slate-900 mb-6">Distribusi Pengeluaran</h3>
          <div className="h-[300px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Belum ada data pengeluaran</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-slate-900 mb-6">Ringkasan Kategori</h3>
          <div className="space-y-4">
            {Object.entries(categories).sort((a: any, b: any) => b[1] - a[1]).map(([name, value]: any, idx) => (
              <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm font-medium text-slate-700">{name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
        <p className="text-slate-500">Kelola informasi akun dan preferensi.</p>
      </header>

      <Card className="flex flex-col items-center text-center p-8">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 border-4 border-white shadow-sm">
          <User size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
        <p className="text-slate-500 mb-6">{user?.email}</p>
        
        <div className="w-full space-y-3">
          <Button variant="secondary" className="w-full">Edit Profil</Button>
          <Button variant="secondary" className="w-full">Ganti Password</Button>
          <Button variant="danger" className="w-full" onClick={logout}>
            <LogOut size={18} />
            Keluar Akun
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-4">Pengaturan</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Notifikasi</p>
                <p className="text-xs text-slate-500">Aktifkan pengingat menabung</p>
              </div>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Layout & Navigation ---

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/targets', icon: Target, label: 'Target' },
    { path: '/transactions', icon: ArrowUpRight, label: 'Transaksi' },
    { path: '/reports', icon: PieChart, label: 'Laporan' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Wallet className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-900">Nabung Pintar</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                  isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">User</p>
              <p className="text-xs text-slate-500 truncate">Premium Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center z-40">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                isActive ? "text-emerald-600" : "text-slate-400"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

// --- App Root ---

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/targets" element={<ProtectedRoute><Targets /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
