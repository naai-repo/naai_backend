

const User = require('../../model/customerApp/User');
const Subscription = require('../../model/subscription/subscription.model');
const wrapperMessage = require("../../helper/wrapperMessage");
const Salon = require('../../model/partnerApp/Salon');
const ActiveSubscription = require('../../model/subscription/activeSubscription.model');
const TopUpPackage = require('../../model/subscription/topup.model');

// Function to create a new membership for a salon
exports.purchaseSubscription =  async (req, res) => {
    const { salonId, subscriptionId } = req.body;

    try {
        const salon = await Salon.findById(salonId);
        const subscription = await Subscription.findById(subscriptionId);

        if (!salon || !subscription) {
            return res.status(404).json({ error: 'Invalid salon or subscription' });
        }


        const existingActiveSubscription = await ActiveSubscription.findOne({
            salon: salon._id,
            subscription: subscription._id,
            endDate: { $gt: new Date() } // Ensure it's still active
        });

        if (existingActiveSubscription) {
            return res.status(400).json({ error: 'Salon already has an active subscription for this plan' });
        }

        const durationInMilliseconds = subscription.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        const endDate = new Date(Date.now() + durationInMilliseconds);

        const activeSubscription = new ActiveSubscription({
            salon: salon._id,
            subscription: subscription._id,
            startDate: new Date(),
            endDate: endDate,
            duration: subscription.duration,
            status: 'active',
        });

        salon.activeSubscriptions.push(activeSubscription._id);

        await activeSubscription.save();
        await salon.save();

        return res.status(201).json(activeSubscription); // Return the created active subscription
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllSubscriptions =  async (req, res) => {
  try {
      const subscriptions = await Subscription.find();
      res.json(subscriptions);
  } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Server error' });
  }
};


exports.TopUp =  async (req, res) => {
    try {
        const { salonId, packageId } = req.body;

        const topUpPackage = await TopUpPackage.findById(packageId);
        if (!topUpPackage) {
            return res.status(404).send({ error: 'Top-up package not found' });
        }

        const salon = await Salon.findById(salonId);
        if (!salon) {
            return res.status(404).send({ error: 'Salon not found' });
        }

        salon.smsCredits += topUpPackage.credits;
        await salon.save();

        res.status(201).send({ message: 'SMS Top-up successful', salon });
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while purchasing the SMS top-up package' });
    }
}


// Example usage
// subscribeUserToMembership('60b6c0f1fcd6a050a87b4f12', '60b6c0f1fcd6a050a87b4f11');

