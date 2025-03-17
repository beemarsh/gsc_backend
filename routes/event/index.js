const express = require('express');
const router = express.Router();

const add = require('./add');
const edit = require('./edit');
const del = require('./delete');
const get = require('./get');

router.use('/add', add);
router.use('/edit', edit);
router.use('/delete', del);
router.use('/get', get);

module.exports = router;
