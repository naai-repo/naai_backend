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

// Edit a membership

exports.EditMembership = async (req, res, next) => {
  try {
    const membershipBody = req.body;
    const membershipId = req.params.membershipId;
    const membership = await Memberships.findOne({_id: membershipId});
    if (!membership) {
      let err = new Error("Membership Not Found");
      err.code = 404;
      throw err;
    }
    const updatedMembership = await Memberships.updateOne({_id: membershipId}, membershipBody);
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Membership Updated Successfully",
          updatedMembership
        )
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
}

// Delete a membership

exports.DeleteMembership = async (req, res, next) => {
  try {
    const membershipId = req.params.membershipId;
    const membership = await Memberships.findOne({_id: membershipId});
    if (!membership) {
      let err = new Error("Membership Not Found");
      err.code = 404;
      throw err;
    }
    let deletedMembership = await Memberships.deleteOne({_id: membershipId});
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Membership Deleted Successfully",
          deletedMembership
        )
      );
  }catch(err){
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
    
}
