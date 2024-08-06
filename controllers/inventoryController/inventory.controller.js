

const Company = require('../../model/partnerApp/inventory/Company');
const Product = require('../../model/partnerApp/inventory/product.model');
const ProductSales = require('../../model/partnerApp/inventory/productSales.js');
const ProductUsage = require('../../model/partnerApp/inventory/productUsage.js');


exports.logProductSale = async (req, res) => {
    try {
        const { productId, quantitySold, partnerId, salonId } = req.body;

        // Fetch the product from the database
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if the stock is sufficient
        if (product.stockQuantity < quantitySold) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Deduct the sold quantity from the product's stock
        product.stockQuantity -= quantitySold;

        // Save the updated product
        await product.save();

        // Create a new product sale record
        const sale = new ProductSales({
            product: productId,
            quantitySold,
            partner: partnerId,
            salon: salonId
        });

        // Save the sale to the database
        await sale.save();

        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.fetchProductUsage = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const productUsage = await ProductUsage.find()
            .populate('product')
            .populate('service')
            .populate('partner')
            .populate('salon')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await ProductUsage.countDocuments();

        res.status(200).json({
            productUsage,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.fetchProductSales = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const productSales = await ProductSales.find()
            .populate('product')
            .populate('partner')
            .populate('salon')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await ProductSales.countDocuments();

        res.status(200).json({
            productSales,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addCompany = async (req, res) => {
    const { name, address, contactNumber, startDate, salon } = req.body;

    // Validate required fields
    if (!name || !address || !contactNumber || !startDate || !salon) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Check if the company with the same name already exists for the same salon
        const existingCompany = await Company.findOne({ name, salon });
        if (existingCompany) {
            return res.status(400).json({ error: "Duplicate Company Name, please use another name." });
        }

        // Create and save the new company
        const company = new Company({ name, address, contactNumber, startDate, salon });
        await company.save();

        res.status(201).json(company);
    } catch (error) {
        console.error("Error creating company:", error);
        res.status(500).json({ error: "An error occurred while creating the company" });
    }
};


//get company


exports.getCompanies = async (req, res) => {
    const { salon, name, page = 1, limit = 10 } = req.query;

    if (!salon) {
        return res.status(400).json({ error: "salonId is required" });
    }

    let filter = { salon };
    if (name) {
        filter.name = new RegExp(name, 'i'); // case-insensitive regex match
    }

    try {
        const companies = await Company.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Company.countDocuments(filter);

        res.status(200).json({
            companies,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ error: "An error occurred while fetching companies" });
    }
};


const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
};

exports.getProducts = async (req, res) => {
    const { salon, name, page = 1, limit = 10 } = req.query;

    if (!salon) {
        return res.status(400).json({ error: "salonId is required" });
    }

    let filter = { salon };
    if (name) {
        try {
            const escapedName = escapeRegExp(name);
            filter.name = new RegExp(escapedName, 'i'); // Case-insensitive regex match
        } catch (error) {
            return res.status(400).json({ error: "Invalid search term" });
        }
    }

    try {
        const products = await Product.find(filter)
            .limit(parseInt(limit, 10))  // Ensure limit is an integer
            .skip((page - 1) * parseInt(limit, 10))
            .exec();

        const count = await Product.countDocuments(filter);

        res.status(200).json({
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "An error occurred while fetching products" });
    }
};




exports.getCompaniesBySalonId = async (req, res) => {
    try {
        const { salonId } = req.params;
        const companies = await Company.find({ salon: salonId });

        if (!companies) {
            return res.status(404).json({ error: 'No companies found for this salon ID' });
        }

        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};





exports.addProduct = async (req, res) => {
    try {
        const productData = req.body;
        if(productData){
            delete productData._id;
        }
        console.log(productData)
        const newProduct = new Product(productData);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params; // Get the product ID from the URL params
        const updateData = req.body; // Get the data to update from the request body

        // Find the product by ID and update it with the new data
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            updateData, 
            { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators: true` ensures validation
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};






