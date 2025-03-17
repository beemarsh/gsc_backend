const express = require("express");
const router = express.Router();

const register = require("./register");
const login = require("./login");
const partner = require("./partner");
const event = require("./event");
const logout = require('./logout');

router.use("/register", register);
router.use("/login", login);
router.use("/partner", partner);
router.use("/event", event);
router.use("/logout", logout);


module.exports = router;
