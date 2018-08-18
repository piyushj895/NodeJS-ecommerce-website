const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const app = express();
mongoose.Promise= global.Promise;
mongoose.connect(config.database, {useNewUrlParser: true})
// ,(err)=>{
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('Connected to database');
//   }
// });
.then(() =>  console.log('connected to database'))
  .catch((err) => console.error(err));

// var db=mongoose.conne ction;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false}));
app.use(morgan('dev'));
app.use(cors());
// app.get('/',(req,res,next) =>{
//   res.json({
//     user: 'Piyush Jain'
//   })
// }); 

const userRoutes = require('./routes/account');
const mainRoutes = require('./routes/main');
const sellerRoutes = require('./routes/seller');
const productSearchRoutes = require('./routes/product-search');

app.use('/api',mainRoutes);
app.use('/api/accounts',userRoutes);
app.use('/api/seller',sellerRoutes);
app.use('/api/search',productSearchRoutes);
app.listen(config.port,err =>{
    console.log('Magic Happens on port awesome ' + config.port);
});
