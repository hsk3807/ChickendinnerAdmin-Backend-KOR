const express = require('express');
const PayController = require('../controllers/pay.controller');

const router = express.Router();

router.post('/upay', PayController.upay);
router.get('/upay', PayController.upay);

router.post('/easypay', PayController.easypay);

router.post('/kspay_wh_rcv', PayController.kspay_wh_rcv);
router.post('/kspay_wh_result', PayController.kspay_wh_result);

router.post('/mypay_rcv', PayController.mypay_rcv);
router.post('/mypay_cancel', PayController.mypay_cancel);
router.post('/mypay_result', PayController.mypay_result);

//mypay

module.exports = router;
