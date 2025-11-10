// server/src/modules/user/index.js
const express = require('express');
const router = express.Router();
const userController = require('./controllers/user.controller');

// GET /users (모듈이 /users에 마운트될 예정이므로, 여기는 루트 경로 '/')
router.get('/', userController.getUsers);

// POST /users
router.post('/', userController.createUser);

module.exports = router;