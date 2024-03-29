const router = require("express").Router();
const SalesController = require("../../controllers/salesController/sales.controller");

router.post('/signup', SalesController.createSalesAccount)
module.exports = router;