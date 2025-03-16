const express = require("express");
const router = express.Router();

const register = require("./register");
const login = require("./login");
const partner = require("./partner");
const event = require("./event");

router.use("/register", register);
router.use("/login", login);
router.use("/partner", partner);
router.use("/event", event);

module.exports = router;
