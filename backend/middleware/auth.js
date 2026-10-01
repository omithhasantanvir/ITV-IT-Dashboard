import jwt from 'jsonwebtoken';

// Temporary local-development escape hatch. When REQUIRE_AUTH=false is set in
// backend/.env AND NODE_ENV is not "production", requests pass through with a
// synthetic Super Admin identity so the dashboard can be wired to real data
// before the login flow exists. The bypass can never activate in production.
export const isAuthBypassed = () =>
  process.env.NODE_ENV !== 'production' && process.env.REQUIRE_AUTH === 'false';

export const protect = (req, res, next) => {
  if (isAuthBypassed()) {
    req.user = { id: null, role: 'Super Admin', employeeId: null, bypassed: true };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};
