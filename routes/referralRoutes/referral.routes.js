const router = require("express").Router();
const ReferralController = require("../../controllers/referralController/referral.controller");


router.post("/create", ReferralController.createReferralLink);

module.exports = router;