const express = require('express');
const PayController = require('../controllers/pay.controller');

const router = express.Router();

router.post('/', PayController.upay);
router.get('/', PayController.upay);

//old pay
// router.get('/easyPay', payController.easyPay);

//kspay
router.get('/kspay_wh', PayController.kspay_wh);
router.get('/kspay_wh_result', PayController.kspay_wh_result);

router.post('/kspay_wh', PayController.kspay_wh);
router.post('/kspay_wh_result', PayController.kspay_wh_result);

//mypay

module.exports = router;
