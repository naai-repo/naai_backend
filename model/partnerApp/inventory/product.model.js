
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var productItemSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    HSNSAC : {
        type: String,
        required: true
    }, 
    usageUnit: {
        type: String,//[ml or gm]
        required: true
    },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    company:String,
    volume:Number,
    description: String,
    price: Number,//procurement price
    mrp:Number, //cost price
    shortName: String,
    manuFacturedAt:{
        type:Date
    },
    isActive:{
        type:Boolean,
        default:true
    },
    expiryDate:{
        type:Date
    },
    tags:[],
    expiryInMonths:Number,
    _extras: {},
    totalQuantity: { type: Number, default: 0 },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
},{timestamps:true});

productItemSchema
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
    }, 'Duplicate Item Name, please use another name.');


    
module.exports = mongoose.model('product', productItemSchema);




// const Service = require('./serviceModel');
// const Product = require('./productModel');

// // Create a new service
// const hairWashService = new Service({
//     name: 'Hair Wash',
//     description: 'A refreshing hair wash service',
//     duration: 30, // Duration in minutes
//     productsUsed: [{
//         product: productId, // Replace 'productId' with the ObjectId of the shampoo product
//         usagePerService: 30 // Amount of shampoo used per hair wash in ml
//     }]
// });

// // Save the service to the database
// hairWashService.save()
//     .then(service => {
//         console.log('Hair wash service saved:', service);
//     })
//     .catch(error => {
//         console.error('Error saving hair wash service:', error);
//     });

