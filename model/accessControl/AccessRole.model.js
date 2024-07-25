const mongoose = require('mongoose');

const AccessRoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    salonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salon',
        default: process.env.NULL_OBJECT_ID,
    },
    page_permissions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Feature',
            required: true,
        }
    ],
    component_permissions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Feature',
            required: true,
        }
    ],
}, {
    timestamps: true,
});

const AccessRoles = new mongoose.model('AccessRole', AccessRoleSchema);
module.exports = AccessRoles;