const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token found in Bearer structure' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_barber_booking_token_key_12345');
    req.user = decoded; // Should contain { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

// Middleware wrapper to enforce role-based access controls
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: Access restricted to ${rolesArray.join(' or ')}` });
    }
    
    next();
  };
};

module.exports = { auth, requireRole };
