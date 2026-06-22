import React, { useState, useEffect } from 'react';
import { api, socket } from '../utils/api';
import { Calendar as CalendarIcon, Clock, DollarSign, User as UserIcon, Check, Award, AlertCircle, XCircle, Star as StarIcon } from 'lucide-react';

function CustomerView({ user }) {
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [bookingSlot, setBookingSlot] = useState(null);
  const [tip, setTip] = useState(50);
  const [customTip, setCustomTip] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // New dashboard states
  const [dashboardData, setDashboardData] = useState({ history: [], regularCut: null });
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // New waitlist & feedback states
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistPref, setWaitlistPref] = useState([]);
  const [reviewRatingMap, setReviewRatingMap] = useState({});
  const [reviewTextMap, setReviewTextMap] = useState({});

  // Get current date string in local timezone (YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Initial loads
  useEffect(() => {
    fetchBarbers();
    fetchMyAppointments();
    fetchDashboardData();
    setSelectedDate(getTodayDateString());
  }, []);

  // Fetch customer dashboard data (completed history, styling notes, usual stylist/service)
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const res = await api.get('/appointments/customer-dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Quick book the regular combination
  const handleQuickBook = (regularCut) => {
    const barberObj = barbers.find(b => b._id === regularCut.barberId);
    if (barberObj) {
      setSelectedBarber(barberObj);
      if (barberObj.barberProfile?.services) {
        const serviceObj = barberObj.barberProfile.services.find(s => s.name === regularCut.serviceName);
        if (serviceObj) {
          setSelectedService(serviceObj);
        }
      }
    }
    const element = document.getElementById('slot-selector-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      await api.post('/appointments/waitlist', {
        barberId: selectedBarber._id,
        date: selectedDate,
        preferredTimes: waitlistPref
      });
      alert('Joined waitlist successfully! We will notify you if a slot opens.');
      setShowWaitlistModal(false);
      setWaitlistPref([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error joining waitlist');
    }
  };

  const handleReviewSubmit = async (appointmentId) => {
    const starVal = reviewRatingMap[appointmentId];
    if (!starVal) {
      alert('Please select a star rating first');
      return;
    }
    
    try {
      await api.post(`/appointments/${appointmentId}/review`, {
        rating: starVal,
        review: reviewTextMap[appointmentId] || ''
      });
      alert('Thank you for your review!');
      fetchDashboardData();
      fetchBarbers(); // Refresh average ratings on profiles
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving review');
    }
  };

  // Fetch barbers list
  const fetchBarbers = async () => {
    try {
      const res = await api.get('/barbers');
      setBarbers(res.data);
      if (res.data.length > 0) {
        setSelectedBarber(res.data[0]); // default to first barber
      }
    } catch (err) {
      console.error('Error fetching barbers:', err);
    }
  };

  // Fetch customer appointments
  const fetchMyAppointments = async () => {
    try {
      const res = await api.get('/appointments/my-appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching my appointments:', err);
    }
  };

  // Fetch availability slots when barber, date or service changes
  useEffect(() => {
    if (selectedBarber && selectedDate && selectedService) {
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedBarber, selectedDate, selectedService]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await api.get('/appointments/slots', {
        params: {
          barberId: selectedBarber._id,
          date: selectedDate,
          serviceName: selectedService.name
        }
      });
      setAvailableSlots(res.data);
    } catch (err) {
      console.error('Error fetching available slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // WebSocket Live Real-Time Slot Locking
  useEffect(() => {
    socket.on('slotBooked', (data) => {
      if (
        selectedBarber &&
        data.barberId === selectedBarber._id &&
        data.date === selectedDate
      ) {
        setAvailableSlots((prevSlots) => {
          return prevSlots.filter(s => s.startTime !== data.startTime);
        });
      }
    });

    socket.on('slotCancelled', (data) => {
      if (
        selectedBarber &&
        data.barberId === selectedBarber._id &&
        data.date === selectedDate
      ) {
        fetchSlots();
      }
    });

    return () => {
      socket.off('slotBooked');
      socket.off('slotCancelled');
    };
  }, [selectedBarber, selectedDate, selectedService]);

  // Default to first service when barber changes
  useEffect(() => {
    if (selectedBarber && selectedBarber.barberProfile?.services?.length > 0) {
      setSelectedService(selectedBarber.barberProfile.services[0]);
    }
  }, [selectedBarber]);

  // Book appointment handler
  const handleBookAppointment = async () => {
    setBookingError('');
    setBookingSuccess('');
    const tipValue = customTip !== '' ? Number(customTip) : Number(tip);
    
    try {
      await api.post('/appointments/book', {
        barberId: selectedBarber._id,
        serviceName: selectedService.name,
        startTime: bookingSlot.startTime,
        tip: tipValue
      });
      
      setBookingSuccess('Your booking is secured!');
      setBookingSlot(null);
      setCustomTip('');
      fetchMyAppointments();
      fetchDashboardData();
      fetchSlots(); // refresh remaining slots
      
      setTimeout(() => setBookingSuccess(''), 4000);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Double booking error: This slot was secured by another client.');
    }
  };

  // Cancel booking handler with 2-hour constraint check
  const handleCancelBooking = async (appointmentId, startTime) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    const now = new Date();
    const appTime = new Date(startTime);
    const diffHours = (appTime - now) / (1000 * 60 * 60);

    if (diffHours < 2) {
      alert('Appointments can only be cancelled up to 2 hours before the service schedule.');
      return;
    }

    try {
      await api.put(`/appointments/${appointmentId}/cancel`);
      fetchMyAppointments();
      fetchSlots();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling appointment');
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const isCancellationAllowed = (startTime) => {
    const now = new Date();
    const appTime = new Date(startTime);
    return (appTime - now) / (1000 * 60 * 60) >= 2;
  };

  return (
    <div className="space-y-8 animate-fade-in text-black">

      {/* Section A: The Quick Re-Book Banner ("Your Regular Cut") */}
      {dashboardData.regularCut && (
        <div className="bg-white rounded-xl p-6 border border-[#e5e5e5] shadow-sm animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={dashboardData.regularCut.barberAvatar || 'https://via.placeholder.com/150'}
                alt={dashboardData.regularCut.barberName}
                className="w-16 h-16 rounded-full object-cover border border-[#e5e5e5]"
              />
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block font-sans">Your Regular Cut</span>
                <h3 className="text-lg font-extrabold text-black">Welcome back, {user.name}. Ready for your usual?</h3>
                <p className="text-xs text-gray-500 font-normal">
                  {dashboardData.regularCut.serviceName} with <span className="font-semibold text-black">{dashboardData.regularCut.barberName}</span> for <span className="font-extrabold text-black">₹{dashboardData.regularCut.price}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => handleQuickBook(dashboardData.regularCut)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-5 py-3 rounded-lg transition shrink-0 uppercase tracking-widest shadow-sm"
            >
              Quick Book Regular Cut
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Barber Catalog & Service details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Barber Picker */}
          <div className="bg-white rounded-xl p-6 border border-[#e5e5e5] shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-black" /> 1. Select Master Stylist
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {barbers.map((barber) => (
                <div
                  key={barber._id}
                  onClick={() => setSelectedBarber(barber)}
                  className={`cursor-pointer rounded-xl p-4 border transition flex flex-col items-center text-center ${
                    selectedBarber?._id === barber._id
                      ? 'border-orange-500 bg-gray-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <img
                    src={barber.barberProfile.image || 'https://via.placeholder.com/150'}
                    alt={barber.name}
                    className="w-14 h-14 rounded-full object-cover border border-[#e5e5e5] mb-2.5 shadow-sm"
                  />
                  <h4 className="font-extrabold text-sm text-black flex items-center justify-center gap-1">
                    {barber.name}
                    {barber.ratingAverage > 0 && (
                      <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5">
                        • <StarIcon className="h-3 w-3 fill-orange-500 stroke-orange-500 inline" /> {barber.ratingAverage} ({barber.ratingCount})
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">{barber.barberProfile.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Service Picker */}
          {selectedBarber && (
            <div className="bg-white rounded-xl p-6 border border-[#e5e5e5] shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-black" /> 2. Choose Service Treatment
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedBarber.barberProfile?.services?.map((service, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedService(service)}
                    className={`cursor-pointer rounded-xl p-4 border transition relative ${
                      selectedService?.name === service.name
                        ? 'border-orange-500 bg-gray-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    {selectedService?.name === service.name && (
                      <span className="absolute top-2.5 right-2.5 bg-orange-500 text-white p-0.5 rounded-full">
                        <Check className="h-2.5 w-2.5 stroke-[3px]" />
                      </span>
                    )}
                    <h4 className="font-extrabold text-sm text-black">{service.name}</h4>
                    <div className="flex justify-between items-center mt-4 text-xs font-semibold text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {service.duration}m
                      </span>
                      <span className="text-black font-extrabold text-sm">₹{service.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Slots Calendar picker & Booking action */}
        <div className="space-y-8" id="slot-selector-section">
          <div className="bg-white rounded-xl p-6 border border-[#e5e5e5] shadow-sm flex flex-col h-full">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
              <CalendarIcon className="h-4.5 w-4.5 text-black" /> 3. Select Date &amp; Time
            </h3>

            {/* Date field */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
              <input
                type="date"
                min={getTodayDateString()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#f9f9f9] border border-gray-200 rounded-lg py-2 px-3 text-xs text-black focus:outline-none focus:border-black transition font-semibold"
              />
            </div>

            {/* Slots Matrix */}
            <div className="flex-1 flex flex-col min-h-[200px]">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Slots</span>
              
              {loadingSlots ? (
                <div className="flex-1 flex justify-center items-center py-6">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center py-6 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg gap-2">
                  <AlertCircle className="h-6 w-6 text-gray-300" />
                  <div>
                    <p className="text-xs font-bold">No slots available</p>
                    <p className="text-[10px] max-w-[160px] mt-0.5 leading-relaxed">Check another date or master barber.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWaitlistModal(true)}
                    className="mt-1 bg-orange-500 text-white hover:bg-orange-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider shadow-sm"
                  >
                    Join Waitlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 overflow-y-auto max-h-[200px] pr-1">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBookingSlot(slot)}
                      className="bg-[#f9f9f9] hover:bg-orange-500 hover:text-white border border-gray-200 text-black font-bold py-2 px-1 rounded-lg text-[10px] transition animate-fade-in flex flex-col items-center justify-center gap-0.5 leading-tight"
                    >
                      <span className="font-extrabold text-[11px]">{slot.timeLabel}</span>
                      <span className="text-[9px] font-semibold text-gray-400">₹{slot.price}</span>
                      {slot.priceRule && (
                        <span className={`text-[8px] px-1 rounded uppercase tracking-wider font-extrabold ${
                          slot.priceRule === 'surge' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {slot.priceRule === 'surge' ? 'Surge' : 'Promo'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {bookingSuccess && (
              <div className="mt-4 p-2 bg-emerald-50 border border-emerald-250 rounded-lg text-emerald-600 text-xs font-semibold text-center animate-fade-in">
                {bookingSuccess}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Section: History & Lookbook */}
      {dashboardData.history && dashboardData.history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section B: Haircut History & Stylist Notes */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-[#e5e5e5] shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Clock className="h-4.5 w-4.5 text-black" /> Haircut History &amp; Stylist Notes
            </h3>
            
            <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-8">
              {dashboardData.history.map((item) => (
                <div key={item._id} className="relative">
                  {/* Timeline dot with avatar */}
                  <span className="absolute -left-10 top-0.5 bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center overflow-hidden shadow-sm">
                    <img
                      src={item.barberAvatar || 'https://via.placeholder.com/150'}
                      alt={item.barberName}
                      className="w-full h-full object-cover"
                    />
                  </span>
                  
                  {/* Content card */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-black">{item.serviceName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          by {item.barberName} • {formatDate(item.date)}
                        </p>
                      </div>
                      <span className="text-black font-extrabold text-sm bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                        ₹{item.price}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="bg-gray-50 border-l-2 border-orange-500 p-3.5 rounded-r-lg">
                        <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Stylist Notes</span>
                        <p className="text-xs text-gray-700 italic font-medium leading-relaxed">
                          "{item.notes}"
                        </p>
                      </div>
                    )}

                    {/* Feedback Rating Review Selector */}
                    {!item.rating ? (
                      <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl space-y-3">
                        <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Rate &amp; Review Your Cut</span>
                        
                        <div className="flex gap-1 items-center">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => {
                                setReviewRatingMap(prev => ({ ...prev, [item._id]: starVal }));
                              }}
                              className="hover:scale-110 transition"
                            >
                              <StarIcon
                                className={`h-4.5 w-4.5 ${
                                  (reviewRatingMap[item._id] || 0) >= starVal
                                    ? 'fill-orange-500 stroke-orange-500'
                                    : 'stroke-gray-300 text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Write a review (optional)..."
                            value={reviewTextMap[item._id] || ''}
                            onChange={(e) => {
                              setReviewTextMap(prev => ({ ...prev, [item._id]: e.target.value }));
                            }}
                            className="flex-1 bg-white border border-gray-200 rounded-lg py-1 px-3 text-xs text-black focus:outline-none focus:border-black transition"
                          />
                          <button
                            onClick={() => handleReviewSubmit(item._id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider shadow-sm font-sans"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-start bg-gray-50 border border-gray-150 p-3.5 rounded-xl text-xs">
                        <div className="flex gap-0.5 text-black mt-0.5">
                          {[...Array(item.rating)].map((_, i) => (
                            <StarIcon key={i} className="h-3 w-3 fill-orange-500 stroke-orange-500" />
                          ))}
                        </div>
                        <div className="text-gray-600 font-medium italic">
                          "{item.review || 'No written feedback'}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Visual Lookbook (Recent Cuts) */}
          <div className="bg-white rounded-xl p-6 border border-[#e5e5e5] shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Award className="h-4.5 w-4.5 text-black" /> Visual Lookbook
            </h3>

            {dashboardData.history.some(item => item.images && item.images.length > 0) ? (
              <div className="grid grid-cols-2 gap-3">
                {dashboardData.history.flatMap(item => item.images || []).map((imgUrl, imgIdx) => (
                  <div key={imgIdx} className="rounded-xl overflow-hidden aspect-square border border-gray-200 hover:opacity-95 transition shadow-sm relative group">
                    <img
                      src={imgUrl}
                      alt={`Haircut history ${imgIdx + 1}`}
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition duration-500"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                <p className="font-bold text-xs">No photos taken yet.</p>
                <p className="text-[10px] mt-0.5 max-w-[160px] mx-auto leading-relaxed">Your post-cut styles will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Dialog Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-white border border-gray-200 max-w-sm w-full rounded-xl p-6 shadow-2xl relative">
            <h3 className="text-base font-extrabold text-black border-b border-gray-100 pb-2.5 mb-4">
              Confirm Reservation
            </h3>

            {bookingError && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-500 text-xs text-center font-medium">
                {bookingError}
              </div>
            )}

            <div className="space-y-2.5 mb-5 text-xs text-gray-600">
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Barber:</span>
                <span className="font-bold text-black">{selectedBarber.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Treatment:</span>
                <span className="font-bold text-black">{selectedService.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Duration:</span>
                <span className="font-bold text-black">{selectedService.duration} mins</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Rate:</span>
                <span className="font-bold text-black">
                  ₹{bookingSlot.price}
                  {bookingSlot.priceRule && (
                    <span className={`text-[9px] font-bold ml-1.5 px-1.5 py-0.5 rounded uppercase ${
                      bookingSlot.priceRule === 'surge' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {bookingSlot.priceRule}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Date:</span>
                <span className="font-bold text-black">{formatDate(bookingSlot.startTime)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400 font-medium">Time:</span>
                <span className="font-bold text-black">{formatTime(bookingSlot.startTime)}</span>
              </div>
            </div>

            {/* Tip Option */}
            <div className="mb-5 bg-[#f9f9f9] p-3.5 rounded-lg border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Add Barber Tip</label>
              
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[50, 100, 150, 200].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTip(t);
                      setCustomTip('');
                    }}
                    className={`py-1 rounded text-xs font-bold transition border ${
                      tip === t && customTip === ''
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white hover:bg-gray-50 text-gray-650 border-gray-200'
                    }`}
                  >
                    ₹{t}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Custom Tip Amount"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                    setTip(0);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-7 pr-3 text-xs text-black focus:outline-none focus:border-black transition font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBookingSlot(null)}
                className="flex-1 bg-white border border-gray-255 hover:bg-gray-50 text-black font-bold py-2 rounded-lg text-xs transition"
              >
                Go Back
              </button>
              <button
                onClick={handleBookAppointment}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs transition uppercase tracking-wider"
              >
                Confirm Cut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Drawer Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-white border border-gray-200 max-w-sm w-full rounded-xl p-6 shadow-2xl relative">
            <h3 className="text-base font-extrabold text-black border-b border-gray-100 pb-2.5 mb-4 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-black" /> Join Waitlist
            </h3>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed font-normal">
              {selectedBarber?.name} is fully booked on <span className="font-semibold text-black">{selectedDate}</span>. We will automatically alert you via email/system log if a slot opens up!
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Preferred Timeframe</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Morning (9AM-12PM)', times: ['09:00', '10:00', '11:00'] },
                    { label: 'Afternoon (12PM-3PM)', times: ['12:00', '13:00', '14:00'] },
                    { label: 'Late (3PM-6PM)', times: ['15:00', '16:00', '17:00'] }
                  ].map((tf, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (waitlistPref.includes(tf.label)) {
                          setWaitlistPref(waitlistPref.filter(p => p !== tf.label));
                        } else {
                          setWaitlistPref([...waitlistPref, tf.label]);
                        }
                      }}
                      className={`py-2 px-2.5 rounded-lg text-[10px] font-bold transition border uppercase tracking-wider ${
                        waitlistPref.includes(tf.label)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowWaitlistModal(false);
                  setWaitlistPref([]);
                }}
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-black font-bold py-2 rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinWaitlist}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs transition uppercase tracking-wider"
              >
                Join List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking History Table / Dashboard */}
      <div className="bg-white rounded-xl p-6 border border-[#e5e5e5] shadow-sm">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-black mb-5 flex items-center gap-2">
          <CalendarIcon className="h-4.5 w-4.5 text-black" /> Personal Booking Log
        </h3>

        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="font-bold text-xs">No appointments scheduled.</p>
            <p className="text-[10px] mt-0.5">Your reservation log will display here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="py-2.5 px-3">Stylist</th>
                  <th className="py-2.5 px-3">Treatment</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Price + Tip</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                    <td className="py-3 px-3 font-bold text-black">
                      {app.barberId ? app.barberId.name : 'Unknown Barber'}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      <div className="font-bold">{app.service.name}</div>
                      <div className="text-[9px] text-gray-400">{app.service.duration} mins</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-600">{formatDate(app.startTime)}</td>
                    <td className="py-3 px-3 font-bold text-black">{formatTime(app.startTime)}</td>
                    <td className="py-3 px-3 text-gray-600">
                      <span className="font-bold">₹{app.service.price}</span>
                      {app.tip > 0 && <span className="text-[10px] text-emerald-600 font-bold ml-1">+₹{app.tip} tip</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                        app.status === 'confirmed' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-205' :
                        app.status === 'cancelled' ? 'bg-red-50 text-red-500 border border-red-200' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {app.status === 'confirmed' && (
                        <div>
                          {isCancellationAllowed(app.startTime) ? (
                            <button
                              onClick={() => handleCancelBooking(app._id, app.startTime)}
                              className="text-[10px] bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 px-2 py-1 rounded font-bold transition"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span
                              title="cancellation window has closed (2h buffer)"
                              className="text-[9px] text-gray-400 font-bold cursor-not-allowed select-none bg-gray-50 border border-gray-150 px-2 py-1 rounded inline-block"
                            >
                              Locked-in
                            </span>
                          )}
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

export default CustomerView;
