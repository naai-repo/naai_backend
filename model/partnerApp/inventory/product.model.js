
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
    // company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    company:String,
    volume:Number,
    description: String,
    price: Number,//procurement price
    mrp:Number, //cost price
    shortName: String,
    isActive:{
        type:Boolean,
        default:true
    },
    expDate:{
        type:Date
    },
    mfgDate:{
        type:Date
    },
    tags:[],
    _extras: {},
    quantity: { type: Number, default: 0 },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
},{timestamps:true});



    
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

