

const User = require('../../model/customerApp/User');
const Subscription = require('../../model/subscription/subscription.model');
const wrapperMessage = require("../../helper/wrapperMessage");
const Salon = require('../../model/partnerApp/Salon');
const Membership = require('../../model/subscription/membership.model');
const TopUpPackage = require('../../model/subscription/topup.model');

// Function to create a new membership for a salon
exports.purchaseSubscription = async (req, res) => {
  const { salonId, subscriptionId } = req.body;

  try {
      const salon = await Salon.findById(salonId);
      const subscription = await Subscription.findById(subscriptionId);

      if (!salon || !subscription) {
          return res.status(404).json({ error: 'Invalid salon or subscription' });
      }
      const durationInMilliseconds = subscription.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      let endDate = new Date(new Date().getTime() + durationInMilliseconds);


      const membership = new Membership({
          salon: salon._id,
          subscription: subscription._id,
          startDate: new Date(),
          endDate:endDate
      });

      salon.memberships.push(membership._id);
      // salon.smsCredits += subscription.smsCredits;/later on

      await membership.save();
      await salon.save();

      return res.status(201).json(membership); // Return the created membership
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
}


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

