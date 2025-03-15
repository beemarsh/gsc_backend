const express = require("express");
const router = express.Router();

const add_partner = require('./add');
const edit_partner = require('./edit');
const delete_partner = require('./delete');
const get_partner = require('./getAll');

router.use('/add', add_partner);
router.use('/edit', edit_partner);
router.use('/delete', delete_partner);
router.use('/get', get_partner);


module.exports = router; ;  // Exporting the routes for use in the main application file