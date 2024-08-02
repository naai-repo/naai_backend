
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var companySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    address:String,
    code:String,
    contactNumber:{
        type:Number,
        unique:true
    },
    startDate:Date,
    isActive:{
        type:Boolean,
        default:true
    },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
},{timestamps:true});



    
module.exports = mongoose.model('Company', companySchema);



