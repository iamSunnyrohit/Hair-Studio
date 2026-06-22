import React, { useState, useEffect } from 'react';
import { api, socket } from '../utils/api';
import { Calendar, Clock, DollarSign, TrendingUp, Users, Trash2, Edit2, ShieldAlert, Award, FileText, CheckCircle, Camera } from 'lucide-react';

function AdminView({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  // Hire Barber Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newImage, setNewImage] = useState('');
  const [registerStream, setRegisterStream] = useState(null);
  const [showRegisterCamera, setShowRegisterCamera] = useState(false);
  const [isHiring, setIsHiring] = useState(false);

  // Edit Barber Profile State
  const [editingBarber, setEditingBarber] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editStream, setEditStream] = useState(null);
  const [showEditCamera, setShowEditCamera] = useState(false);
  const [editServices, setEditServices] = useState('');

  // File upload reader (Base64 conversion)
  const handleFileChange = (e, setImageState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageState(reader.result); // Base64 data URL
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera access handlers
  const startCamera = async (setStreamState, setShowState) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      setStreamState(stream);
      setShowState(true);
    } catch (err) {
      alert('Error accessing camera: ' + err.message);
    }
  };

  const stopCamera = (streamState, setStreamState, setShowState) => {
    if (streamState) {
      streamState.getTracks().forEach(track => track.stop());
      setStreamState(null);
    }
    setShowState(false);
  };

  const capturePhoto = (streamState, videoId, setImageState, setStreamState, setShowState) => {
    const video = document.getElementById(videoId);
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageState(dataUrl);
      stopCamera(streamState, setStreamState, setShowState);
    }
  };

  useEffect(() => {
    fetchMasterCalendar();
    fetchBarbers();
    fetchShopAnalytics();
  }, []);

  // WebSockets for real-time synchronization
  useEffect(() => {
    const handleUpdate = () => {
      fetchMasterCalendar();
      fetchShopAnalytics();
    };

    socket.on('queueUpdated', handleUpdate);
    socket.on('slotBooked', handleUpdate);
    socket.on('slotCancelled', handleUpdate);

    return () => {
      socket.off('queueUpdated', handleUpdate);
      socket.off('slotBooked', handleUpdate);
      socket.off('slotCancelled', handleUpdate);
    };
  }, []);

  const fetchMasterCalendar = async () => {
    setLoadingCalendar(true);
    try {
      const res = await api.get('/appointments/master-calendar');
      setAppointments(res.data);
    } catch (err) {
      console.error('Error loading master calendar:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const fetchBarbers = async () => {
    try {
      const res = await api.get('/barbers');
      setBarbers(res.data);
    } catch (err) {
      console.error('Error fetching barbers list:', err);
    }
  };

  const fetchShopAnalytics = async () => {
    try {
      const res = await api.get('/barbers/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error loading shop analytics:', err);
    }
  };

  // Hire Barber Submit (Admin only)
  const handleHireBarber = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword || !newPhone) {
      alert('All credentials are required to register a barber');
      return;
    }

    try {
      await api.post('/auth/register', {
        name: newName,
        email: newEmail,
        password: newPassword,
        phone: newPhone,
        role: 'barber',
        bio: newBio || 'Professional barber ready to give you a fresh cut.',
        image: newImage || '',
        services: [
          { name: 'Classic Haircut', duration: 30, price: 600 },
          { name: 'Hot Towel Shave', duration: 30, price: 800 },
          { name: 'Beard Trim & Styling', duration: 15, price: 400 }
        ]
      });

      alert(`Barber ${newName} hired successfully!`);
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setNewBio('');
      setNewImage('');
      stopCamera(registerStream, setRegisterStream, setShowRegisterCamera);
      setIsHiring(false);
      
      fetchBarbers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error hiring new barber');
    }
  };

  // Fire Barber (Admin only)
  const handleFireBarber = async (barberId, name) => {
    if (!window.confirm(`Are you absolutely sure you want to remove Barber ${name}? All schedules will be deleted and future appointments cancelled.`)) return;

    try {
      await api.delete(`/barbers/${barberId}`);
      alert(`Barber ${name} profile removed.`);
      fetchBarbers();
      fetchMasterCalendar();
      fetchShopAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting barber');
    }
  };

  // Edit Barber Profile Details
  const handleStartEdit = (barber) => {
    setEditingBarber(barber);
    setEditName(barber.name);
    setEditEmail(barber.email);
    setEditPhone(barber.phone);
    setEditBio(barber.barberProfile?.bio || '');
    setEditImage(barber.barberProfile?.image || '');
    setEditServices(JSON.stringify(barber.barberProfile?.services || [], null, 2));
  };

  const handleSaveBarberProfile = async () => {
    try {
      const parsedServices = JSON.parse(editServices);
      
      await api.put('/barbers/profile', {
        barberId: editingBarber._id,
        name: editName,
        email: editEmail,
        phone: editPhone,
        bio: editBio,
        image: editImage,
        services: parsedServices
      });

      alert('Barber profile saved successfully!');
      stopCamera(editStream, setEditStream, setShowEditCamera);
      setEditingBarber(null);
      fetchBarbers();
      fetchMasterCalendar();
    } catch (err) {
      alert('Error saving. Make sure services syntax is valid JSON. Format:\n[\n  { "name": "Service", "duration": 30, "price": 30 }\n]');
    }
  };

  const handleCancelEdit = () => {
    stopCamera(editStream, setEditStream, setShowEditCamera);
    setEditingBarber(null);
  };

  // Override appointment status
  const handleOverrideStatus = async (appId, status) => {
    try {
      await api.put(`/appointments/${appId}/status`, { status });
      fetchMasterCalendar();
      fetchShopAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Error overrides status');
    }
  };

  // Force cancel reservation
  const handleForceCancel = async (appId) => {
    if (!window.confirm('Forcefully cancel this appointment reservation?')) return;
    try {
      await api.put(`/appointments/${appId}/cancel`);
      fetchMasterCalendar();
      fetchShopAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling appointment');
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in text-black">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-black uppercase font-sans">
          Admin Shop Overview
        </h2>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">Central calendar overrides, financial breakdowns, and barber staff registry</p>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Reservations Logged', val: analytics.summary.totalAppointments, icon: <Calendar className="h-5 w-5 text-black" /> },
            { label: 'Completed Cuts', val: analytics.summary.completedCutsCount, icon: <CheckCircle className="h-5 w-5 text-emerald-600" /> },
            { label: 'Cancellations', val: analytics.summary.cancelledCount, icon: <ShieldAlert className="h-5 w-5 text-red-500" /> },
            { label: 'Gross Sales', val: `₹${analytics.summary.grossServiceRevenue}`, icon: <DollarSign className="h-5 w-5 text-gray-400" /> },
            { label: 'Shop Commission (30%)', val: `₹${analytics.summary.shopCommissionRevenue.toFixed(0)}`, icon: <TrendingUp className="h-5 w-5 text-black" />, highlight: true }
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-4 border shadow-sm flex flex-col justify-between ${
                stat.highlight ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-black'
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {stat.label}
              </span>
              <div className="flex justify-between items-end mt-3">
                <span className="text-xl font-extrabold">{stat.val}</span>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Performance Breakdown */}
      {analytics && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-5 flex items-center gap-2">
            <Users className="h-4.5 w-4.5" /> Staff Sales Breakdown
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <th className="py-2.5 px-3">Stylist</th>
                  <th className="py-2.5 px-3 text-center">Completed Cuts</th>
                  <th className="py-2.5 px-3">Gross Sales</th>
                  <th className="py-2.5 px-3">Commission Paid (70%)</th>
                  <th className="py-2.5 px-3">Tips Distributed</th>
                  <th className="py-2.5 px-3 text-right">Net Shop Revenue (30%)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.barberBreakdowns?.map((b) => (
                  <tr key={b.barberId} className="border-b border-gray-100 font-medium text-gray-600 hover:bg-gray-50/30 transition">
                    <td className="py-3.5 px-3 font-bold text-black">{b.name}</td>
                    <td className="py-3.5 px-3 text-center text-black font-extrabold text-sm">{b.completedCuts}</td>
                    <td className="py-3.5 px-3">₹{b.serviceRevenue}</td>
                    <td className="py-3.5 px-3 text-purple-600 font-semibold">₹{b.commissionPaid.toFixed(0)}</td>
                    <td className="py-3.5 px-3 text-emerald-600 font-semibold">₹{b.tipsCollected}</td>
                    <td className="py-3.5 px-3 text-black font-extrabold text-right">₹{b.netShopRevenue.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Registry Forms split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Barbers list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-black flex items-center gap-2">
                <Award className="h-4.5 w-4.5" /> Stylist Staff Registry
              </h3>
              <button
                onClick={() => setIsHiring(!isHiring)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
              >
                {isHiring ? 'Close Form' : 'Register New Barber'}
              </button>
            </div>

            {/* Hire Form Drawer */}
            {isHiring && (
              <form onSubmit={handleHireBarber} className="bg-gray-50 border border-gray-200 p-5 rounded-xl mb-6 space-y-4 animate-fade-in">
                <h4 className="text-xs font-bold text-black uppercase tracking-widest mb-1.5">New Barber Registration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Email (Login ID)</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@barber.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="555-0700"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Bio Profile Details</label>
                  <textarea
                    placeholder="Short bio detailing styles and specialization..."
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    rows="2"
                    className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-2">Profile Photo</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {newImage ? (
                      <img
                        src={newImage}
                        alt="Preview"
                        className="w-14 h-14 rounded-full object-cover border border-gray-300 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold border border-gray-300">
                        No Photo
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer bg-white hover:bg-gray-50 text-black border border-gray-250 hover:border-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition">
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setNewImage)}
                        />
                      </label>
                      {showRegisterCamera ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => capturePhoto(registerStream, 'register-video', setNewImage, setRegisterStream, setShowRegisterCamera)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                          >
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={() => stopCamera(registerStream, setRegisterStream, setShowRegisterCamera)}
                            className="bg-white hover:bg-gray-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startCamera(setRegisterStream, setShowRegisterCamera)}
                          className="bg-white hover:bg-gray-50 text-black border border-gray-250 hover:border-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Use Camera
                        </button>
                      )}
                      {newImage && (
                        <button
                          type="button"
                          onClick={() => setNewImage('')}
                          className="bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {showRegisterCamera && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-gray-300 bg-black w-[200px] h-[200px] relative">
                      <video
                        id="register-video"
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        ref={(ref) => {
                          if (ref && registerStream && ref.srcObject !== registerStream) {
                            ref.srcObject = registerStream;
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg transition"
                >
                  Hire &amp; Register Barber
                </button>
              </form>
            )}

            {/* Barbers list */}
            <div className="space-y-3">
              {barbers.map((barber) => (
                <div key={barber._id} className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-black transition">
                  <div className="flex items-center gap-4">
                    <img
                      src={barber.barberProfile?.image || 'https://via.placeholder.com/150'}
                      alt={barber.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <h4 className="font-extrabold text-sm text-black">{barber.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">{barber.email} • {barber.phone}</p>
                      <p className="text-xs text-gray-500 italic line-clamp-1 mt-1">{barber.barberProfile?.bio}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(barber)}
                      className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 p-2 rounded-lg transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleFireBarber(barber._id, barber.name)}
                      className="bg-white hover:bg-red-50 text-red-500 border border-gray-200 hover:border-red-200 p-2 rounded-lg transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Barber details panel */}
        <div className="space-y-6">
          {editingBarber ? (
            <div className="bg-white rounded-xl p-6 border border-black shadow-md animate-fade-in">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                <Edit2 className="h-4.5 w-4.5" /> Edit: {editingBarber.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Email (Login ID)</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Barber Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows="3"
                    className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-2 px-3 text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-2">Profile Photo</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
                    {editImage ? (
                      <img
                        src={editImage}
                        alt="Preview"
                        className="w-14 h-14 rounded-full object-cover border border-gray-300 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold border border-gray-300">
                        No Photo
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer bg-white hover:bg-gray-50 text-black border border-gray-250 hover:border-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition">
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setEditImage)}
                        />
                      </label>
                      {showEditCamera ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => capturePhoto(editStream, 'edit-video', setEditImage, setEditStream, setShowEditCamera)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                          >
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={() => stopCamera(editStream, setEditStream, setShowEditCamera)}
                            className="bg-white hover:bg-gray-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startCamera(setEditStream, setShowEditCamera)}
                          className="bg-white hover:bg-gray-50 text-black border border-gray-250 hover:border-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Use Camera
                        </button>
                      )}
                    </div>
                  </div>
                  {showEditCamera && (
                    <div className="rounded-xl overflow-hidden border border-gray-300 bg-black w-[200px] h-[200px] relative mb-3">
                      <video
                        id="edit-video"
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        ref={(ref) => {
                          if (ref && editStream && ref.srcObject !== editStream) {
                            ref.srcObject = editStream;
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Services Offered (JSON Array)</label>
                  <textarea
                    value={editServices}
                    onChange={(e) => setEditServices(e.target.value)}
                    rows="8"
                    className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-2 px-3 text-xs font-mono text-black"
                  />
                  <p className="text-[9px] text-gray-400 mt-1 leading-normal">Configure service names, duration, prices, and optional buffers (in minutes) in standard JSON structure. E.g. [ &#123; "name": "Classic Haircut", "duration": 30, "price": 600, "buffer": 10 &#125; ]</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 bg-white border border-gray-200 text-gray-500 py-2 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBarberProfile}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-xs font-bold transition uppercase tracking-wider"
                  >
                    Save Details
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-dashed border-gray-200 text-center py-12 text-gray-400">
              <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <h4 className="font-bold text-xs text-black">Select Profile Editor</h4>
              <p className="text-[10px] max-w-[160px] mx-auto mt-0.5 leading-relaxed">Click the edit button next to any stylist register to override services catalog.</p>
            </div>
          )}
        </div>
      </div>

      {/* Central Overrides Calendar */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-5 flex items-center gap-2">
          <FileText className="h-4.5 w-4.5" /> Central Calendar Overrides
        </h3>

        {loadingCalendar ? (
          <div className="text-center py-6 text-xs text-gray-400">Loading master calendar...</div>
        ) : appointments.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No bookings exist in system.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Barber</th>
                  <th className="py-2.5 px-3">Service Treatment</th>
                  <th className="py-2.5 px-3">Schedule Date/Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app._id} className="border-b border-gray-100 font-medium text-gray-600 hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-3 font-bold text-black">
                      <div>{app.customerId?.name || 'Unknown Client'}</div>
                      <div className="text-[9px] text-gray-400 font-normal">{app.customerId?.phone}</div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-black">
                      {app.barberId?.name || 'Deleted Barber'}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-black">{app.service.name}</div>
                      <div className="text-[9px] text-gray-400 font-normal">₹{app.service.price} • {app.service.duration} mins</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div>{formatDate(app.startTime)}</div>
                      <div className="text-black font-extrabold">{formatTime(app.startTime)}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                        app.status === 'confirmed' ? 'bg-amber-50 text-amber-600 border border-amber-250' :
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        app.status === 'cancelled' ? 'bg-red-50 text-red-500 border border-red-200' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {app.status === 'confirmed' && (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleOverrideStatus(app._id, 'completed')}
                            className="bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-emerald-600 text-[10px] px-2 py-1 rounded font-bold transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleOverrideStatus(app._id, 'no-show')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-400 text-gray-500 text-[10px] px-2 py-1 rounded transition font-bold"
                          >
                            No-Show
                          </button>
                          <button
                            onClick={() => handleForceCancel(app._id)}
                            className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-red-500 text-[10px] px-2 py-1 rounded transition font-bold"
                          >
                            Force Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminView;
