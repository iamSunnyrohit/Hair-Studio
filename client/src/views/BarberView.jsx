import React, { useState, useEffect } from 'react';
import { api, socket } from '../utils/api';
import { Calendar, Clock, DollarSign, BarChart3, ShieldCheck, XCircle, CheckCircle, UserCheck, AlertOctagon, Award } from 'lucide-react';

function BarberView({ user }) {
  const [queue, setQueue] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(true);

  // New Blockout form state
  const [blockReason, setBlockReason] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');

  // Weekly hours edit states
  const [weeklyHours, setWeeklyHours] = useState([]);

  useEffect(() => {
    fetchQueue();
    fetchSchedule();
    fetchAnalytics();
  }, []);

  // WebSocket event listeners for real-time queue synchronization
  useEffect(() => {
    socket.on('queueUpdated', (data) => {
      if (data.barberId === user._id || data.barberId === user.id) {
        fetchQueue();
        fetchAnalytics();
      }
    });

    return () => {
      socket.off('queueUpdated');
    };
  }, [user]);

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await api.get('/appointments/queue');
      setQueue(res.data);
    } catch (err) {
      console.error('Error fetching barber queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/appointments/schedule');
      setSchedule(res.data);
      setWeeklyHours(res.data.weeklyHours || []);
    } catch (err) {
      console.error('Error fetching barber schedule:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/barbers/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Status handler (complete, no-show)
  const handleUpdateStatus = async (appId, status) => {
    try {
      await api.put(`/appointments/${appId}/status`, { status });
      fetchQueue();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating appointment');
    }
  };

  // Cancel handler (barber can cancel anytime)
  const handleCancelAppointment = async (appId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/appointments/${appId}/cancel`);
      fetchQueue();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling appointment');
    }
  };

  // Toggle open status for a weekday
  const handleToggleDay = (dayIndex) => {
    setWeeklyHours(prevHours =>
      prevHours.map(h => (h.dayOfWeek === dayIndex ? { ...h, isOpen: !h.isOpen } : h))
    );
  };

  // Edit hours ranges
  const handleHoursChange = (dayIndex, startOrEnd, value) => {
    setWeeklyHours(prevHours =>
      prevHours.map(h => {
        if (h.dayOfWeek === dayIndex) {
          const hours = [...h.workingHours];
          if (hours.length === 0) {
            hours.push({ start: '09:00', end: '17:00' });
          }
          hours[0] = { ...hours[0], [startOrEnd]: value };
          return { ...h, workingHours: hours };
        }
        return h;
      })
    );
  };

  // Submit weekly schedule edits
  const handleSaveWeeklySchedule = async () => {
    try {
      await api.put('/appointments/schedule', { weeklyHours });
      alert('Weekly schedule saved successfully.');
      fetchSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating schedule');
    }
  };

  // Submit blocked time
  const handleAddBlockout = async (e) => {
    e.preventDefault();
    if (!blockReason || !blockStart || !blockEnd) {
      alert('All blockout parameters are required');
      return;
    }

    try {
      const updatedBlockedTime = [...(schedule.blockedTime || [])];
      updatedBlockedTime.push({
        reason: blockReason,
        start: new Date(blockStart),
        end: new Date(blockEnd),
        isWholeDay: false
      });

      await api.put('/appointments/schedule', {
        blockedTime: updatedBlockedTime
      });

      setBlockReason('');
      setBlockStart('');
      setBlockEnd('');
      alert('Break time logged successfully.');
      fetchSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating schedule blockout');
    }
  };

  // Remove blocked time
  const handleRemoveBlockout = async (blockId) => {
    try {
      const updatedBlockedTime = schedule.blockedTime.filter(b => b._id !== blockId);
      await api.put('/appointments/schedule', {
        blockedTime: updatedBlockedTime
      });
      fetchSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing blockout');
    }
  };

  // Formatter helpers
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDayLabel = (dayIndex) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
  };

  return (
    <div className="space-y-8 animate-fade-in text-black">
      {/* Header Banner */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-black uppercase font-sans">
          Barber Schedule Portal
        </h2>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">Manage daily queue details, scheduling blocks, and track individual earnings</p>
      </div>

      {/* Analytics Widgets */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {[
            { label: 'Completed Cuts', val: analytics.summary.completedCuts, icon: <BarChart3 className="h-5 w-5 text-black" /> },
            { label: 'Client Retention', val: analytics.summary.retentionRate || '0%', icon: <UserCheck className="h-5 w-5 text-purple-600" /> },
            { label: 'Top Service', val: analytics.summary.topService || 'None', icon: <Award className="h-5 w-5 text-black" />, textSm: true },
            { label: 'Gross Cut Revenue', val: `₹${analytics.summary.totalRevenue}`, icon: <DollarSign className="h-5 w-5 text-black" /> },
            { label: 'Commission (70%)', val: `₹${analytics.summary.commissionEarnings.toFixed(0)}`, icon: <ShieldCheck className="h-5 w-5 text-amber-600" /> },
            { label: 'Tips Earned', val: `₹${analytics.summary.totalTips}`, icon: <DollarSign className="h-5 w-5 text-emerald-600" /> },
            { label: 'Total Take-Home', val: `₹${analytics.summary.totalTakeHome.toFixed(0)}`, icon: <DollarSign className="h-5 w-5 text-black" />, highlight: true }
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
              <div className="flex justify-between items-end mt-3 gap-1.5">
                <span className={`font-extrabold ${stat.textSm ? 'text-[11px] leading-tight break-all' : 'text-xl'}`}>{stat.val}</span>
                <span className="shrink-0">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Queue Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-5 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5" /> Client Queue Agenda
            </h3>

            {loadingQueue ? (
              <div className="py-6 text-center text-xs text-gray-400">Loading queue...</div>
            ) : queue.length === 0 ? (
              <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <p className="font-bold text-xs">No active bookings today</p>
                <p className="text-[10px] mt-0.5">Your schedule queue is empty.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((app) => (
                  <div
                    key={app._id}
                    className={`rounded-xl p-4 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                      app.status === 'completed' ? 'border-gray-200 bg-gray-50 opacity-60' :
                      app.status === 'cancelled' ? 'border-gray-150 bg-gray-50 opacity-40' :
                      app.status === 'no-show' ? 'border-gray-200 bg-gray-50 opacity-50' :
                      'border-gray-200 bg-white hover:border-black'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-black">{formatTime(app.startTime)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{formatDate(app.startTime)}</span>
                      </div>
                      
                      <div className="text-xs font-bold text-gray-800">
                        {app.customerId ? app.customerId.name : 'Walk-in Client'}
                        {app.customerId?.phone && (
                          <span className="text-[10px] text-gray-400 font-medium ml-1">({app.customerId.phone})</span>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 font-medium">
                        Service: <span className="text-black font-semibold">{app.service.name}</span> • 
                        Price: <span className="text-black font-bold">₹{app.service.price}</span>
                        {app.tip > 0 && <span className="text-emerald-600 font-bold ml-1.5">+₹{app.tip} tip</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest self-start ${
                        app.status === 'confirmed' ? 'bg-amber-50 text-amber-600 border border-amber-250' :
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        app.status === 'cancelled' ? 'bg-red-50 text-red-500 border border-red-200' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {app.status}
                      </span>
                      
                      {app.status === 'confirmed' && (
                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'completed')}
                            className="bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-emerald-600 text-[10px] px-2.5 py-1.5 rounded font-bold flex items-center gap-1 transition"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Done
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'no-show')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-400 text-gray-500 text-[10px] px-2.5 py-1.5 rounded font-bold flex items-center gap-1 transition"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> No-Show
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(app._id)}
                            className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-red-500 text-[10px] px-2.5 py-1.5 rounded font-bold flex items-center gap-1 transition"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly customizer and breakouts form */}
        <div className="space-y-8">
          
          {/* Weekly Hours Adjuster */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5" /> Weekly Work Hours
            </h3>
            
            <div className="space-y-3.5">
              {weeklyHours.map((wh) => (
                <div key={wh.dayOfWeek} className="flex items-center justify-between border-b border-gray-50 pb-2.5 gap-2">
                  <div className="w-16">
                    <span className="text-[11px] font-bold text-gray-700">{getDayLabel(wh.dayOfWeek)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={wh.isOpen}
                      onChange={() => handleToggleDay(wh.dayOfWeek)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{wh.isOpen ? 'Open' : 'Closed'}</span>
                  </div>

                  {wh.isOpen && wh.workingHours?.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <input
                        type="text"
                        value={wh.workingHours[0].start}
                        onChange={(e) => handleHoursChange(wh.dayOfWeek, 'start', e.target.value)}
                        className="w-11 bg-gray-50 border border-gray-200 rounded py-0.5 text-center text-black font-semibold"
                        placeholder="09:00"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="text"
                        value={wh.workingHours[0].end}
                        onChange={(e) => handleHoursChange(wh.dayOfWeek, 'end', e.target.value)}
                        className="w-11 bg-gray-50 border border-gray-200 rounded py-0.5 text-center text-black font-semibold"
                        placeholder="17:00"
                      />
                    </div>
                  )}
                </div>
              ))}
              
              <button
                onClick={handleSaveWeeklySchedule}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs transition uppercase tracking-wider"
              >
                Save Schedule Hours
              </button>
            </div>
          </div>

          {/* Blockout hours exceptions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
              <AlertOctagon className="h-4.5 w-4.5" /> Log Schedule Break
            </h3>

            <form onSubmit={handleAddBlockout} className="space-y-3 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reason / Label</label>
                <input
                  type="text"
                  required
                  placeholder="Lunch Break, Doctor Appointment"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">End Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-black"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-black font-bold py-2 rounded-lg text-xs transition"
              >
                Log Exception
              </button>
            </form>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Existing Exceptions</span>
              
              {schedule?.blockedTime?.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-2">No break periods registered.</p>
              ) : (
                schedule?.blockedTime?.map((b) => (
                  <div key={b._id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex justify-between items-center text-[10px] text-gray-650">
                    <div>
                      <div className="font-extrabold text-black">{b.reason}</div>
                      <div className="text-gray-400 font-semibold mt-0.5">
                        {formatDate(b.start)} • {new Date(b.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBlockout(b._id)}
                      className="text-red-600 hover:underline font-bold text-[9px] uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default BarberView;
