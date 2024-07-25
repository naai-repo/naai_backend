const router = require("express").Router();
const FeatureController = require("../../controllers/featuresAndPages/feature.controller");

router.post("/create", FeatureController.CreateFeature);
router.get("/getFeatures", FeatureController.GetFeatures);

module.exports = router;