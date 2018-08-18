const router = require('express').Router();
const async = require('async');
const Category = require('../models/category');
const Product = require('../models/product');
const stripe = require('stripe')('sk_test_xC1ge6q5l3jxCYEXRHW0cKNe');
const Review = require('../models/review');
const Order = require('../models/order');
const checkJWT = require('../middlewares/check-jwt');


// router.get('/test', (req,res,next) => {
//     function number1(callback) {
//         var firstName = "Piyush";
//         callback(null, firstName);
//     }

//     function number2(firstName, callback) {
//         var lastName = "Jain";
//         console.log(firstName + " " + lastName);
//     }
//     async.waterfall([number1, number2])
// });

router.get('/products', (req,res,next) =>{
    const perPage = 10;
    const page = req.query.page
    async.parallel/*.waterfall*/([
        function(callback) {
            Product.count({ /*category: req.params.id*/},(err,count)=>{
                var totalProducts = count;
                callback(err, totalProducts);
            });
        },
       function(/*totalProducts,*/ callback) {
           Product.find({ /*category: req.params.id */})
           .skip(perPage * page)
           .limit(perPage)
           .populate('owner')
           .exec((err, products) =>{
                if(err) return next(err);
                callback(err, products/*, totalProducts*/); 
           });
       },
    //    function(/*products, totalProducts,*/ callback) {
    //        Category.findOne({_id: req.params.id},(err, category) =>{
    //        callback(err, category)
    //        });
    //     }
    ], function(err, results){
        var totalProducts = results[0];
        var products = results[1];
        // var category = results[2];
        res.json({
            success: true,
            message: 'category',
            products: products,
            // categoryName: category.name,
            totalProducts: totalProducts,
            pages: Math.ceil(totalProducts / perPage)
        });
    });
});


router.route('/categories')
    .get((req,res,next) =>{
        Category.find({},(err,categories) =>{
            res.json({
                success: true,
                message:"Success",
                categories: categories
            });
        });
    })
    .post((req,res,next) =>{
        let category = new Category();
        category.name = req.body.category;
        category.save();
        res.json({
            success: true,
            message: "Successful"
        });
    });

    router.get('/categories/:id', (req,res,next) =>{
        const perPage = 10;
        // Product.find({ category: req.params.id })
        //     .populate('category')
        //     .exec((err, products) => {
        //     Product.count({ category: req.params.id }, (err, totalProducts) => {
        //         res.json({
        //             success: true,
        //             message: 'category',
        //             products: products,
        //             categoryName: products[0].category.name,
        //             totalProducts: totalProducts,
        //             pages: Math.ceil(totalProducts / perPage)
        //         });
        //     });
        // });
        const page = req.query.page
        async.parallel/*.waterfall*/([
            function(callback) {
                Product.count({ category: req.params.id},(err,count)=>{
                    var totalProducts = count;
                    callback(err, totalProducts);
                });
            },
           function(/*totalProducts,*/ callback) {
               Product.find({ category: req.params.id })
               .skip(perPage * page)
               .limit(perPage)
               .populate('category')
               .populate('owner')
               .populate('review')
               .exec((err, products) =>{
                    if(err) return next(err);
                    callback(err, products/*, totalProducts*/); 
               });
           },
           function(/*products, totalProducts,*/ callback) {
               Category.findOne({_id: req.params.id},(err, category) =>{
               callback(err, category)
               });
            }
        ], function(err, results){
            var totalProducts = results[0];
            var products = results[1];
            var category = results[2];
            res.json({
                success: true,
                message: 'category',
                products: products,
                categoryName: category.name,
                totalProducts: totalProducts,
                pages: Math.ceil(totalProducts / perPage)
            });
        });
    });

    router.get('/product/:id', (req, res, next) =>{
        Product.findById({_id: req.params.id })
            .populate('category')
            .populate('owner')
            .deepPopulate('reviews.owner')
            .exec((err, product) => {
                if(err) {
                    res.json({
                        success: false,
                        message: 'Product is not found'
                });
            } else {
                if (product) {
                    res.json({
                        success: true,
                        product: product
                    });
                }
            }
        });
    });

    router.post('/review', checkJWT, (req,res,next) =>{
        async.waterfall([
            function(callback) {
                Product.findOne({_id: req.body.productId}, (err,product)=>{
                    if (product) {
                        callback(err, product);
                    }
                });
            },
            function(product) {
                let review = new Review();
                review.owner = req.decoded.user._id;

                if (req.body.title) review.title = req.body.title;
                if (req.body.description) review.description = req.body.description
                review.rating = req.body.rating;

                product.reviews.push(review._id);
                product.save();
                review.save();
                res.json({
                    success: true,
                    message: "Successfully added the review"
                });
            }
        ]);
    });

    router.post('/payment', checkJWT,(req,res,next) => {
        const stripeToken = req.body.stripeToken;
        const currentCharges = Math.round(req.body.totalPrice * 100);

        stripe.customers
            .create({
                source: stripeToken.id
            })
            .then(function(customer){
                return stripe.charges.create({
                    amount: currentCharges,
                    currency: 'usd',
                    customer: customer.id
                });
            })
            .then(function(charge){
                const products = req.body.products;
                let order = new Order();
                order.owner = req.decoded.user._id;
                order.totalPrice = currentCharges;

                products.map(product => {
                    order.products.push({
                        product: product.product,
                        quantity: product.quantity
                    });
                });

                order.save();
                res.json({
                    success: true,
                    message: "SUccessfully made a payment"
                });
            });
        });


module.exports = router;