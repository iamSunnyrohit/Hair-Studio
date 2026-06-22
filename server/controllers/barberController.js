const User = require('../models/User');
const BarberSchedule = require('../models/BarberSchedule');
const Appointment = require('../models/Appointment');

// Get all barbers and their profiles, including ratings analytics
exports.getAllBarbers = async (req, res) => {
  try {
    const barbers = await User.find({ role: 'barber' }).select('-passwordHash').lean();
    
    // Fetch all completed appointments with reviews
    const appointments = await Appointment.find({ status: 'completed', rating: { $exists: true } });
    
    const barbersWithRatings = barbers.map(barber => {
      const barberReviews = appointments.filter(app => app.barberId.toString() === barber._id.toString());
      const totalReviews = barberReviews.length;
      const avgRating = totalReviews > 0 
        ? Number((barberReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;
        
      return {
        ...barber,
        ratingAverage: avgRating,
        ratingCount: totalReviews
      };
    });
    
    res.json(barbersWithRatings);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving barbers list', error: err.message });
  }
};

// Update barber profile (bio, image, services)
exports.updateProfile = async (req, res) => {
  try {
    const barberId = req.user.role === 'admin' && req.body.barberId ? req.body.barberId : req.user.id;
    
    const { bio, image, services, name, email, phone } = req.body;

    const user = await User.findById(barberId);
    if (!user) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (user.role !== 'barber') {
      return res.status(400).json({ message: 'Target user is not a barber' });
    }

    // Update root user fields if provided (mostly for admin updates or profile settings)
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    // Update barber profile nested fields
    if (bio !== undefined) user.barberProfile.bio = bio;
    if (image !== undefined) user.barberProfile.image = image;
    if (services !== undefined) user.barberProfile.services = services;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        barberProfile: user.barberProfile
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating barber profile', error: err.message });
  }
};

// Delete a barber profile (Admin only)
exports.deleteBarber = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (user.role !== 'barber') {
      return res.status(400).json({ message: 'User is not a barber' });
    }

    // Delete user schedule
    await BarberSchedule.findOneAndDelete({ barberId: id });
    
    // Delete user
    await User.findByIdAndDelete(id);

    // Cancel all future appointments for this barber
    await Appointment.updateMany(
      { barberId: id, startTime: { $gte: new Date() } },
      { status: 'cancelled' }
    );

    res.json({ message: 'Barber removed and schedules cleaned up successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error removing barber', error: err.message });
  }
};

// Get Financial Analytics (supports Barber and Admin metrics)
exports.getAnalytics = async (req, res) => {
  try {
    const role = req.user.role;
    
    if (role === 'customer') {
      return res.status(403).json({ message: 'Access denied: Customers do not have financial access' });
    }

    if (role === 'barber') {
      const barberId = req.user.id;

      // Find all completed appointments for this barber
      const appointments = await Appointment.find({
        barberId,
        status: 'completed'
      });

      let totalRevenue = 0;
      let totalTips = 0;
      let completedCuts = appointments.length;

      appointments.forEach(app => {
        totalRevenue += app.service.price;
        totalTips += app.tip || 0;
      });

      // Calculate Customer Retention Rate
      const customerVisits = {};
      appointments.forEach(app => {
        const cId = app.customerId.toString();
        customerVisits[cId] = (customerVisits[cId] || 0) + 1;
      });
      const uniqueCustomers = Object.keys(customerVisits).length;
      const repeatCustomers = Object.values(customerVisits).filter(count => count >= 2).length;
      const retentionRate = uniqueCustomers > 0 
        ? Math.round((repeatCustomers / uniqueCustomers) * 100) 
        : 0;

      // Calculate Most Requested Service
      const serviceCounts = {};
      appointments.forEach(app => {
        const sName = app.service.name;
        serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
      });
      let topService = 'None';
      let topCount = 0;
      Object.entries(serviceCounts).forEach(([name, count]) => {
        if (count > topCount) {
          topCount = count;
          topService = name;
        }
      });

      // 70% commission rate
      const commissionRate = 0.7;
      const commissionEarnings = totalRevenue * commissionRate;
      const totalTakeHome = commissionEarnings + totalTips;

      // Calculate recent daily cuts
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const dailyAppointments = await Appointment.find({
        barberId,
        status: 'completed',
        startTime: { $gte: startOfDay }
      });

      let dailyRevenue = 0;
      let dailyTips = 0;
      dailyAppointments.forEach(app => {
        dailyRevenue += app.service.price;
        dailyTips += app.tip || 0;
      });

      return res.json({
        role: 'barber',
        summary: {
          completedCuts,
          totalRevenue,
          commissionEarnings,
          totalTips,
          totalTakeHome,
          commissionRate: '70%',
          retentionRate: `${retentionRate}%`,
          topService: topService !== 'None' ? `${topService} (${topCount})` : 'None'
        },
        dailySummary: {
          cutsCount: dailyAppointments.length,
          revenue: dailyRevenue,
          commissionEarnings: dailyRevenue * commissionRate,
          tips: dailyTips,
          takeHome: (dailyRevenue * commissionRate) + dailyTips
        }
      });
    }

    if (role === 'admin') {
      // Find all completed appointments
      const appointments = await Appointment.find({ status: 'completed' });
      const totalAppointments = await Appointment.countDocuments();
      const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

      let totalRevenue = 0;
      let totalTips = 0;
      
      appointments.forEach(app => {
        totalRevenue += app.service.price;
        totalTips += app.tip || 0;
      });

      // Group performance by barber
      const barbers = await User.find({ role: 'barber' }).select('name email');
      const barberBreakdowns = [];

      for (const barber of barbers) {
        const barberApps = await Appointment.find({
          barberId: barber._id,
          status: 'completed'
        });

        let revenue = 0;
        let tips = 0;
        barberApps.forEach(app => {
          revenue += app.service.price;
          tips += app.tip || 0;
        });

        barberBreakdowns.push({
          barberId: barber._id,
          name: barber.name,
          completedCuts: barberApps.length,
          serviceRevenue: revenue,
          commissionPaid: revenue * 0.7,
          tipsCollected: tips,
          netShopRevenue: revenue * 0.3 // Shop takes 30% cut
        });
      }

      // Sum of net shop revenue
      const totalNetShopRevenue = totalRevenue * 0.3;

      return res.json({
        role: 'admin',
        summary: {
          totalAppointments,
          completedCutsCount: appointments.length,
          cancelledCount: cancelledAppointments,
          grossServiceRevenue: totalRevenue,
          totalTipsDistributed: totalTips,
          shopCommissionRevenue: totalNetShopRevenue
        },
        barberBreakdowns
      });
    }

  } catch (err) {
    res.status(500).json({ message: 'Server error generating financial reports', error: err.message });
  }
};
