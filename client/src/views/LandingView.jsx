import React from 'react';
import { Check, Star } from 'lucide-react';

function LandingView({ onOpenAuth, scrollToSection }) {
  return (
    <div className="flex-1 flex flex-col animate-fade-in">

      {/* HERO SECTION */}
      <div className="bg-white border-b border-gray-200 w-full">
        <section className="px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:pr-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black leading-tight uppercase font-sans">
              Expert <span className="text-orange-500">Hair</span> Treatments & styling
            </h1>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed font-normal italic">
              "Crafting <span className="text-orange-500 font-bold">confidence</span>, one strand at a time."
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onOpenAuth}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 py-3 rounded transition uppercase tracking-wider"
              >
                Book Now
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="border border-gray-200 hover:bg-gray-50 text-black text-sm font-bold px-6 py-3 rounded transition"
              >
                View Services
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-gray-200">
              <div>
                <div className="text-2xl font-extrabold text-black">15+</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Years Experience</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-black">8K+</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Happy Clients</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-black">4.9</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating</div>
              </div>
            </div>
          </div>

          {/* Right Hero Image Column */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden aspect-[4/3] md:aspect-[1.3] shadow-lg border border-gray-200">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80"
                alt="Premium Hair Studio Interior"
                className="w-full h-full object-cover grayscale-[20%]"
              />
            </div>

            {/* Floating available tag */}
            <div className="absolute -bottom-4 left-6 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <div className="text-[10px] text-left">
                <div className="font-bold text-black leading-tight">Next Available</div>
                <div className="text-orange-500 font-bold leading-tight">Today, 2:00 PM</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SERVICES SECTION */}
      <div className="bg-gray-50 border-b border-gray-200 w-full">
        <section id="services" className="px-6 md:px-12 py-20 max-w-7xl mx-auto w-full">
          <div className="mb-12">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Our expertise</span>
            <h2 className="text-2xl font-extrabold text-black tracking-tight">Professional Services</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Haircut', desc: 'Precision cutting tailored to your face shape and hair texture.', price: '800' },
              { num: '02', title: 'Color', desc: 'Custom blending and highlighting for dimensional, healthy color.', price: '2,500' },
              { num: '03', title: 'Styling', desc: 'Event styling, blowouts, and artistic hair arrangements.', price: '500' },
              { num: '04', title: 'Treatment', desc: 'Deep conditioning and keratin repairs for damaged strands.', price: '1,200' }
            ].map((s, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-black transition-all">
                <div>
                  <div className="text-2xl font-extrabold text-gray-250 mb-4">{s.num}</div>
                  <h3 className="font-bold text-black text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-6">{s.desc}</p>
                </div>
                <div className="text-sm font-semibold text-gray-400">
                  From <span className="text-black font-extrabold text-base ml-1">₹{s.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* STYLISTS SECTION */}
      <div className="bg-white border-b border-gray-200 w-full">
        <section id="team" className="px-6 md:px-12 py-20 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">The artisans</span>
              <h2 className="text-2xl font-extrabold text-black tracking-tight">Our Stylists</h2>
            </div>
            <button onClick={onOpenAuth} className="text-xs font-bold text-black underline hover:no-underline">View All Team</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Marcus Chen', role: 'Creative Director', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80' },
              { name: 'Elena Rodriguez', role: 'Master Colorist', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80' },
              { name: 'James Wilson', role: 'Senior Stylist', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80' }
            ].map((st, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="rounded-xl overflow-hidden aspect-[4/5] border border-gray-200 mb-4">
                  <img
                    src={st.img}
                    alt={st.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <h4 className="font-extrabold text-black text-base leading-tight">{st.name}</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">{st.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* PACKAGES SECTION */}
      <div className="bg-gray-50 border-b border-gray-200 w-full">
        <section id="packages" className="px-6 md:px-12 py-20 max-w-7xl mx-auto w-full text-center">
          <div className="max-w-xl mx-auto mb-16">
            <h2 className="text-2xl font-extrabold text-black tracking-tight mb-3">Service Packages</h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Selected combinations of our most requested treatments for a comprehensive studio experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto text-left">
            {/* Essential Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-black text-lg">Essential</h3>
                <div className="text-3xl font-extrabold text-black mt-2 mb-6">₹1,200</div>
                <ul className="space-y-3 text-xs text-gray-500 font-medium mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-black" /> Signature Haircut</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-black" /> Luxury Scalp Massage</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-black" /> Professional Blowout</li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full border border-black hover:bg-gray-50 text-black text-xs font-bold py-2.5 rounded-lg transition text-center"
              >
                Select Package
              </button>
            </div>

            {/* Signature Highlight Card */}
            <div className="bg-black border border-black rounded-xl p-8 flex flex-col justify-between text-white relative transform md:scale-105 shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-orange-600 shadow-sm">
                POPULAR
              </span>
              <div>
                <h3 className="font-extrabold text-white text-lg">Signature</h3>
                <div className="text-3xl font-extrabold text-white mt-2 mb-6">₹2,100</div>
                <ul className="space-y-3 text-xs text-gray-300 font-medium mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-white" /> Signature Haircut</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-white" /> Full Dimensional Color</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-white" /> Custom Gloss Treatment</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-white" /> Styling Consultation</li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full bg-white hover:bg-gray-100 text-black text-xs font-bold py-2.5 rounded-lg transition text-center"
              >
                Book Signature
              </button>
            </div>

            {/* Ultimate Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-black text-lg">Ultimate</h3>
                <div className="text-3xl font-extrabold text-black mt-2 mb-6">₹3,400</div>
                <ul className="space-y-3 text-xs text-gray-500 font-medium mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-black" /> Creative Design Cut</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-black" /> Full Balayage &amp; Toning</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-black" /> Olaplex Bond Treatment</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-black" /> Home Care Product Kit</li>
                </ul>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full border border-black hover:bg-gray-50 text-black text-xs font-bold py-2.5 rounded-lg transition text-center"
              >
                Select Package
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* TESTIMONIALS SECTION */}
      <div className="bg-white border-b border-gray-200 w-full">
        <section className="px-6 md:px-12 py-20 max-w-7xl mx-auto w-full text-center">
          <h2 className="text-2xl font-extrabold text-black tracking-tight mb-12">Client Stories</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            {[
              { name: 'Sarah Jenkins', role: 'Weekly Client', text: 'The attention to detail at Hair Studio is unmatched. I have never felt more comfortable and understood by a stylist.', rating: 5, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
              { name: 'David Miller', role: 'New Client', text: 'Marcus is a true artist. My hair has never looked this healthy while keeping such a clean, sharp, classic shape.', rating: 5, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80' },
              { name: 'Sophie L.', role: 'VIP Client', text: 'A serene oasis in the middle of the city. The head massage during the treatment is worth the visit alone.', rating: 5, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }
            ].map((t, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5 text-black mb-4">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-black stroke-black" />)}
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed italic mb-6">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                  <div>
                    <div className="text-xs font-bold text-black leading-tight">{t.name}</div>
                    <div className="text-[10px] text-gray-400 font-semibold leading-tight">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RECENT WORK SECTION */}
      <div className="bg-[#efefef] border-b border-gray-200 w-full">
        <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto w-full">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-lg font-bold text-black tracking-tight">Recent Work</h2>
            <p className="text-xs text-gray-500">Daily transformations from our studio.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1605497746444-ac9da5848ba7?w=500&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1595959183075-c1d0a1653dd6?w=500&auto=format&fit=crop&q=80'
            ].map((w, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden aspect-square border border-gray-200 hover:opacity-95 transition">
                <img src={w} alt="Haircut portfolio" className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition duration-500" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default LandingView;
