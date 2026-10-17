// ===============================================================
// Admin User Management Routes
// Endpoints for user CRUD operations and status modifications
// ===============================================================

const express = require("express");
const router = express.Router();
const userController = require("../controllers/adminUserController");

// Get all users (supports ?search=, ?role=, and ?status= filters)
router.get("/", userController.getUsers);

// Get single user details by ID
router.get("/:id", userController.getUserById);

// Create a new user account with hashed password
router.post("/", userController.createUser);

// Update existing user details (name, email, role, etc.)
router.put("/:id", userController.updateUser);

// Quick-action: Update user status (Active, Inactive, Suspended)
router.patch("/:id/status", userController.updateUserStatus);

// Delete or deactivate a user account
router.delete("/:id", userController.deleteUser);

module.exports = router;

