const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.signup);
router.post('/signin', userController.signin);
router.post('/delete-temp', userController.deleteTemp);
router.post('/check-email', userController.checkEmail);

module.exports = router;
