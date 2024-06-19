const router = require("express").Router();
const PosServiceController = require("../../controllers/posController/service.controller")

router.get("/service/:category", PosServiceController.getServicesFromCategories);
router.get("/search/services", PosServiceController.searchSingleSalonServices);

module.exports = router;