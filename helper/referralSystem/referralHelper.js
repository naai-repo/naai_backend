const Referral = require("../../model/referralSystem/referral.model");
let referralCodes = require('voucher-code-generator');

class ReferralUtils {
  static async getReferralCode(id, name, from) {
    let newReferral = {
      name,
      numberOfReferrals: 0,
      paymentsHistory: [],
    };

    if (from === "sales") {
      newReferral.sales_id = id;
    } else if (from === "partner") {
      newReferral.partner_id = id;
    } else if (from === "user") {
      newReferral.customer_id = id;
    }

    let initials = name.substring(0, 3).toUpperCase();
    let referralCode = referralCodes.generate({
      length: 8,
      count: 1,
      prefix: `${initials}-`
    });
    newReferral.referralCode = referralCode[0];
    let referral = await new Referral(newReferral).save();

    return referral;
  }
}

module.exports = ReferralUtils;
