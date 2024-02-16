const User = require('../model/customerApp/User');


const checkSubscriptionValidity = async (req, res, next) => {
  try {

    const userId = req.body.userId; 
    console.log('098uiy')
    console.log(userId)
    const user = await User.findById(userId).populate('subscription.plan');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.subscription.plan) {
      return res.status(403).json({ message: 'User does not have a subscription plan' });
    }
 
    const currentDateTime = new Date();
    if (user.subscription.expiryDate < currentDateTime) {
      return res.status(403).json({ message: 'User subscription has expired' });
    }
    next();
  } catch (error) {
    console.error('Err occcunred:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = checkSubscriptionValidity;
