const Review = require('../models/review.model');
const Product = require('../models/product.model');

exports.addReview = async (req, res) => {
    try {
        const { productID, userID, rating, comment } = req.body;

        // ১. Review save kora
        const newReview = new Review({
            productID,
            userID, // Ekhane user-er ID jabe (jodi logged in thake)
            rating: Number(rating),
            comment
        });
        await newReview.save();

        // ২. Oi product-er sob review niye average calculation
        const allReviews = await Review.find({ productID });
        const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const avgRating = (totalRating / allReviews.length).toFixed(1);

        // ৩. Product model-e summary update kora
        await Product.findByIdAndUpdate(productID, {
            avgRating: avgRating,
            totalReviews: allReviews.length
        });

        res.status(201).json({ 
            success: true, 
            message: "Review added successfully!", 
            newReview 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ productID: req.params.productId })
            .populate('userID', 'name profileImage') 
            .sort({ createdAt: -1 });
            
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};