const Product = require("../models/productModel.js")
const ApiFeatures = require("../utils/apiFeatures.js")
const cloudinary = require("cloudinary")


// Create Product -- Admin
exports.createProduct = async (req, res, next) => {
    try {

        let images = [];
        if (typeof req.body.images === "string") {
            images.push(req.body.images)
        } else {
            images = req.body.images
        }

        const imagesLink = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLink.push({
                public_id: result.public_id,
                url: result.secure_url,
            })
        }

        req.body.images = imagesLink
        req.body.user = req.user._id

        const product = await Product.create(req.body)

        res.status(201).json({
            success: true,
            product
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Get All Products
exports.getAllProducts = async (req, res) => {
    try {
        const resultPerPage = 8;
        const productsCount = await Product.countDocuments();

        const apiFeature = new ApiFeatures(Product.find(), req.query)
            .search()
            .filter()
            .pagination(resultPerPage); 

        const products = await apiFeature.query;

        const filteredProductsCount = products.length;

        res.status(200).json({
            success: true,
            products,
            productsCount,
            resultPerPage,
            filteredProductsCount,
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

// Get Products by Category
exports.getCategoryProducts = async (req, res) => {
    try {

        const products = await Product.find({ category: req.query.category })
        console.log(req.query.category)

        res.status(200).json({
            success: true,
            products
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}







// Get Admin Products
exports.getAdminProducts = async (req, res) => {
    try {
        const products = await Product.find()

        res.status(200).json({
            success: true,
            products
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}



// Update product -- Admin
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(500).json({
                success: false,
                message: "Product not found"
            })
        }

        // Images Start Here
        let images = [];
        if (typeof req.body.images === "string") {
            images.push(req.body.images)
        } else {
            images = req.body.images
        }

        if (images !== undefined) {
            // Deleting images from cloudinary
            for (let i = 0; i < product.images.length; i++) {
                await cloudinary.v2.uploader.destroy(product.images[i].public_id)
            }

            const imagesLink = [];

            for (let i = 0; i < images.length; i++) {
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: "products",
                });

                imagesLink.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                })
            }

            req.body.images = imagesLink

        }


        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        })

        res.status(200).json({
            success: true,
            product
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Delete Product 
exports.deleteProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(500).json({
                success: false,
                message: "Product not found"
            })
        }

        // Deleting images from cloudinary
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id)
        }


        product = await Product.findByIdAndRemove(req.params.id);

        res.status(200).json({
            success: true,
            message: ["Product deleted successfully", product]
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}



// Get Single Product Details
exports.getProductDetails = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }

        res.status(200).json({
            success: true,
            product
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}



// Create New Review or Update the Review
exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body;

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        }

        const product = await Product.findById(productId);

        const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString());

        if (isReviewed) {

            product.reviews.forEach(rev => {
                if (rev.user.toString() === req.user._id.toString()) {
                    rev.rating = rating,
                        rev.comment = comment
                }
            })

        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }

        let avg = 0;
        product.ratings = product.reviews.forEach(rev => {
            avg += rev.rating
        })
        product.rating = avg / product.reviews.length;

        await product.save({ validateBeforeSave: false })

        res.status(200).json({
            success: true,
            message: "Review Done"
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}



// Get All reviews 
exports.getProductReviews = async (req, res) => {
    try {
        const product = await Product.findById(req.query.id)

        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product not exist"
            })
        }

        res.status(200).json({
            success: true,
            reviews: product.reviews
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Delete Review
exports.deleteReview = async (req, res) => {
    try {

        const product = await Product.findById(req.query.productId);

        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product not exists"
            })
        }

        const reviews = product.reviews.filter(
            (rev) => rev._id.toString() !== req.query.id.toString()
        );

        let avg = 0;

        reviews.forEach((rev) => {
            avg += rev.rating;
        })

        let ratings = 0

        if (reviews.length === 0) {
            ratings = 0;
        } else {
            ratings = avg / reviews.length;
        }



        const productUpdated = await Product.findByIdAndUpdate(req.query.productId, {
            reviews,
            rating: ratings,
            numOfReviews: reviews.length,
        },
            {
                new: true,
                runValidators: true,
                useFindAndModify: false,
            }
        );



        res.status(200).json({
            success: true,
            message: "Review Deleted",
            productUpdated
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }

}