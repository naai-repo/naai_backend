const mongoose = require('mongoose');

// Schema for Partners
const UserSchema = new mongoose.Schema({
    name :{
        type: String,
        required: true
    },
    email :{
        type: String,
        default: '',
    },
    password :{
        type: String,
        required: true
    },
    gender : {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
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
    verified: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

module.exports = new mongoose.model("User", UserSchema);