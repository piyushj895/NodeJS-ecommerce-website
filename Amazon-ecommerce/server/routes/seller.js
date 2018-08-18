const router = require('express').Router();
const Product = require('../models/product');

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new aws.S3({ accessKeyId: "AKIAIGM3DL2XOCEDGGGQ", secretAccessKey: "QN5OhgoahDNO1GqxoNpJlJ+UE4bXFcnzG14s7/Ht", region:"ap-south-1" });
const faker = require('faker');

const checkJWT = require('../middlewares/check-jwt');

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'amazonowebapplication123',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    },
  })
});


router.route('/products')
  .get(checkJWT, (req,res,next) => {
      Product.find({ owner: req.decoded.user._id})
        .populate('owner')
        .populate('category')
        .exec((err, products) => {
            if (products) {
                res.json({
                    success: true,
                    message:"Products",
                    products:products
                });
            }
        });
  })
  .post([checkJWT, upload.single('product_picture')], (req, res, next) => {
    // console.log(upload);
    // console.log(req.file);
    let product = new Product();
    product.owner = req.decoded.user._id;
    product.category = req.body.categoryId;
    product.title = req.body.title;
    product.price = req.body.price;
    product.description = req.body.description;
    product.image = req.file.location;
    console.log("Successfully uploaded " + req.file.location);
    product.save();
    res.json({
      success: true,
      message: 'Successfully Added the product'
    });
  });

//   Just for testing
router.get('/faker/test',(req,res,next) => {
    for (let i = 0; i < 20; i++) {
       let product = new Product();
       product.category = "5b67e4f64a010c1e5065bdf7";
       product.owner = "5b6051d32d7cbb132452b144";
       product.image = faker.image.cats();
       product.title = faker.commerce.productName();
       product.description = faker.lorem.words();
       product.price = faker.commerce.price();
       product.save();
    }

    res.json({
        message: "Successfully added 20 pictures"
    });
}); 

module.exports = router;
