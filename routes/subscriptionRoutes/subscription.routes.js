const router = require("express").Router();
const SubscriptionController = require("../../controllers/subscriptionController/subscription.controller");


router.post('/purchaseSubscription', SubscriptionController.purchaseSubscription);

router.get('/getAllSubscriptions', SubscriptionController.getAllSubscriptions);
module.exports = router;