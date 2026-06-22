const express = require('express');
const router = express.Router();

const { auth, requireRole } = require('../middleware/auth');
const authController = require('../controllers/authController');
const barberController = require('../controllers/barberController');
const appointmentController = require('../controllers/appointmentController');

// ==========================================
// AUTH ROUTES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.getMe);

// ==========================================
// BARBER ROUTES
// ==========================================
router.get('/barbers', barberController.getAllBarbers);
router.put('/barbers/profile', auth, requireRole(['barber', 'admin']), barberController.updateProfile);
router.delete('/barbers/:id', auth, requireRole('admin'), barberController.deleteBarber);
router.get('/barbers/analytics', auth, requireRole(['barber', 'admin']), barberController.getAnalytics);

// ==========================================
// APPOINTMENT & SLOT ROUTES
// ==========================================
router.get('/appointments/slots', appointmentController.getAvailableSlots);
router.post('/appointments/book', auth, requireRole(['customer', 'admin']), appointmentController.createAppointment);
router.get('/appointments/my-appointments', auth, requireRole('customer'), appointmentController.getMyAppointments);
router.get('/appointments/customer-dashboard', auth, requireRole('customer'), appointmentController.getCustomerDashboardData);
router.post('/appointments/waitlist', auth, requireRole('customer'), appointmentController.joinWaitlist);
router.post('/appointments/:id/review', auth, requireRole('customer'), appointmentController.submitReview);
router.get('/appointments/queue', auth, requireRole(['barber', 'admin']), appointmentController.getBarberQueue);
router.get('/appointments/master-calendar', auth, requireRole('admin'), appointmentController.getShopAppointments);
router.put('/appointments/:id/cancel', auth, appointmentController.cancelAppointment);
router.put('/appointments/:id/status', auth, requireRole(['barber', 'admin']), appointmentController.updateAppointmentStatus);

// ==========================================
// BARBER SCHEDULE CONFIGURATION ROUTES
// ==========================================
router.get('/appointments/schedule', auth, requireRole(['barber', 'admin']), appointmentController.getBarberSchedule);
router.put('/appointments/schedule', auth, requireRole(['barber', 'admin']), appointmentController.updateBarberSchedule);

module.exports = router;
