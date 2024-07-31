
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var companySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    address:String,
    code:String,
    contactNumber:Number,
    startDate:Date,
    isActive:{
        type:Boolean,
        default:true
    },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
},{timestamps:true});

companySchema
    .path('name')
    .validate(function (value, respond) {
        var self = this;
        this.constructor.findOne({name: value}, function (err, i) {
            if (err) throw err;
            if (i) {
                if (self.name === i.name ){
                    if(!self._id.equals( i._id))
                        return respond(false);
                    return respond(true);
                }
            }
            respond(true);
        });
    }, 'Duplicate Company Name, please use another name.');


    
module.exports = mongoose.model('Company', companySchema);



