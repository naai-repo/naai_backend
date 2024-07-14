const router = require("express").Router();
const SubscriptionController = require("../../controllers/subscriptionController/subscription.controller");

router.post('/createMembershipforSalon', SubscriptionController.createMembershipForSalon);
router.post('/assignMembershipToUser', SubscriptionController.subscribeMembershipToUser);
module.exports = router;