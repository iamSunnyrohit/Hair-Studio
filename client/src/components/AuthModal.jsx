import React, { useState } from 'react';
import { api } from '../utils/api';
import { Scissors, Mail, Lock, Phone, User as UserIcon } from 'lucide-react';

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setSuccess('Successfully logged in!');
      setTimeout(() => {
        onAuthSuccess(res.data.token, res.data.user);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, phone, role: 'customer' });
      setSuccess('Successfully registered!');
      setTimeout(() => {
        onAuthSuccess(res.data.token, res.data.user);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickSwitch = async (roleEmail) => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', {
        email: roleEmail,
        password: 'password123'
      });
      setSuccess(`Switched to ${roleEmail}!`);
      setTimeout(() => {
        onAuthSuccess(res.data.token, res.data.user);
      }, 500);
    } catch (err) {
      setError(`Quick login failed for ${roleEmail}. Seed data missing?`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-xl p-8 border border-gray-200 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-lg"
          disabled={submitting}
        >
          ✕
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-black/5 text-black p-3 rounded-full mb-3">
            <Scissors className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-black">
            {isLogin ? 'Sign In to Reserve' : 'Create Account'}
          </h2>
          <p className="text-gray-400 text-xs mt-1 text-center">
            {isLogin ? 'Access schedule grids and book appointments instantly' : 'Sign up to secure custom treatments'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-250 rounded-lg text-emerald-600 text-xs text-center font-medium animate-pulse">
            {success}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full bg-[#fcfbfa] border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-xs text-black focus:outline-none focus:border-black transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555-0100"
                    className="w-full bg-[#fcfbfa] border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-xs text-black focus:outline-none focus:border-black transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#fcfbfa] border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-xs text-black focus:outline-none focus:border-black transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#fcfbfa] border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-xs text-black focus:outline-none focus:border-black transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {submitting ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          <span className="text-gray-400">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-black font-bold hover:underline"
            disabled={submitting}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        {/* Quick Impersonators */}
        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2.5">IMPERSONATE DEMO STATUS</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickSwitch('sarah@customer.com')}
              disabled={submitting}
              className="text-[9px] bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 py-2 px-1 rounded border border-gray-200 transition font-bold"
            >
              Sarah (Customer)
            </button>
            <button
              onClick={() => quickSwitch('alex@barber.com')}
              disabled={submitting}
              className="text-[9px] bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 py-2 px-1 rounded border border-gray-200 transition font-bold"
            >
              Alex (Barber)
            </button>
            <button
              onClick={() => quickSwitch('marcus@barber.com')}
              disabled={submitting}
              className="text-[9px] bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 py-2 px-1 rounded border border-gray-200 transition font-bold"
            >
              Marcus (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
