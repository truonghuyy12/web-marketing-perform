const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { verifyToken, isAdmin, isStaff } = require("../middlewares/auth");

// Protected routes - require login
router.get("/", verifyToken, isStaff, employeeController.getEmployees);
router.get("/:id", verifyToken, isStaff, employeeController.getEmployeeById);

// Admin only routes
router.post("/create", verifyToken, isAdmin, employeeController.createEmployee);
router.post("/resend/:id", verifyToken, isAdmin, employeeController.resendEmail);
router.get("/salesInfo/:id", verifyToken, isAdmin, employeeController.getEmployeeSalesInfo);
router.post("/toggleLock/:id", verifyToken, isAdmin, employeeController.toggleLock);
router.delete("/delete/:id", verifyToken, isAdmin, employeeController.deleteEmployee);

module.exports = router;