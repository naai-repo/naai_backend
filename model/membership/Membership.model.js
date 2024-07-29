const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    salonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salon',
        default: process.env.NULL_OBJECT_ID,
    },
    description:{
        type: String,
        required: true,
    },
    apply_to: {
        // 0 ->  apply to both, 
        // 1 -> apply to walkin customers, 
        // 2 -> apply to app customers
        type: Number,
        default: 1,
    },
    validity_in_days: {
        type: Number,
        required: true,
    },
    validity_unit: {
        type: String,
        required: true,
        enum: ['DAY', 'MONTH', 'YEAR'],
    },
    cost: {
        type: Number,
        required: true,
    },
    wallet_amount_credit: {
        type: Number,
        default: 0,
    },
    min_bill_amount: {
        type: Number,
        default: 0,
    },
    discount_type: {
        type: Number,
        default: null,
    },
    discount_type_value: {
        type: Number,
        default: null,
    },
    max_discount_amount: {
        type: Number,
        default: null,
    },
    all_services_discount_type: {
        type: Number,
        default: null,
    },
    all_services_discount_type_value: {
        type: Number,
        default: null,
    },
    all_services_include: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
    }],
    all_services_except: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
    }],
    all_products_discount_type: {
        type: Number,
        default: null,
    },
    all_products_discount_type_value: {
        type: Number,
        default: null,
    },
    all_products_include: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
    all_products_except: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
    minimum_service_cost: {
        type: Number,
        default: null,
    },
    minimum_product_cost: {
        type: Number,
        default: null,
    },
    services: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Service',
            },
            allotted_count: {
                type: Number,
                required: true,
            },
            discount_type: {
                type: Number,
                required: true,
            },
            discount_type_value: {
                type: Number,
                required: true,
            },
            max_discount_amount: {
                type: Number,
                default: null,
            },
        },
    ],
    products: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            allotted_count: {
                type: Number,
                required: true,
            },
            discount_type: {
                type: Number,
                required: true,
            },
            discount_type_value: {
                type: Number,
                required: true,
            },
            max_discount_amount: {
                type: Number,
                default: null,
            },
        }
    ],
    status: {
        type: Boolean,
        required: true,
    },
    all_services_discount_max_count: {
        type: Number,
        default: null,
    },
    all_products_discount_max_count: {
        type: Number,
        default: null,
    },
}, {
    timestamps: true,
});

const Memberships = new mongoose.model('Membership', MembershipSchema);
module.exports = Memberships;