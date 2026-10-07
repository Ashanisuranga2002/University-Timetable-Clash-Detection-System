import jwt from 'jsonwebtoken';
const allowedRoles = new Set(['coordinator', 'student', 'advisor', 'monitor']);
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required.');
  if (process.env.NODE_ENV === 'production' && (secret === 'change_this_secret' || secret.length < 32)) {
    throw new Error('JWT_SECRET must be replaced with a random value of at least 32 characters in production.');
  }
  return secret;
}
export function authenticate(req, res, next) {
  const authorization = req.header('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({
      success: false,
      message: 'A Bearer token is required.'
    });
    return;
  }
  try {
    const decoded = jwt.verify(match[1], getJwtSecret());
    if (typeof decoded === 'string' || !decoded.sub || !allowedRoles.has(String(decoded.role))) {
      res.status(401).json({
        success: false,
        message: 'The access token is invalid.'
      });
      return;
    }
    req.auth = {
      sub: decoded.sub,
      role: decoded.role
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'The access token is invalid or expired.'
    });
  }
}
export function requireCoordinator(req, res, next) {
  if (req.auth?.role !== 'coordinator') {
    res.status(403).json({
      success: false,
      message: 'Coordinator access is required.'
    });
    return;
  }
  next();
}
export function createAccessToken(claims) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign(claims, getJwtSecret(), {
    expiresIn: expiresIn
  });
}
