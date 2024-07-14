

const User = require('../../model/customerApp/User');
const Subscription = require('../../model/subscription/subscription.model');
const wrapperMessage = require("../../helper/wrapperMessage");
const Salon = require('../../model/partnerApp/Salon');
const Membership = require('../../model/subscription/membership.model');

// Function to create a new membership for a salon
exports.createMembershipForSalon = async(req, res) => {
  try {
    let {name, description, validityType, duration, cost, services, salonId} = req.body;
    const salon = await Salon.findById(salonId);
    if (!salon) {
      throw new Error('Salon not found');
    }

    const newMembership = new Membership({
      name,
      description,
      validity: { type: validityType, duration },
      cost,
      services,
      salon: salonId
    });

    const savedMembership = await newMembership.save();

    // Add the membership to the salon's memberships array
    salon.memberships.push(savedMembership._id);
    await salon.save();
    res
    .status(200)
    .json(wrapperMessage("success", "membership added to salon successfully", salon));

    console.log('Membership saved and associated with salon:', savedMembership);
  } catch (error) {
    console.error('Error creating membership:', error);
  }
}

// Example usage
// createMembershipForSalon('Monthly Membership', 'Monthly access to all services', 'monthly', 30, 50, ['Hair Cut', 'Shampoo'], '60b6c0f1fcd6a050a87b4f15');




//assign membership to user



exports.subscribeMembershipToUser = async (req, res)  => {
  try {

    let {userId, membershipId} = req.body
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membership.validity.duration);

    const newSubscription = new Subscription({
      user: userId,
      membership: membershipId,
      endDate: endDate,
      active: true
    });

    const savedSubscription = await newSubscription.save();

    // Add the subscription to the user's subscriptions array
    const user = await User.findById(userId);
    user.subscriptions.push(savedSubscription._id);
    await user.save();
    res
    .status(200)
    .json(wrapperMessage("success", "User subscribed to membership:'", user));

  } catch (error) {
    console.error('Error subscribing user to membership:', error);
  }
}

// Example usage
// subscribeUserToMembership('60b6c0f1fcd6a050a87b4f12', '60b6c0f1fcd6a050a87b4f11');
