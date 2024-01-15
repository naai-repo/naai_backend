const mongoose = require('mongoose');

// Schema for Partners
const UserSchema = new mongoose.Schema({
    name :{
        type: String,
        default: ''
    },
    email :{
        type: String,
        unique: true,
        default: '',
    },
    gender : {
        type: String,
        enum: ['male', 'female', 'not specified'],
        default: 'not specified'
    },
    phoneNumber : {
        type: Number,
        required: true,
        unique: true,
        validate: {
            validator: function(val) {
                return val.toString().length === 10
            },
            message: val => `${val.value} has to be 10 digits`
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    verified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'deactivated'],
        lowercase: true,
        default: "active"
    }
},{
    timestamps: true
});

UserSchema.index({location: "2dsphere" });

module.exports = new mongoose.model("User", UserSchema);