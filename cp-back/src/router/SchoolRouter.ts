import { LatLongTypes } from "./../constants/LatLongTypes";
import { BaseURL } from "./../constants/BaseURL";
import { responseStatus } from "./../constants/responseStatus";
import { ErrorCodes } from "./../constants/ErrorCodes";
import UserDetails from "./UserDetails";
import EmailSendClass from "../utilities/EmailSend"
import * as fs from "fs";



import {
  EMAIL_NOT_EXISTS,
  SCHOOL_REGISTER_SUCCESS,
  EMAIL_ALREADY_EXISTS,
  INVALID_REQUEST,
  UNKNOW_ERROR,
  DRIVER_CREATED_SUCCESS,
  INFORMATION_UPDATED_SUCCESS,
  PASSWORD_RESET_LINK_SENT_TO_EMAIL,
  INVALID_CREDENTIALS,
  DRIVER_ENABLED_SUCCESS,
  DRIVER_DISABLED_SUCCESS,
  DRIVER_NOT_FOUND
} from "./../constants/Messages";
import { Md5 } from "md5-typescript";
import { Request, Response, Router } from "express";
import User from "../models/User";
import { USER_ALREADY_EXISTS } from "../constants/Messages";
import BankDetail from "../models/BankDetail";
import School from "../models/School";
import SchoolToUser from "../models/SchoolToUser";
import RideBooking from "../models/RideBooking";
import CarInfo from "../models/CarInfo";
import { AddressOf } from "../constants/AddressOf";
import Address from "../models/Address";
import Document from "../models/Document";
import { UserTypes } from "../constants/UserTypes";
import { UserRoles } from "../constants/UserRoles";
import { Schema } from "mongoose";
import Utils from "../utilities/utils";
import Invoice from "../models/Invoice";
import VehicleData from "../models/VehicleData";
import City from "../models/City";
import State from "../models/State";
import Country from "../models/Country";
// import { async, Promise, reject } from "q";
import { json } from "body-parser";


const nodemailer = require('nodemailer')

// Promise = require('bluebird');


