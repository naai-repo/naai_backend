const wrapperMessage = require("../../helper/wrapperMessage");
const AccessRoles = require("../../model/accessControl/AccessRole.model");
const CommonUtils = require("../../helper/commonUtils");
const Partner = require("../../model/partnerApp/Partner");

exports.CreateAccessRoles = async (req, res, next) => {
  try {
    let { name, salonId, page_permissions, component_permissions } = req.body;
    if (!name || !page_permissions || !component_permissions || !salonId) {
      let err = new Error("All fields are required");
      err.code = 400;
      throw err;
    }
    if (page_permissions.length === 0 || component_permissions.length === 0) {
      let err = new Error(
        "At least one permission is required for both page and component"
      );
      err.code = 400;
      throw err;
    }
    let existingAccessRole = await AccessRoles.findOne({ name, salonId });
    if (existingAccessRole) {
      let err = new Error("Access Role with this name already exists");
      err.code = 400;
      throw err;
    }
    let salon = await CommonUtils.checkIfSalonExists(salonId);
    let newAccessRole = new AccessRoles({
      name,
      page_permissions,
      component_permissions,
      salonId,
    });
    await newAccessRole.save();
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Access Role created successfully",
          newAccessRole
        )
      );
  } catch (err) {
    console.log(err);
    res
      .status(err.code || 500)
      .json(wrapperMessage(err.status || "failed", err.message));
  }
};

exports.GetAllAccessRoles = async (req, res, next) => {
  try {
    let salonId = req.query.salonId;
    if (!salonId) {
      let err = new Error("Salon Id is required");
      err.code = 400;
      throw err;
    }
    let salon = await CommonUtils.checkIfSalonExists(salonId);
    let accessRoles = await AccessRoles.find({ salonId });
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Access Roles fetched successfully",
          accessRoles
        )
      );
  } catch (err) {
    console.log(err);
    res
      .status(err.code || 500)
      .json(wrapperMessage(err.status || "failed", err.message));
  }
};

exports.AssignAccessRolesToUsers = async (req, res, next) => {
  try {
    let { partnerId, accessRoleId } = req.body;
    if (!partnerId || !accessRoleId) {
      let err = new Error("Partner Id and Access Role Id are required");
      err.code = 400;
      throw err;
    }
    let partner = await Partner.findOne({ _id: partnerId });
    if (!partner) {
      let err = new Error("Partner not found");
      err.code = 404;
      throw err;
    }
    let accessRole = await AccessRoles.findOne({ _id: accessRoleId });
    if (!accessRole) {
      let err = new Error("Access Role not found");
      err.code = 404;
      throw err;
    }
    partner.access = accessRoleId;
    await partner.save();
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Access Role assigned to user successfully",
          partner
        )
      );
  } catch (err) {
    console.log(err);
    res
      .status(err.code || 500)
      .json(wrapperMessage(err.status || "failed", err.message));
  }
};

exports.GetAccessRoutesForUsers = async (req, res, next) => {
  try {
    let partnerId = req.query.partnerId;
    if (!partnerId) {
      let err = new Error("Partner Id is required");
      err.code = 400;
      throw err;
    }
    let partner = await Partner.findOne({ _id: partnerId });
    if (!partner) {
      let err = new Error("Partner not found");
      err.code = 404;
      throw err;
    }
    let accessRoleId = partner.access;
    const aggreagtion = [
      {
        $match: {
          _id: accessRoleId,
        },
      },
      {
        $lookup: {
          from: "features",
          localField: "page_permissions",
          foreignField: "_id",
          as: "page_result",
        },
      },
      {
        $lookup: {
          from: "features",
          localField: "component_permissions",
          foreignField: "_id",
          as: "component_result",
        },
      },
      {
        $addFields: {
          page_permissions: {
            $map: {
              input: "$page_result",
              as: "page_permissions",
              in: "$$page_permissions.permissions",
            },
          },
          component_permissions: {
            $map: {
              input: "$component_result",
              as: "component_permissions",
              in: "$$component_permissions.permissions",
            },
          },
        },
      },
      {
        $addFields: {
          page_permissions: {
            $reduce: {
              input: "$page_permissions",
              initialValue: [],
              in: {
                $setUnion: ["$$value", "$$this"],
              },
            },
          },
          component_permissions: {
            $reduce: {
              input: "$component_permissions",
              initialValue: [],
              in: {
                $setUnion: ["$$value", "$$this"],
              },
            },
          },
        },
      },
      {
        $project: {
          page_result: 0,
          component_result: 0,
        },
      },
    ];
    let accessRole = await AccessRoles.aggregate(aggreagtion);
    if (!accessRole) {
      let err = new Error("Access Role not found");
      err.code = 404;
      throw err;
    }

    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Access Roles fetched successfully",
          accessRole
        )
      );
  } catch (err) {
    console.log(err);
    res
      .status(err.code || 500)
      .json(wrapperMessage(err.status || "failed", err.message));
  }
};
