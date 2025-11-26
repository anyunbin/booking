// server/routes/index.js
const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth'))
router.use('/time-slots', require('./timeSlots'))
router.use('/schedules', require('./schedules'))
router.use('/requests', require('./requests'))
router.use('/friends', require('./friends'))
router.use('/users', require('./users'))
router.use('/admin', require('./admin'))

module.exports = router

