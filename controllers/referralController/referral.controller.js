const wrapperMessage = require("../../helper/wrapperMessage");

exports.createReferralLink = (req, res, next) => {
  try {
    const { email, name } = req.body;
    
    res
      .status(200)
      .json(wrapperMessage("success", "Referral link created successfully!"));
  } catch (err) {
    console.log(err);
    res
      .status(err.code || 500)
      .json(
        wrapperMessage(
          "failed",
          "An error occured while creating referral link!"
        )
      );
  }
};
