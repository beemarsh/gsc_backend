const express = require('express');
const router = express.Router();

const add = require('./add');
const edit = require('./edit');
const del = require('./delete');
const get = require('./get');

router.use('/', add);
router.use('/', edit);
router.use('/', del);
router.use('/', get);

module.exports = router;
