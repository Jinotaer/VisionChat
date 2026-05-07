const express = require('express');
const router = express.Router();
const { googleLogin, logout, getMe } = require('../controller/loginController');

router.post('/google', googleLogin);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;
