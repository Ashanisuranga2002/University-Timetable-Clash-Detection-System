// Middleware to verify Admin authorization
module.exports = function requireAdmin(req, res, next) {
  const roleHeader = req.headers["x-admin-role"] || req.headers["x-user-role"];
  
  // If role is explicitly specified and not an admin role, restrict
  if (roleHeader && !["admin", "superadmin", "Administrator"].includes(roleHeader)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Administrator privileges required",
    });
  }

  // Permitted to proceed
  next();
};
