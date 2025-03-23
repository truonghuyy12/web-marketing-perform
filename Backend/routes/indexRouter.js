const express = require("express");
const router = express.Router({ mergeParams: true });
const indexController = require("../controllers/indexController")
const { verifyToken, isStaff } = require("../middlewares/auth");

router.get("/", verifyToken, isStaff, indexController.getDashBoard)
router.post('/chat', indexController.getChatbotResponse);

module.exports = router;
