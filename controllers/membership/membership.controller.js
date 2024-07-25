const Memberships = require("../../model/membership/Membership.model");
const CommonUtils = require("../../helper/commonUtils");
const wrapperMessage = require("../../helper/wrapperMessage");

exports.CreateMembership = async (req, res, next) => {
  try {
    const membershipBody = req.body;
    const salon = await CommonUtils.checkIfSalonExists(membershipBody.salonId);
    if (!salon) {
      let err = new Error("Salon Not Found");
      err.code = 404;
      throw err;
    }
    const membership = new Memberships(membershipBody);
    await membership.save();
    res
      .status(200)
      .json(
        wrapperMessage("success", "Membership Created Successfully", membership)
      );
  } catch (err) {
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};

exports.GetMembershipsForSalons = async (req, res, next) => {
  try {
    const salonId = req.params.salonId;
    const salon = await CommonUtils.checkIfSalonExists(salonId);
    if (!salon) {
      let err = new Error("Salon Not Found");
      err.code = 404;
      throw err;
    }
    const memberships = await Memberships.find({ salonId: salonId });
    res.status(200).json(
      wrapperMessage("success", "Memberships Fetched Successfully", {
        count: memberships.length,
        salonId: salonId,
        memberships,
      })
    );
  } catch (err) {
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};
