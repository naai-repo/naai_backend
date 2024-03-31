const router = require("express").Router();
const SalesController = require("../../controllers/salesController/sales.controller");

router.post('/signup', SalesController.createSalesAccount);
router.post('/login', SalesController.signinUser);
module.exports = router;