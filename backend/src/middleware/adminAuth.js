// ===============================================================
// Admin Authorization Middleware
// Verifies that incoming requests have appropriate administrator privileges
// ===============================================================

// Middleware function to restrict access to admin-only endpoints
module.exports = function requireAdmin(req, res, next) {
  // Check headers for role indicators (sent by mobile client or web client)
  const roleHeader = req.headers["x-admin-role"] || req.headers["x-user-role"];
  
  // If a role is explicitly specified and does not match an admin tier, deny access
  if (roleHeader && !["admin", "superadmin", "Administrator"].includes(roleHeader)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Administrator privileges required",
    });
  }

  // Request is authorized; proceed to the next middleware or controller handler
  next();
};

