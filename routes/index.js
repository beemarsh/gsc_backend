const express = require("express");
const router = express.Router();

const register = require("./register");
const login = require("./login");
const partner = require("./partner");

router.use("/register", register);
router.use("/login", login);
router.use("/partner", partner);

module.exports = router;
