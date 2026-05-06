const authMiddleware = (req, res, next) => {
  // Destructive actions (POST, PUT, DELETE) require admin authentication
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    // Basic check: looks for the admin token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== 'Bearer admin_authenticated') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
  }
  next();
};

module.exports = authMiddleware;
