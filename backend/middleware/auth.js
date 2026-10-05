import jwt from 'jsonwebtoken';

// Local-development escape hatch, kept for the rare case where you need to
// inspect API responses without a session (Postman, curl, debugging a probe).
//
// It is OFF by default and can never activate when NODE_ENV=production, so a
// production deploy is unaffected by this file. Prefer signing in with a real
// account — REQUIRE_AUTH=true in backend/.env is the supported setup.
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
