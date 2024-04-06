const router = require('express').Router();
const CouponsController = require('../../controllers/couponController/coupon.controller');

router.post('/create', CouponsController.createCoupons);
router.get('/fetch', CouponsController.getCoupons);
module.exports = router;