import {StripeKey} from './constants/StripeKey';
import { DBConstant } from './constants/DBConstant';
import { SchoolRouter } from './router/SchoolRouter';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as helmet from 'helmet';
import * as mongoose from 'mongoose';
import * as logger from 'morgan';
import { LearnerRouter } from './router/LearnerRouter';
import { CommonRouter } from './router/CommonRouter';
import { MasterRouter } from './router/MasterRouter';
import { DriverRouter } from './router/DriverRouter';
import { AdminRouter } from './router/AdminRouter';
import User from './models/User';
import Order from './models/Order';
import Slot from './masters/Slot';
import Package from './masters/Package';
import { request } from 'https';
import * as request1 from "request";
import * as fs from "fs";
import axios from "axios";
import { BaseURL } from './constants/BaseURL';
import { dirname } from 'path';

const learnerRouter = new LearnerRouter();
const commonRouter = new CommonRouter();
const masterRouter = new MasterRouter();
const driverRouter = new DriverRouter();

const adminRouter = new AdminRouter();
const schoolRouter = new SchoolRouter();

class Server {
  // set app to be of type express.Application
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
  }


  makeLogs(req: any, res: any) {
    console.log(res);

    var strRequest = "";
    if (req && req.body != undefined) {
      strRequest =
        req.originalUrl + " \n Req body was: " + JSON.stringify(req.body);
    } else {
      strRequest = req;
    }

    var message =
      "\n Request was on : " +
      new Date().toISOString() +
      "\n Req: " +
      strRequest +
      "\n Response was on : " +
      new Date().toISOString() +
      "\n Res: " +
      JSON.stringify(res);

    var fileDate = new Date();
    var d = fileDate.getDate();
    var y = fileDate.getFullYear();
    var m = fileDate.getMonth();

    var fileName = "StripePayment" + d + "-" + (m + 1) + "-" + y + ".txt";

    var logStream = fs.createWriteStream("logs/" + fileName, { flags: "a" });
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write(message + "\n");
    logStream.end("this is the end line \n");
  }

  // application config
  public config(): void {

   // mongoose.Promise = global.Promise;
    mongoose.connect(DBConstant.MONGO_URI || process.env.MONGODB_URI, { useNewUrlParser: true });
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    
    User.findOne({userRole:"SUPER_ADMIN"}).then((data)=>{
      if(!data || data._id == null){
        const user = new User({
          firstName:"Admin",
          lastName:"Admin",
          email:"manish@lurnr.co",
          password:"LurnrAdmin@123!",
          adiOrPdiBadgeNumber:"",
          userType:"PORTAL_USER",
          userRole:"SUPER_ADMIN",
          drivingLicense:"",
          mobileNumber:"7572595965",
          countryCode:"+91",
          addresses: [],
          companions:[],
          //documents: documents,
          token: "dcd2aa014862d025ae5cd1495ce5c0c6"
        });
        user.save();
      }
    })

    // express middleware
    //this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json({limit: '50mb'}));
    this.app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(logger('dev'));
    this.app.use(compression());
    this.app.use(helmet());
    this.app.use(cors());
   
    this.app.use("/public", express.static('uploads'));
  
    var x = require('path').join(__dirname,'/uploads');
    this.app.use(express.static(x));




    var y = require('path').join(__dirname,'views')
    this.app.use(express.static(y));   

    
    // cors
    this.app.use((req, res, next) => {
     // console.log("i am reqqqq ",req.originalUrl,req.body);

      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials',
      );
      res.header('Access-Control-Allow-Credentials', 'true');
//       res.on('finish', () => {
//         console.log("fff");
//         console.log(`${res.statusCode} ${res.statusMessage}; ${res}b sent`);
//         console.log(res);
        
//       })

//       res.on('data', function(chunk) {
// console.log("i m chunk",chunk)
//       });


      next();
    });
  }



  // application routes
  public routes(): void {
    const router: express.Router = express.Router();

    // this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    const url = require('url');  
    const querystring = require('querystring'); 
    // this.app.use(express.static(__dirname + '/public'));
    
    
    var y = require('path').join(__dirname,'views')
    this.app.use(express.static(y)); 

    this.app.set('view engine', 'hbs');
    
    this.app.set('view engine', 'html');
    this.app.engine('html', require('hbs').__express);



  
    this.app.use('/', router);
    this.app.set("view engine", "pug");
    const keyPublishable = StripeKey.STRIPE_PUBLISHKEY;
    const keySecret = StripeKey.STRIPE_SECRETKEY;
    const stripe = require("stripe")(keySecret);
    

    router.get('/payment', function(req, res, next) {
      console.log(__dirname,'today')
      let token = req.query.token;
      let orderId = req.query.orderId;
      console.log(token,orderId,'token,orderId')
     
      let body = {
      token:req.query.token,
      orderId:req.query.orderId
     }
      request1({
        url:BaseURL.CURRENT_BASE_URL + "/learner/orderById",
        method: "POST",
        json: true,  
        body: body
    }, function (error, response, body){
    
        console.log((__dirname + '/views'),'i m here1')
        if (body.status ==1) {
          var tax = (parseFloat(body["data"]["packageId"]["price"]))*
          ( parseFloat(body["data"]["packageId"]["tax"] )/100);
         
          var amount = parseFloat(body["data"]["packageId"]["price"])
        var finalAmount = (parseFloat(body["data"]["packageId"]["price"]))*
        ( parseFloat(body["data"]["packageId"]["tax"] )/100) + parseFloat(body["data"]["packageId"]["price"])
          res.render('index', 
          {keyPublishable,

            tax : tax.toFixed(2),
            amount:amount.toFixed(2),
            finalAmount: finalAmount.toFixed(2),
            name:body["data"]["packageId"]["name"],
            numberOfDay : body["data"]["packageId"]["numberOfDay"],
            numberOfLesson : body["data"]["packageId"]["numberOfLesson"],
            lurnrEmail :body["data"]["learnerId"]["email"],
            userToken : req.query.token,
            orderId : req.query.orderId,
          });
        }
   
          
    });

    
    });
  


    router.post("/charge", (req, res) => {
     


    let finalAmount = req.body.finalAmount * 100;
    
      let amount = finalAmount;
 
  

      stripe.customers.create({
         email: req.body.lurnrEmail,
         source: req.body.stripeToken,
       
      })
      .then(customer =>
   
        stripe.charges.create({
          amount,
          description: "Sample Charge",
             currency: "GBP",//usd
             
             customer: customer.id
        })).catch(error=>{
          console.log(error,'1')
        })
       .then(charge => {
         var log = new Server();
         var requestLog = JSON.stringify(req.body)
         log.makeLogs(requestLog,charge);
    
      let status;
      if(charge.status=="succeeded") {
        status = "COMPLETED"
      } else {
        status =="Fail"
      }
      var body = {
     token: req.body.userToken,
     orderId:req.body.orderId,
     paymentType:"Online",
     paymentStatus:status,
     paymentId:charge.id,
     transactionId:""
       }
       request1({
        url: BaseURL.CURRENT_BASE_URL +"/common/paymentStatus",
        method: "POST",
        json: true,   // <--Very important!!!
        body: body
    }, function (error, response, body){
    
        if(body.status==1) {
              res.redirect('/success=true')
            } else {
              res.redirect('/success=false');
            }
    });
       
    
  })
  .catch(error=>{
    console.log(error,'2')
  })
});
      
     
router.get('/success=false', function(req, res, next) {

  res.render('fail.pug');

});
    

    router.get('/success=true', function(req, res, next) {

  
      res.render('charge.pug');
   
    });








    // Router of master data
    this.app.use('/api/v1/common', commonRouter.router);
    this.app.use('/api/v1/master', masterRouter.router);

    // Router of different modules
    this.app.use('/api/v1/learner', learnerRouter.router);
    this.app.use('/api/v1/driver', driverRouter.router);
    this.app.use('/api/v1/school', schoolRouter.router);
    this.app.use('/api/v1/admin', adminRouter.router);
  }
}

// export
export default new Server().app;