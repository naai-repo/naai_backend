const router = require("express").Router();
const PosServiceController = require("../../controllers/posController/service.controller")

router.get("/service/:category", PosServiceController.getServicesFromCategories);

module.exports = router;