import React from 'react';
import { LogOut } from 'lucide-react';

function Navbar({ user, onLogout, onOpenAuth, scrollToSection }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => user ? null : window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="flex flex-col items-start leading-none py-1">
            <span className="text-2xl font-black tracking-tighter text-black uppercase select-none font-sans">HAIR</span>
            <span className="text-[9px] font-medium tracking-[0.3em] text-orange-500 uppercase select-none -mt-0.5">STUDIO</span>
          </div>
        </div>

        {/* Center menu (only public view) */}
        {!user && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-orange-500">
            <button onClick={() => scrollToSection('services')} className="hover:text-orange-600 transition uppercase tracking-wider">Services</button>
            <button onClick={() => scrollToSection('team')} className="hover:text-orange-600 transition uppercase tracking-wider">Work</button>
            <button onClick={() => scrollToSection('packages')} className="hover:text-orange-600 transition uppercase tracking-wider">Team</button>
            <button onClick={() => scrollToSection('footer')} className="hover:text-orange-600 transition uppercase tracking-wider">Contact</button>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex flex-col text-right justify-center">
                <span className="text-xs font-semibold text-gray-800">
                  {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded transition uppercase tracking-wider"
            >
              Book Appointment
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
