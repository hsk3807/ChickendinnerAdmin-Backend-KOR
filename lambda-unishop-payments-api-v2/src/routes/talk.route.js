const express = require('express');
const TalkController = require('../controllers/talk.controller');

const router = express.Router();

router.get('/send', TalkController.send);
router.post('/send', TalkController.send);

//mypay

module.exports = router;
