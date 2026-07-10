const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production';

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Token error. Format should be Bearer <token>' });
    }

    const token = parts[1];

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }

      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'User associated with this token no longer exists.' });
      }

      req.user = user;
      return next();
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to authenticate user.' });
  }
};