export class SchoolRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
   
  }


  public create(req: Request, res: Response): void {

    const {
      schoolName,
      taxId,
      contactPersonName,
      contactPersonMobileNumber,
      contactPersonEmail,
      facebookLink,
      InstagramLink,
      googleLink,
      twitterLink
    } = req.body;
    const {
      mobileNumber,
      alternativeMobileNumber,
      email,
      password,
      userType,
      userRole,
      countryCode
    } = req.body.user;
    const {
      name,
      addressLineOne,
      addressLineTwo,
      city,
      state,
      pincode,
      country,
      lat,
      long
    } = req.body.address;
    // const {
    //   bankName,
    //   accountNumber,
    //   IFSCCode,
    //   branchName
    // } = req.body.bankDetail;

    const token = Md5.init(req.body.user.email);

    console.log(token);

    User.findOne({ email })
      .then(result => {
        if (result && result._id) {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: EMAIL_ALREADY_EXISTS
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(200)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: EMAIL_ALREADY_EXISTS
            });
        } else {
          const address = new Address({
            name,
            addressLineOne,
            addressLineTwo,
            city,
            state,
            pincode,
            country,
            lat,
            long,
            createdBy: null
          });

          address.save();

          const user = new User({
            mobileNumber,
            countryCode,
            alternativeMobileNumber,
            email,
            password,
            userType,
            userRole,
            token: token,
            addresses: [address._id],
            createdBy: null
          });

          user.save();

          // const bankDetail = new BankDetail({
          //   bankName,
          //   accountNumber,
          //   IFSCCode,
          //   branchName,
          //   createdBy: null
          // });

          // bankDetail.save();

          const school = new School({
            schoolName,
            taxId,
            contactPersonName,
            contactPersonMobileNumber,
            contactPersonEmail,
            facebookLink,
            InstagramLink,
            googleLink,
            twitterLink,
            // bankDetail: bankDetail._id,
            createdBy: null
          });

          school.save();

          const schoolToUser = new SchoolToUser({
            school: school._id,
            user: user._id,
            createdBy: null
          });

          schoolToUser
            .save()
            .then(data => {
               School.find({_id:data['school']}) .then(schoolData =>{

                var locals = {
                  name: schoolData[0]['schoolName'],
                  email: req.body.user.email,
                  subject:"School Registration..!"
                };
     
       
                 Utils.emailSend(locals)
            })
              //recording logs
              let obj = new SchoolRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                message: SCHOOL_REGISTER_SUCCESS
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.SUCCESS,
                message: SCHOOL_REGISTER_SUCCESS
              });
            })
            .catch(error => {
              //recording logs
              let obj = new SchoolRouter();
              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res
                .status(500)
                .json({
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR
                });
            });
        }
      })
      .catch(error => {
        //recording logs
        let obj = new SchoolRouter();
        var resTemp = {
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_REQUEST,
          message: UNKNOW_ERROR + error["message"]
        };
        obj.makeLogs(req, resTemp);
        obj = null;
        //recording logs end
        res
          .status(500)
          .json({
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR
          });
      });
  }

  public login(req: Request, res: Response): void {
    const email = req.body.email;
    const password = req.body.password;

    let token = Md5.init(email);

    if (req.body.email && req.body.password) {
      User.findOne({
        email: email,
        password: password,
        userType: "PORTAL_USER",
        userRole: "SCHOOL_USER"
      })
        .then(data => {
          if (!data || data == null) {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_CREDENTIALS
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_CREDENTIALS
            });
          } else {
            User.findOneAndUpdate(
              { _id: data._id },
              { token: token, updatedBy: data._id, updatedDate: Date.now() }
            )
              .populate("addresses")
              .then(async data1 => {
                let finalResult = {
                  userDetail: data1
                };
                let city = await City.find({
                  value: data1["addresses"][0]["city"]
                }).then(cityData => {
                  return JSON.stringify(cityData);
                });
                let country = await Country.find({
                  value: data1["addresses"][0]["country"]
                }).then(countryData => {
                  return JSON.stringify(countryData);
                });
                let state = await State.find({
                  value: data1["addresses"][0]["state"]
                }).then(stateData => {
                  return JSON.stringify(stateData);
                });
                SchoolToUser.findOne({ user: data1._id })
                  .populate("school")
                  .then(result => {
                    finalResult["schoolDetail"] = result["school"];
                    finalResult["userDetail"]["addresses"][0]["city"] = city;
                    finalResult["userDetail"]["addresses"][0][
                      "country"
                    ] = country;
                    finalResult["userDetail"]["addresses"][0]["state"] = state;
                    //recording logs
                    let obj = new SchoolRouter();
                    var resTemp = {
                      ...responseStatus.SUCCESS,
                      data: finalResult
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res
                      .status(200)
                      .json({ ...responseStatus.SUCCESS, data: finalResult });
                  })
                  .catch(error => {
                    //recording logs
                    let obj = new SchoolRouter();
                    var resTemp = {
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR + error["message"]
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(500).json({
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR
                    });
                  });
              });
          }
        })
        .catch(error => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + error["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
        });
    } else {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_REQUEST,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_REQUEST,
          message: INVALID_REQUEST
        });
    }
  }

  public async driverRideBookings(req: Request, res: Response): void {
    const { token, driverId, startDateTime } = req.body;

    if (
      req.body.token &&
      req.body.driverId &&
      (req.body.startDateTime || true)
    ) {
      let obj = new SchoolRouter();
      let checkTokenResult = await obj.checkToken(token);

      if (!checkTokenResult) {
        //recording logs
        let obj = new SchoolRouter();
        var resTemp = {
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        };
        obj.makeLogs(req, resTemp);
        obj = null;
        //recording logs end
        res.status(200).json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
      } else {
        // { $gt: new Date(startDateTime), $lt: new Date(startDateTime).setDate(new Date(startDateTime).getDate() + 1) } }
        RideBooking.find({
          driverId,
          startDateTime: {
            $gt: new Date(startDateTime),
            $lt: new Date(startDateTime).setDate(
              new Date(startDateTime).getDate() + 1
            )
          }
        })
          .populate("pickUpAddress")

          .then(result => {
            if (result && result.length > 0) {
              //res.status(200).json({ ...responseStatus.SUCCESS, data: result });
              var async = require("async");

              var city = [];
              var country = [];
              var state = [];

              result.forEach(data => {
                city.push(data.pickUpAddress.city);
                state.push(data.pickUpAddress.state);
                country.push(data.pickUpAddress.country);
              });

              async.parallel(
                {
                  city: function(callback) {
                    City.find()
                      .then(x => {
                        //callback(null,x['name']);
                        x.forEach(d => {
                          for (var i = 0; i < city.length; i++) {
                            console.log(
                              "i am city",
                              city[i],
                              "i m data",
                              d.value
                            );
                            if (d.value == city[i]) {
                              city[i] = d["name"];
                            }
                          }
                        });
                        callback(null, true);
                      })
                      .catch(() => {
                        callback(null, false);
                      });
                  },
                  country: function(callback) {
                    Country.find()
                      .then(x => {
                        //callback(null,x['name']);
                        x.forEach(d => {
                          for (var i = 0; i < country.length; i++) {
                            if (d.value == country[i]) {
                              country[i] = d["name"];
                            }
                          }
                        });
                        callback(null, true);
                      })
                      .catch(() => {
                        callback(null, false);
                      });
                  },
                  state: function(callback) {
                    State.find()
                      .then(x => {
                        //callback(null,x['name']);
                        x.forEach(d => {
                          for (var i = 0; i < state.length; i++) {
                            if (d.value == state[i]) {
                              state[i] = d["name"];
                            }
                          }
                        });
                        callback(null, true);
                      })
                      .catch(() => {
                        callback(null, false);
                      });
                  }
                },
                function(err, results) {
                  // results now equals to: results.one: 'abc\n', results.two: 'xyz\n'

                  for (var i = 0; i < result.length; i++) {
                    result[i]["pickUpAddress"]["city"] = city[i];
                  }

                  for (var i = 0; i < result.length; i++) {
                    result[i]["pickUpAddress"]["country"] = country[i];
                  }
                  for (var i = 0; i < result.length; i++) {
                    result[i]["pickUpAddress"]["state"] = state[i];
                  }
                  //recording logs
                  let obj = new SchoolRouter();
                  var resTemp = { ...responseStatus.SUCCESS, data: result };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res
                    .status(200)
                    .json({ ...responseStatus.SUCCESS, data: result });
                }
              );

              // if(result[0]["pickUpAddress"]["city"].length ==0){
              //   result[0]["pickUpAddress"]["city"]= '';
              //   res.status(200).json({ ...responseStatus.SUCCESS, data: result });
              // }else{
              //   City.findOne({"value":result[0]["pickUpAddress"]["city"]}).then((x)=>{
              //    result[0]["pickUpAddress"]["city"] = x['name'];
              //    if(result[0]["pickUpAddress"]["state"].length ==0){
              //     result[0]["pickUpAddress"]["state"] = '';
              //     res.status(200).json({ ...responseStatus.SUCCESS, data: result });
              //    }else{
              //     State.findOne({"value":result[0]["pickUpAddress"]["state"]}).then((y)=>{
              //       result[0]["pickUpAddress"]["state"] = y['name'];
              //       if(result[0]["pickUpAddress"]["country"].length ==0){
              //         result[0]["pickUpAddress"]["country"] = '';
              //         res.status(200).json({ ...responseStatus.SUCCESS, data: result });
              //       }else{
              //         Country.findOne({"value":result[0]["pickUpAddress"]["country"]}).then((z)=>{

              //           result[0]["pickUpAddress"]["country"] = z['name'];
              //           res.status(200).json({ ...responseStatus.SUCCESS, data: result });
              //         });
              //       }
              //     });
              //    }
              //   });
              // }
            } else {
              //recording logs
              let obj = new SchoolRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                message: "Data not found",
                isEmpty: "true"
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.SUCCESS,
                message: "Data not found",
                isEmpty: "true"
              });
            }

            //console.log(result);
          })
          .catch(error => {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR + error["message"]
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            console.log(error);
            res.status(500).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
          });
      }
    } else {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    }
  }

  /**
   * drivers
   */
  public async drivers(req: Request, res: Response): void {
    const { token, schoolId, type } = req.body;

    if (type == "SCHOOL") {
      let obj = new SchoolRouter();
      let checkTokenResult = await obj.checkToken(token);

      if (!checkTokenResult) {
        //recording logs
        let obj = new SchoolRouter();
        var resTemp = {
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        };
        obj.makeLogs(req, resTemp);
        obj = null;
        //recording logs end
        res.status(200).json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
      } else {
        SchoolToUser.aggregate([
          {
            $lookup: {
              from: "ridebookings",
              localField: "user",
              foreignField: "driverId",
              as: "rides"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userDetail"
            }
          },
          {
            $lookup: {
              from: "schools",
              localField: "school",
              foreignField: "_id",
              as: "schoolDetail"
            }
          }
        ])

          .then(result => {
            const finalResult = result.filter(obj => {
              return (
                obj["userDetail"][0] &&
                obj["school"] == schoolId &&
                obj["userDetail"][0]["userType"] == UserTypes.DRIVER &&
                obj["userDetail"][0]["userRole"] == UserRoles.APP_USER
              );
            });
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: finalResult };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({ ...responseStatus.SUCCESS, data: finalResult });
          })
          .catch(error => {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR + error["message"]
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(500)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR
              });
          });
      }
    }
  }

  /**
   * profile
   */
  public async profile(req: Request, res: Response): void {
    const { token } = req.body;

    let obj = new SchoolRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult) {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      User.findOne({ token: token }).then(data => {
        SchoolToUser.findOne({ user: data._id })
          .populate("user")
          .populate({
            path: "user",
            populate: {
              path: "addresses",
              model: "Address"
            }
          })
          .populate("school")
          .populate({
            path: "school",
            populate: {
              path: "bankDetail",
              model: "BankDetail"
            }
          })
          .then(result => {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: result };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          })
          .catch(error => {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR + error["message"]
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(500)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR
              });
          });
      });
    }
  }

  public async driverById(req: Request, res: Response): void {
    const { token, driverId } = req.body;

    if (req.body.driverId) {
      let obj = new SchoolRouter();
      let checkTokenResult = await obj.checkToken(token);

      if (!checkTokenResult) {
        //recording logs
        let obj = new SchoolRouter();
        var resTemp = {
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        };
        obj.makeLogs(req, resTemp);
        obj = null;
        //recording logs end
        res.status(200).json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
      } else {
        User.findOne({
          _id: driverId,
          userType: "DRIVER",
          userRole: "APP_USER"
        })
          .populate("addresses")
          .populate("companions")
          .populate("documents")
          .populate({
            path: "documents",
            populate: {
              path: "documentType",
              model: "DocumentType"
            }
          })
          .then(data => {
            // console.log(data);
            if (!data || data == null) {
              //recording logs
              let obj = new SchoolRouter();
              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_REQUEST
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_REQUEST
              });
            } else {
              let result = data.toJSON();
              CarInfo.findOne({ userId: data._id }).then(resp => {
                result["carInfo"] = resp;
                //recording logs
                let obj = new SchoolRouter();
                var resTemp = { ...responseStatus.SUCCESS, data: result };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(200)
                  .json({ ...responseStatus.SUCCESS, data: result });
              });
            }
          })
          .catch(error => {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR + error["message"]
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(500)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR
              });
          });
      }
    } else {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp1 = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_REQUEST,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp1);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_REQUEST,
          message: INVALID_REQUEST
        });
    }
  }

  public forgotPasswordSendLink(req: Request, res: Response): void {
    const { email } = req.body;

    if (req.body.email) {
      User.findOne({ email, userType: "PORTAL_USER", userRole: "SCHOOL_USER" })
        .then(data => {
          if (data && data._id) {
            let link =
              BaseURL.WEB_BASE_URL +
              "forgot?token=" +
              data["token"] +
              "&email=" +
              data["email"];
            let message =
              "Please click the below link to reset your password.\n" + link;
            let subject = "Forgot Password Link";
            console.log(message);
            Utils.sendSES(email, message, subject).then(sesData => {
              console.log(sesData);
            });
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              message: PASSWORD_RESET_LINK_SENT_TO_EMAIL,
              linkSentTo: email,
              linkWas: message
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: PASSWORD_RESET_LINK_SENT_TO_EMAIL
            });
          } else {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: EMAIL_NOT_EXISTS
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: EMAIL_NOT_EXISTS
              });
          }
        })
        .catch(err => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + err["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
        });
    } else {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_REQUEST,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_REQUEST,
          message: INVALID_REQUEST
        });
    }
  }

  public updatePassword(req: Request, res: Response): void {
    const { email, token, newPassword } = req.body;
    console.log(req.body.newPassword, "NEWpASSWORD");
    if (req.body.email) {
      User.findOneAndUpdate(
        { email, token },
        { $set: { password: newPassword } },
        { new: true }
      )
        .then(data => {
          User.updateOne(
            { _id: data._id },
            { updatedBy: data._id, updatedDate: Date.now() }
          );
          console.log(data, "data3");
          if (data && data._id) {
            console.log(data._id, "_id");
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              message: INFORMATION_UPDATED_SUCCESS,
              data: data
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: INFORMATION_UPDATED_SUCCESS,
              data: data
            });
          } else {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp11 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp11);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_REQUEST
              });
          }
        })
        .catch(err => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + err["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
        });
    } else {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_REQUEST,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_REQUEST,
          message: INVALID_REQUEST
        });
    }
  }

  public async update(req: Request, res: Response): void {
    const { token, mobile, password } = req.body.user;
    const {
      schoolId,
      schoolName,
      taxId,
      contactPersonName,
      contactPersonMobileNumber,
      contactPersonEmail,
      facebookLink,
      InstagramLink,
      googleLink,
      twitterLink
    } = req.body.school;
    const {
      bankDetailId,
      bankName,
      accountNumber,
      IFSCCode,
      branchName
    } = req.body.bankDetail;
    const {
      addressId,
      name,
      addressLineOne,
      addressLineTwo,
      city,
      state,
      pincode,
      country,
      lat,
      long
    } = req.body.address;
    let obj = new SchoolRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetail = UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      User.findOneAndUpdate(
        { token },
        { password, mobile, updatedBy: userDetail._id, updatedDate: Date.now() }
      )
        .then(data => {
          if (data && data._id) {
            School.findOneAndUpdate(
              { _id: schoolId },
              {
                schoolName,
                taxId,
                contactPersonName,
                contactPersonMobileNumber,
                contactPersonEmail,
                facebookLink,
                InstagramLink,
                googleLink,
                twitterLink,
                updatedBy: userDetail._id,
                updatedDate: Date.now()
              }
            )
              .then(resp => {
                Address.findOneAndUpdate(
                  { _id: addressId },
                  {
                    name,
                    addressLineOne,
                    addressLineTwo,
                    city,
                    state,
                    pincode,
                    country,
                    lat,
                    long,
                    updatedBy: userDetail._id,
                    updatedDate: Date.now()
                  }
                ).then(() => {
                  if (resp && resp._id) {
                    BankDetail.findOneAndUpdate(
                      { _id: bankDetailId },
                      {
                        bankName,
                        accountNumber,
                        IFSCCode,
                        branchName,
                        updatedBy: userDetail._id,
                        updatedDate: Date.now()
                      }
                    )
                      .then(resp => {
                        //recording logs
                        let obj = new SchoolRouter();
                        var resTemp = {
                          ...responseStatus.SUCCESS,
                          message: INFORMATION_UPDATED_SUCCESS
                        };
                        obj.makeLogs(req, resTemp);
                        obj = null;
                        //recording logs end
                        res.status(200).json({
                          ...responseStatus.SUCCESS,
                          message: INFORMATION_UPDATED_SUCCESS
                        });
                      })
                      .catch(err => {
                        //recording logs
                        let obj = new SchoolRouter();
                        var resTemp = {
                          ...responseStatus.FAILURE,
                          errorCode: ErrorCodes.INVALID_REQUEST,
                          message: UNKNOW_ERROR + err["message"]
                        };
                        obj.makeLogs(req, resTemp);
                        obj = null;
                        //recording logs end
                        res.status(500).json({
                          ...responseStatus.FAILURE,
                          errorCode: ErrorCodes.INVALID_REQUEST,
                          message: UNKNOW_ERROR
                        });
                      });
                  } else {
                    //recording logs
                    let obj = new SchoolRouter();
                    var resTemp = {
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: INVALID_REQUEST
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(200).json({
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: INVALID_REQUEST
                    });
                  }
                });
              })
              .catch(err => {
                //recording logs
                let obj = new SchoolRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + err["message"]
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(500)
                  .json({
                    ...responseStatus.FAILURE,
                    errorCode: ErrorCodes.INVALID_REQUEST,
                    message: UNKNOW_ERROR
                  });
              });
          } else {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_REQUEST
              });
          }
        })
        .catch(err => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + err["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
        });
    }
  }

  public async paymentHistory(req: Request, res: Response): void {
    const { token, schoolId } = req.body;

    let obj = new SchoolRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult) {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      Invoice.find({ driverId: schoolId })
        .then(result => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = { ...responseStatus.SUCCESS, data: result };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        })
        .catch(err => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + err["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
        });
    }
  }

  /**
   * totalEarning
   */
  public async totalEarning(req: Request, res: Response): void {
    const { token, months, type } = req.body;

    let obj = new SchoolRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult) {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      let d = new Date();
      d.setMonth(d.getMonth() - months);
      console.log(d);
      User.findOne({ token })
        .then(data => {
          if (data && data._id) {
            Invoice.aggregate([
              {
                $match: { driverId: data._id }
              },
              {
                $group: {
                  _id: "",
                  total: { $sum: "$amount" }
                }
              }
            ])
              .then(resp => {
                console.log(resp, data._id, new Date(), d);
                let id = data._id;
                if (type == "WEEK") {
                  Invoice.aggregate([
                    {
                      $project: {
                        driverId: "$driverId",
                        createdDate: "$createdDate",
                        year: { $year: "$createdDate" },
                        week: { $week: "$createdDate" },
                        amount: "$amount"
                      }
                    },
                    {
                      $match: {
                        driverId: id,
                        createdDate: { $gt: d, $lt: new Date() }
                      }
                    },
                    {
                      $group: {
                        _id: {
                          week: "$week",
                          year: "$year"
                        },
                        total: { $sum: "$amount" }
                      }
                    }
                  ])
                    .then(result => {
                      console.log(result);
                      let total =
                        resp[0] && resp[0]["total"] ? resp[0]["total"] : 0;
                      //recording logs
                      let obj = new SchoolRouter();
                      var resTemp = {
                        ...responseStatus.SUCCESS,
                        data: result,
                        total: total
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(200).json({
                        ...responseStatus.SUCCESS,
                        data: result,
                        total: total
                      });
                    })
                    .catch(err => {
                      console.log(err);
                      //recording logs
                      let obj = new SchoolRouter();
                      var resTemp = {
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNKNOW_ERROR + err["message"]
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(500).json({
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNKNOW_ERROR
                      });
                    });
                } else {
                  Invoice.aggregate([
                    {
                      $project: {
                        driverId: "$driverId",
                        createdDate: "$createdDate",
                        year: { $year: "$createdDate" },
                        month: { $month: "$createdDate" },
                        amount: "$amount"
                      }
                    },
                    {
                      $match: {
                        driverId: id,
                        createdDate: { $gt: d, $lt: new Date() }
                      }
                    },
                    {
                      $group: {
                        _id: {
                          month: "$month",
                          year: "$year"
                        },
                        total: { $sum: "$amount" }
                      }
                    }
                  ])
                    .then(result => {
                      console.log(result);
                      let total =
                        resp[0] && resp[0]["total"] ? resp[0]["total"] : 0;
                      //recording logs
                      let obj = new SchoolRouter();
                      var resTemp = {
                        ...responseStatus.SUCCESS,
                        data: result,
                        total: total
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(200).json({
                        ...responseStatus.SUCCESS,
                        data: result,
                        total: total
                      });
                    })
                    .catch(err => {
                      console.log("2", err);
                      //recording logs
                      let obj = new SchoolRouter();
                      var resTemp = {
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNKNOW_ERROR + err["message"]
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(500).json({
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNKNOW_ERROR
                      });
                    });
                }
              })
              .catch(err => {
                console.log("1", err);
                //recording logs
                let obj = new SchoolRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + err["message"]
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(500).json({
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR
                });
              });
          } else {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_REQUEST
              });
          }
        })
        .catch(err => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + err["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          console.log(err);
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR + " 1"
            });
        });
    }
  }

  /**
   * totalLesson
   */

  public async totalLesson(req: Request, res: Response): void {
    const { token, months, type } = req.body;

    let obj = new SchoolRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult) {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      let d = new Date();
      d.setMonth(d.getMonth() - months);
      console.log(d);
      User.findOne({ token })
        .then(data => {
          if (data && data._id) {
            let drivers = [];

            SchoolToUser.findOne({ user: data._id })
              .then(respo => {
                if (respo && respo._id) {
                  SchoolToUser.find({ school: respo["school"] })
                    .then(respon => {
                      if (respon.length == 0) {
                        //recording logs
                        let obj = new SchoolRouter();
                        var resTemp = {
                          ...responseStatus.SUCCESS,
                          data: [],
                          total: 0
                        };
                        obj.makeLogs(req, resTemp);
                        obj = null;
                        //recording logs end
                        res.status(200).json({
                          ...responseStatus.SUCCESS,
                          data: [],
                          total: 0
                        });
                      } else {
                        for (let i = 0; i < respon.length; i++) {
                          drivers.push(respon[i]["user"]);
                          if (i == respon.length - 1) {
                            RideBooking.aggregate([
                              {
                                $match: { driverId: { $in: drivers } }
                              },
                              {
                                $group: {
                                  _id: "",
                                  count: { $sum: 1 }
                                }
                              }
                            ])
                              .then(resp => {
                                console.log(resp, data._id, new Date(), d);
                                let id = data._id;
                                if (resp && resp[0] && resp[0]["count"]) {
                                  if (type == "WEEK") {
                                    RideBooking.aggregate([
                                      {
                                        $project: {
                                          driverId: "$driverId",
                                          startDateTime: "$startDateTime",
                                          endDateTime: "$endDateTime",
                                          year: { $year: "$endDateTime" },
                                          week: { $week: "$endDateTime" }
                                        }
                                      },
                                      {
                                        $match: {
                                          driverId: { $in: drivers },
                                          startDateTime: {
                                            $gt: d,
                                            $lt: new Date()
                                          },
                                          endDateTime: {
                                            $gt: d,
                                            $lt: new Date()
                                          }
                                        }
                                      },
                                      {
                                        $group: {
                                          _id: {
                                            week: "$week",
                                            year: "$year"
                                          },
                                          count: { $sum: 1 }
                                        }
                                      }
                                    ])
                                      .then(result => {
                                        console.log(result);
                                        //recording logs
                                        let obj = new SchoolRouter();
                                        var resTemp = {
                                          ...responseStatus.SUCCESS,
                                          data: result,
                                          total: resp[0]["count"]
                                        };
                                        obj.makeLogs(req, resTemp);
                                        obj = null;
                                        //recording logs end
                                        res.status(200).json({
                                          ...responseStatus.SUCCESS,
                                          data: result,
                                          total: resp[0]["count"]
                                        });
                                      })
                                      .catch(err => {
                                        //recording logs
                                        let obj = new SchoolRouter();
                                        var resTemp = {
                                          ...responseStatus.FAILURE,
                                          errorCode: ErrorCodes.INVALID_REQUEST,
                                          message: UNKNOW_ERROR + err["message"]
                                        };
                                        obj.makeLogs(req, resTemp);
                                        obj = null;
                                        //recording logs end
                                        res.status(500).json({
                                          ...responseStatus.FAILURE,
                                          errorCode: ErrorCodes.INVALID_REQUEST,
                                          message: UNKNOW_ERROR
                                        });
                                      });
                                  } else {
                                    RideBooking.aggregate([
                                      {
                                        $project: {
                                          driverId: "$driverId",
                                          startDateTime: "$startDateTime",
                                          endDateTime: "$endDateTime",
                                          year: { $year: "$endDateTime" },
                                          month: { $month: "$endDateTime" }
                                        }
                                      },
                                      {
                                        $match: {
                                          driverId: { $in: drivers },
                                          startDateTime: {
                                            $gt: d,
                                            $lt: new Date()
                                          },
                                          endDateTime: {
                                            $gt: d,
                                            $lt: new Date()
                                          }
                                        }
                                      },
                                      {
                                        $group: {
                                          _id: {
                                            month: "$month",
                                            year: "$year"
                                          },
                                          count: { $sum: 1 }
                                        }
                                      }
                                    ])
                                      .then(result => {
                                        console.log(result);
                                        //recording logs
                                        let obj = new SchoolRouter();
                                        var resTemp = {
                                          ...responseStatus.SUCCESS,
                                          data: result,
                                          total: resp[0]["count"]
                                        };
                                        obj.makeLogs(req, resTemp);
                                        obj = null;
                                        //recording logs end
                                        res.status(200).json({
                                          ...responseStatus.SUCCESS,
                                          data: result,
                                          total: resp[0]["count"]
                                        });
                                      })
                                      .catch(err => {
                                        //recording logs
                                        let obj = new SchoolRouter();
                                        var resTemp = {
                                          ...responseStatus.FAILURE,
                                          errorCode: ErrorCodes.INVALID_REQUEST,
                                          message: UNKNOW_ERROR + err["message"]
                                        };
                                        obj.makeLogs(req, resTemp);
                                        obj = null;
                                        //recording logs end
                                        res.status(500).json({
                                          ...responseStatus.FAILURE,
                                          errorCode: ErrorCodes.INVALID_REQUEST,
                                          message: UNKNOW_ERROR
                                        });
                                      });
                                  }
                                } else {
                                  //recording logs
                                  let obj = new SchoolRouter();
                                  var resTemp = {
                                    ...responseStatus.SUCCESS,
                                    data: [],
                                    total: 0
                                  };
                                  obj.makeLogs(req, resTemp);
                                  obj = null;
                                  //recording logs end
                                  res.status(200).json({
                                    ...responseStatus.SUCCESS,
                                    data: [],
                                    total: 0
                                  });
                                }
                              })
                              .catch(err => {
                                //recording logs
                                let obj = new SchoolRouter();
                                var resTemp = {
                                  ...responseStatus.FAILURE,
                                  errorCode: ErrorCodes.INVALID_REQUEST,
                                  message: UNKNOW_ERROR + err["message"]
                                };
                                obj.makeLogs(req, resTemp);
                                obj = null;
                                //recording logs end
                                res.status(500).json({
                                  ...responseStatus.FAILURE,
                                  errorCode: ErrorCodes.INVALID_REQUEST,
                                  message: UNKNOW_ERROR
                                });
                              });
                          }
                        }
                      }
                    })
                    .catch(err => {
                      //recording logs
                      let obj = new SchoolRouter();
                      var resTemp = {
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNKNOW_ERROR + err["message"]
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(500).json({
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNKNOW_ERROR
                      });
                    });
                } else {
                  //recording logs
                  let obj = new SchoolRouter();
                  var resTemp = {
                    ...responseStatus.FAILURE,
                    errorCode: ErrorCodes.INVALID_REQUEST,
                    message: INVALID_REQUEST
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({
                    ...responseStatus.FAILURE,
                    errorCode: ErrorCodes.INVALID_REQUEST,
                    message: INVALID_REQUEST
                  });
                }
              })
              .catch(err => {
                //recording logs
                let obj = new SchoolRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + err["message"]
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(500)
                  .json({
                    ...responseStatus.FAILURE,
                    errorCode: ErrorCodes.INVALID_REQUEST,
                    message: UNKNOW_ERROR
                  });
              });
          } else {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: INVALID_REQUEST
            });
          }
        })
        .catch(err => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + err["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          console.log(err);
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
        });
    }
  }

  public async colleagueLocationData(req: Request, res: Response): void {
    const { token, driverId } = req.body;

    let obj = new SchoolRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult && driverId == undefined) {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      User.findOne({
        _id: driverId,
        userType: UserTypes.DRIVER,
        userRole: UserRoles.APP_USER
      })
        .then(result => {
          if (result && result._id) {
            SchoolToUser.findOne({ user: result._id })
              .then(resp => {
                SchoolToUser.find({ school: resp["school"] })
                  .then(records => {
                    let users = [];
                    for (let i = 0; i < records.length; i++) {
                      users.push(records[i]["user"]);
                      if (i == records.length - 1) {
                        VehicleData.find({
                          user: { $in: users },
                          dataType: LatLongTypes.MOBILE
                        })
                          .then(data => {
                            //recording logs
                            let obj = new SchoolRouter();
                            var resTemp = {
                              ...responseStatus.SUCCESS,
                              data: data
                            };
                            obj.makeLogs(req, resTemp);
                            obj = null;
                            //recording logs end
                            res
                              .status(200)
                              .json({ ...responseStatus.SUCCESS, data: data });
                          })
                          .catch(err => {
                            //recording logs
                            let obj = new SchoolRouter();
                            var resTemp = {
                              ...responseStatus.FAILURE,
                              errorCode: ErrorCodes.INVALID_REQUEST,
                              message: UNKNOW_ERROR + err["message"]
                            };
                            obj.makeLogs(req, resTemp);
                            obj = null;
                            //recording logs end
                            res.status(500).json({
                              ...responseStatus.FAILURE,
                              errorCode: ErrorCodes.INVALID_REQUEST,
                              message: UNKNOW_ERROR
                            });
                          });
                      }
                    }
                  })
                  .catch(err => {
                    //recording logs
                    let obj = new SchoolRouter();
                    var resTemp = {
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR + err["message"]
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(500).json({
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR
                    });
                  });
              })
              .catch(err => {
                //recording logs
                let obj = new SchoolRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + err["message"]
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(500)
                  .json({
                    ...responseStatus.FAILURE,
                    errorCode: ErrorCodes.INVALID_REQUEST,
                    message: UNKNOW_ERROR
                  });
              });
          } else {
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_REQUEST
              });
          }
        })
        .catch(err => {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR + err["message"]
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(500)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: UNKNOW_ERROR
            });
        });
    }
  }

  public async enableDisableDriver(req: Request, res: Response) {
    const { driverId, token, schoolId } = req.body;
    var obj = new SchoolRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

    if (!checkTokenResult) {
      //recording logs
      let obj = new SchoolRouter();
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      SchoolToUser.find({ school: schoolId }).then(async schoolToUserData => {
        let check = schoolToUserData.filter(item => {
          if (item["user"] == driverId) {
            return true;
          }
        });

        if (check.length > 0 && driverId != userDetails._id) {
          var message = "";
          let data = await UserDetails.getUserDetails(driverId);
          if (data["isArchived"]) {
            User.updateOne(
              { _id: driverId },
              {
                isArchived: false,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            ).then(() => {});

            message = DRIVER_ENABLED_SUCCESS;
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = { ...responseStatus.SUCCESS, message: message };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: message
            });
          } else {
            User.updateOne(
              { _id: driverId },
              {
                isArchived: true,
                token: "",
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            ).then(() => {});

            message = DRIVER_DISABLED_SUCCESS;
            //recording logs
            let obj = new SchoolRouter();
            var resTemp = { ...responseStatus.SUCCESS, message: message };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: message
            });
          }
        } else {
          //recording logs
          let obj = new SchoolRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: DRIVER_NOT_FOUND
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: DRIVER_NOT_FOUND
          });
        }
      });
    }
  }

  //token checking
  private checkToken(token) {
    return new Promise(resolve => {
      if ((token != undefined || token != null) && token.length > 0) {
        var query = {
          token,
          userType: UserTypes.PORTAL_USER,
          userRole: UserRoles.SCHOOL_USER
        };

        User.findOne(query).then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new SchoolRouter();
            var resTemp = "checking token fails.";
            // obj.makeLogs(token, resTemp);
            obj = null;
            //recordins logs ends
            resolve(false);
          } else {
            //recording logs
            var obj = new SchoolRouter();
            var resTemp = "checking token succeed.";
            // obj.makeLogs(token, resTemp);
            obj = null;
            //recordins logs ends
            resolve(true);
          }
        });
      } else {
        //recording logs
        var obj = new SchoolRouter();
        var resTemp = "checking token fails.";
        //obj.makeLogs(token, resTemp);
        obj = null;
        //recordins logs ends
        resolve(false);
      }
    });
  }

  // set up our routes
  public routes() {
    this.router.post("/enableDisableDriver", this.enableDisableDriver);
    this.router.post("/create", this.create);
    this.router.post("/login", this.login);
    this.router.post("/driverRideBookings", this.driverRideBookings);
    this.router.post("/drivers", this.drivers);
    this.router.post("/profile", this.profile);
    this.router.post("/driverById", this.driverById);
    this.router.post("/forgotPasswordSendLink", this.forgotPasswordSendLink);
    this.router.post("/updatePassword", this.updatePassword);
    this.router.post("/update", this.update);
    this.router.post("/paymentHistory", this.paymentHistory);
    this.router.post("/totalEarning", this.totalEarning);
    this.router.post("/totalLesson", this.totalLesson);
    this.router.post("/colleagueLocationData", this.colleagueLocationData);
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

    var fileName = "SchoolRouter" + d + "-" + (m + 1) + "-" + y + ".txt";

    var logStream = fs.createWriteStream("logs/" + fileName, { flags: "a" });
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write(message + "\n");
    logStream.end("this is the end line \n");
  }
}

const schoolRouter = new SchoolRouter();
schoolRouter.routes();

export default schoolRouter.router;
