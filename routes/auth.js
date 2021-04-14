const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.js");

router.post('/register', authController.register);

router.post('/index', authController.login);



module.exports = router;