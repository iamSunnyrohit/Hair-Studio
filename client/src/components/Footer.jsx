import React from 'react';
import { ArrowRight } from 'lucide-react';

function Footer() {
  return (
    <div className="bg-white border-t border-gray-200 w-full text-xs text-gray-500">
      <footer id="footer" className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-left">
          <div className="space-y-3">
            <div className="flex flex-col items-start leading-none py-1 mb-2">
              <span className="text-2xl font-black tracking-tighter text-black uppercase select-none font-sans">HAIR</span>
              <span className="text-[9px] font-medium tracking-[0.3em] text-orange-500 uppercase select-none -mt-0.5">STUDIO</span>
            </div>
            <p className="text-gray-400 leading-relaxed font-normal">
              Crafting confidence through tailored hair artistry. Located in the heart of the city, open Tuesday to Saturday.
            </p>
          </div>
          <div className="space-y-2 flex flex-col md:pl-10">
            <h4 className="font-extrabold text-black text-sm mb-1">Quick Links</h4>
            <a href="#" className="hover:text-black transition">Privacy Policy</a>
            <a href="#" className="hover:text-black transition">Terms of Service</a>
            <a href="#" className="hover:text-black transition">FAQ</a>
            <a href="#" className="hover:text-black transition">Careers</a>
          </div>
          <div className="space-y-3">
            <h4 className="font-extrabold text-black text-sm">Newsletter</h4>
            <p className="text-gray-400 mb-2 font-normal">Join our list for style tips and exclusive offers.</p>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden max-w-xs focus-within:border-black transition">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-transparent py-2 px-3 focus:outline-none text-black font-medium"
              />
              <button className="bg-orange-500 text-white px-3 flex items-center justify-center hover:bg-orange-600 transition">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-400">
          <span>© 2026 Hair Studio. All rights reserved.</span>
          <span className="mt-2 md:mt-0 font-medium">Developed with MERN &amp; WebSockets</span>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
