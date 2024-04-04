const router = require("express").Router();

const Plan = require("../../model/plan/plan.model");
const User = require("../../model/customerApp/User");

// serviceid:65cc86948762bbbf1a76ff1e
router.post("/", async  (req, res) => {
    try {
      const { userId, planId } = req.body; 
  

      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const plan = await Plan.findById(planId);
  
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      user.subscription.plan = planId; 
      user.subscription.expiryDate = new Date(Date.now() + plan.durationInMonths * 30 * 24 * 60 * 60 * 1000);

      await user.save();
  
      res.status(200).json({ message: 'Plan added to user successfully' });
    } catch (error) {
      console.error('Error in addPlanToUser:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

  


module.exports = router;

