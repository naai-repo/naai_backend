

const ProductSales = require('./');


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








