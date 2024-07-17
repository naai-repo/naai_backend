const router = require("express").Router();
const SubscriptionController = require("../../controllers/subscriptionController/subscription.controller");


router.get('/purchaseSubscription', SubscriptionController.purchaseSubscription);
router.get('/getAllSubscriptions', SubscriptionController.getAllSubscriptions);
module.exports = router;