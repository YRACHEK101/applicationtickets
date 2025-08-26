import jwt from 'jsonwebtoken';
import User from '../../server/models/User.model.js';

export const auth = async (req, res, next) => { 
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token ID
      //Fetch the user from the database and select firstName, lastName, and role
      const user = await User.findById(decoded.id).select('firstName lastName role');
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      // Attach the full user object (with firstName, lastName, and role) to the request
      req.user = user; 
      next();

    } catch (error) {
      console.error('Auth middleware error:', error); 
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else { 
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    // Ensure req.user and req.user.role are available
    if (!req.user || !req.user.role || (roles.length > 0 && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'Access denied: Insufficient role.' });
    }
    next();
  };
};
