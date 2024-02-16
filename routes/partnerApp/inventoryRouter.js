const router = require("express").Router();
const checkingSubscriptionValidity = require("../../middleware/checkingSubscriptionValidity");

// serviceid:65cc86948762bbbf1a76ff1e
router.post("/testInv",checkingSubscriptionValidity, async (req, res) => {
  try {
   res.json({daat:'hey yall this is invemtory data to subscribed users'})
  } catch (err) {
    res.status(500).json(err);
  }
});



module.exports = router;

