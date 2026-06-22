import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import CustomerView from './views/CustomerView';
import BarberView from './views/BarberView';
import AdminView from './views/AdminView';
import LandingView from './views/LandingView';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { Scissors } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        localStorage.setItem('token', token);
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Session expired or invalid token');
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setShowAuthModal(false);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Scissors className="h-10 w-10 text-black animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Hair Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        scrollToSection={scrollToSection}
      />

      <main className="flex-1 flex flex-col">
        {user ? (
          <div className="flex-1 flex flex-col p-6 md:p-10 max-w-7xl w-full mx-auto animate-fade-in">
            {user.role === 'customer' && <CustomerView user={user} />}
            {user.role === 'barber' && <BarberView user={user} />}
            {user.role === 'admin' && <AdminView user={user} />}
          </div>
        ) : (
          <LandingView
            onOpenAuth={() => setShowAuthModal(true)}
            scrollToSection={scrollToSection}
          />
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
