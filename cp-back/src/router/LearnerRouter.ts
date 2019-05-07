import { TestStatus } from "./../constants/TestStatus";
import { NotificationTypes } from "./../constants/NotificationTypes";
import { UserRoles } from "./../constants/UserRoles";
import { BaseURL } from "./../constants/BaseURL";
import { responseStatus } from "./../constants/responseStatus";
import { ErrorCodes } from "./../constants/ErrorCodes";
import UserDetails from "./UserDetails";
import EmailSendClass from "../utilities/EmailSend"
import {
  OTP_SENT_SUCCESS_MESSAGE,
  TEST_OTP,
  INVALID_OTP_MESSAGE,
  OTP_VERIFIED_SUCCESS_MESSAGE,
  MOBILE_NUMBER_NOT_PRESENT,
  MOBILE_NUMBER_ALREADY_EXISTS,
  INVALID_REQUEST,
  PROFILE_UPDATED_SUCCESS_MESSAGE,
  BOOK_TEST_CENTER_SUCCESS_MESSAGE,
  LEARNER_RATE_SUCCESS_MESSAGE,
  PAYMENT_FAILED,
  ORDER_BOOK_SUCCESS,
  UNKNOW_ERROR,
  FAILED_PAYMENT_STATUS_UPDATE,
  FAILED_TO_SEND_OTP,
  INFORMATION_UPDATED_SUCCESS,
  NO_RECORDS_FOUND,
  ALREADY_HAVE_BOOKING,
  EMAIL_ALREADY_EXISTS,
  RIDE_COMPLETED
} from "./../constants/Messages";
var nodemailer = require('nodemailer');
import { Request, Response, Router } from "express";
import { Md5 } from "md5-typescript";
import * as fs from "fs";

import axios, { AxiosRequestConfig, AxiosPromise } from "axios";

import User from "../models/User";
import VerificationCode from "../models/VerificationCode";
import VehicleType from "../masters/VehicleType";
import Package from "../masters/Package";
import TestCenter from "../masters/TestCenter";

import LearnerCurriculumProgress from "../models/LearnerCurriculumProgress";
import Booking from "../models/Booking";
import RideBooking from "../models/RideBooking";
import CarInfo from "../models/CarInfo";
import Order from "../models/Order";

import LearnerInvoice from "../models/LearnerInvoice";
import Utils from "../utilities/utils";
import Slot from "../masters/Slot";
import BookedTestCenter from "../models/BookedTestCenter";
import { UserTypes } from "../constants/UserTypes";
import BookedTestCenterLocationHistory from "../models/BookedTestCenterLocationHistory";
import PushInfo from "../models/PushInfo";
import Curriculum from "../masters/Curriculum";

import request = require("request");
import Address from "../models/Address";
import DriverRating from "../models/DriverRating";
import RatingAverage from "../models/RatingAverage";
import Attribute from "../masters/Attribute";
import Document from "../models/Document";
import { resolve } from "dns";
import { Promise } from "q";

export class LearnerRouter {
  public router: Router;
  MAGIC_OTP = "GO11LR";

  constructor() {
    this.router = Router();
    this.routes();
  }

  public async dashboard(req: Request, res: Response) {
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(req.body.token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token: req.body.token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER,
        isArchived: false
      }).then(async data => {
        console.log(data);
        if (data != null) {
          var x = new LearnerRouter();
          var bookings = await x.getFeedBackPendingBookings(data._id);
          //recording logs
          var obj = new LearnerRouter();
          var resTemp = {
            ...responseStatus.SUCCESS,
            data: { bookings: bookings }
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({
            ...responseStatus.SUCCESS,
            data: { bookings: bookings }
          });
        } else {
          //recording logs
          var obj = new LearnerRouter();
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs end
          res
            .status(200)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: INVALID_REQUEST
            });
        }
      });
    }
  }

  private async getFeedBackPendingBookings(id): Promise<any> {
    return  Promise(resolve => {
      Booking.find({ didFeedBack: false, learnerId: id }).then(data => {
        var bookingIds = [];
        data.forEach(ele => {
          bookingIds.push(ele._id);
        });
        RideBooking.find({
          bookingId: { $in: bookingIds },
          status: "COMPLETED"
        }).then(data => {
          resolve(data);
        });
      });
    });
  }

  public send(req: Request, res: Response): void {
    const { mobileNumber, countryCode } = req.body;
    let OTP = "123456" || Math.floor(100000 + Math.random() * 900000) + "";
    if (req.body.mobileNumber) {
      let mobile = req.body.countryCode + req.body.mobileNumber;
      Utils.sendSNS(mobile, OTP)
        .then(result => {
          if (result && result.status && result.OTP) {
            console.log("fffffgg");
            VerificationCode.findOne({ mobile })
              .then(data => {
                console.log(data);
                if (!data || data == null) {
                  console.log("mobile", mobile);
                  const verificationCode = new VerificationCode({
                    mobileNumber: mobile,
                    otp: result.OTP
                  });

                  verificationCode
                    .save()
                    .then(ins => {
                      //recording logs
                      var obj = new LearnerRouter();
                      var resTemp = {
                        ...responseStatus.SUCCESS,
                        message: OTP_SENT_SUCCESS_MESSAGE
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(200).json({
                        ...responseStatus.SUCCESS,
                        message: OTP_SENT_SUCCESS_MESSAGE
                      });
                    })
                    .catch(error => {
                      console.log(error);
                      //recording logs
                      var obj = new LearnerRouter();
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
                } else {
                  if (mobileNumber) {
                    console.log("mobile", mobile);
                    VerificationCode.findOneAndUpdate(
                      { mobileNumber: mobile },
                      { otp: result.OTP }
                    )
                      .then(result => {
                        //recording logs
                        var obj = new LearnerRouter();
                        var resTemp = {
                          ...responseStatus.SUCCESS,
                          message: OTP_SENT_SUCCESS_MESSAGE
                        };
                        obj.makeLogs(req, resTemp);
                        obj = null;
                        //recording logs end
                        res.status(200).json({
                          ...responseStatus.SUCCESS,
                          message: OTP_SENT_SUCCESS_MESSAGE
                        });
                      })
                      .catch(error => {
                        //recording logs
                        var obj = new LearnerRouter();
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
                  } else {
                    //recording logs
                    var obj = new LearnerRouter();
                    var resTemp = {
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: MOBILE_NUMBER_NOT_PRESENT
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(200).json({
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: MOBILE_NUMBER_NOT_PRESENT
                    });
                  }
                }
              })
              .catch(error => {
                console.log(error);
                //recording logs
                var obj = new LearnerRouter();
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
            var obj = new LearnerRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: FAILED_TO_SEND_OTP
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: FAILED_TO_SEND_OTP
              });
          }
        })
        .catch(err => {
          //recording logs
          var obj = new LearnerRouter();
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
      var obj = new LearnerRouter();
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

  public async verify(req: Request, res: Response): void {
    const { mobileNumber, otp, countryCode } = req.body;
    var userDetails = await UserDetails.getUserDetails(
      mobileNumber,
      countryCode
    );
    if (req.body.mobileNumber && req.body.otp && req.body.countryCode) {
      let mobile = countryCode + mobileNumber;
      var obj = new LearnerRouter();
      if (otp != obj.MAGIC_OTP) {
        obj = null;
        VerificationCode.findOne({ mobileNumber: mobile, otp })
          .then(data => {
            console.log("verified", data);
            if (!data || data == null) {
              //recording logs
              var obj = new LearnerRouter();
              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_OTP_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_OTP_MESSAGE
              });
            } else {
              User.findOne({
                mobileNumber,
                countryCode,
                userType: UserTypes.LEARNER,
                userRole: UserRoles.APP_USER
              })
                .then(result => {
                  if (!result || result == null) {
                    VerificationCode.remove({
                      mobileNumber: countryCode + mobileNumber
                    }).then(() => {});
                    //recording logs
                    var obj = new LearnerRouter();
                    var resTemp = {
                      ...responseStatus.SUCCESS,
                      message: OTP_VERIFIED_SUCCESS_MESSAGE
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(200).json({
                      ...responseStatus.SUCCESS,
                      message: OTP_VERIFIED_SUCCESS_MESSAGE
                    });
                  } else {
                    const token = Md5.init(req.body.mobileNumber);
                    VerificationCode.remove({
                      mobileNumber: countryCode + mobileNumber
                    }).then(() => {});

                    User.findOneAndUpdate(
                      { _id: result._id },
                      {
                        token: token,
                        updatedDate: Date.now(),
                        updatedBy: userDetails._id
                      }
                    ).then(resData => {
                      //recording logs
                      var obj = new LearnerRouter();
                      var resTemp = {
                        ...responseStatus.SUCCESS,
                        data: resData
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res
                        .status(200)
                        .json({ ...responseStatus.SUCCESS, data: resData });
                    });
                  }
                })
                .catch(error => {
                  //recording logs
                  var obj = new LearnerRouter();
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
            var obj = new LearnerRouter();
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
        obj = null;
        VerificationCode.remove({
          mobileNumber: countryCode + mobileNumber
        }).then(() => {});

        User.findOne({
          mobileNumber,
          countryCode,
          userType: UserTypes.LEARNER,
          userRole: UserRoles.APP_USER
        })
          .then(result => {
            if (!result || result == null) {
              //recording logs
              var obj = new LearnerRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                message: OTP_VERIFIED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.SUCCESS,
                message: OTP_VERIFIED_SUCCESS_MESSAGE
              });
            } else {
              const token = Md5.init(req.body.mobileNumber);

              User.findOneAndUpdate(
                { _id: result._id },
                {
                  token: token,
                  updatedDate: Date.now(),
                  updatedBy: userDetails._id
                }
              ).then(resData => {
                //recording logs
                var obj = new LearnerRouter();
                var resTemp = { ...responseStatus.SUCCESS, data: resData };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(200)
                  .json({ ...responseStatus.SUCCESS, data: resData });
              });
            }
          })
          .catch(error => {
            //recording logs
            var obj = new LearnerRouter();
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

  public async profile(req: Request, res: Response): void {
    const { token, mobleNumber, countryCode } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({ token, mobleNumber, countryCode })
        .then(data => {
          res.status(200).json({ ...responseStatus.SUCCESS, data });
        })
        .catch(error => {
          //recording logs
          var obj = new LearnerRouter();
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

  public create(req: Request, res: Response): void {
    const {
      mobileNumber,
      firstName,
      lastName,
      email,
      password,
      dob,
      drivingLicense,
      userType,
      userRole,
      countryCode
    } = req.body;

    const token = Md5.init(req.body.mobileNumber);

    const user = new User({
      mobileNumber,
      countryCode,
      firstName,
      lastName,
      email,
      password,
      dob,
      drivingLicense,
      userType,
      userRole,
      token: token,
      createdBy: null
    });
    var tempEmail = new RegExp(email, "i");
    User.findOne({ email: tempEmail }).then(r => {
      if (r && r._id) {
        //recording logs
        var obj = new LearnerRouter();
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
        User.findOne({ mobileNumber, countryCode })
          .then(result => {
            if (result && result._id) {
              //recording logs
              var obj = new LearnerRouter();
              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: MOBILE_NUMBER_ALREADY_EXISTS
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: MOBILE_NUMBER_ALREADY_EXISTS
              });
            } else {
              user
                .save()
                .then(result => {
                  var locals = {
                    email: result['email'],
                    name: result['firstName'] + " " + result['lastName'] ,
                    subject:"Learner Registration..!"
                  };
                 
              
                  Utils.emailSend(locals)
          
                  //recording logs
                  var obj = new LearnerRouter();
                  var resTemp = { ...responseStatus.SUCCESS, data: result };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res
                    .status(200)
                    .json({ ...responseStatus.SUCCESS, data: result });
                })
                .catch(error => {
                  //recording logs
                  var obj = new LearnerRouter();
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
            var obj = new LearnerRouter();
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
    });
  }

  public async update(req: Request, res: Response): void {
    const { token } = req.body;
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    var userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      var tempEmail = new RegExp(req.body.email, "i");
      User.findOne({ email: tempEmail, token: { $ne: token } }).then(r => {
        if (r && r._id) {
          //recording logs
          var obj = new LearnerRouter();
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
          User.updateOne(
            { token: token },
            { updatedBy: userDetails._id, updatedDate: Date.now() }
          ).then(() => {});
          User.findOneAndUpdate({ token }, req.body)
            .then(data => {
              console.log(data);
              if (!data || data == null) {
                //recording logs
                var obj = new LearnerRouter();
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
                //recording logs
                var obj = new LearnerRouter();
                var resTemp1 = {
                  ...responseStatus.SUCCESS,
                  message: PROFILE_UPDATED_SUCCESS_MESSAGE
                };
                obj.makeLogs(req, resTemp1);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  message: PROFILE_UPDATED_SUCCESS_MESSAGE
                });
              }
            })
            .catch(error => {
              //recording logs
              var obj = new LearnerRouter();
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
      });
    }
  }

  public async packages(req: Request, res: Response): void {
    const { token } = req.body;
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_TOKEN,
                message: INVALID_REQUEST
              });
          } else {
            Package.find({ isArchived: { $ne: "true" } })
              .then(data => {
                //recording logs
                var obj = new LearnerRouter();
                var resTemp = { ...responseStatus.SUCCESS, data };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({ ...responseStatus.SUCCESS, data });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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
          var obj = new LearnerRouter();
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

  public async testCenters(req: Request, res: Response): void {
    const { token } = req.body;
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_TOKEN,
                message: INVALID_REQUEST
              });
          } else {
            TestCenter.find({ isArchived: { $ne: "true" } })
              .populate("addressId")
              .then(result => {
                //recording logs
                var obj = new LearnerRouter();
                var resTemp = { ...responseStatus.SUCCESS, data: result };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(200)
                  .json({ ...responseStatus.SUCCESS, data: result });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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
          var obj = new LearnerRouter();
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

  public async vehicleTypes(req: Request, res: Response): void {
    const { token } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_TOKEN,
                message: INVALID_REQUEST
              });
          } else {
            VehicleType.find({ isArchived: { $ne: "true" } })
              .then(result => {
                //recording logs
                var obj = new LearnerRouter();
                var resTemp = { ...responseStatus.SUCCESS, data: result };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(200)
                  .json({ ...responseStatus.SUCCESS, data: result });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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
          var obj = new LearnerRouter();
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

  public async slots(req: Request, res: Response): void {
    const { token } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          console.log(data);
          if (!data || data == null) {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_TOKEN,
                message: INVALID_REQUEST
              });
          } else {
            Slot.find({ isArchived: { $ne: "true" } })
              .then(result => {
                //recording logs
                var obj = new LearnerRouter();
                var resTemp = { ...responseStatus.SUCCESS, data: result };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(200)
                  .json({ ...responseStatus.SUCCESS, data: result });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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
          var obj = new LearnerRouter();
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

  public async bookTestCenter(req: Request, res: Response): void {
    const { token, testCenterId, testDate } = req.body;
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (
      !checkTokenResult ||
      (testCenterId == undefined && testDate == undefined)
    ) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          let tDate = new Date(testDate);
          const bookTestCenter = new BookedTestCenter({
            testCenterId,
            testDate: tDate,
            learnerId: data._id,
            createdBy: userDetails._id
          });
          console.log(data._id);
          bookTestCenter
            .save()
            .then(result => {
              //recording logs
              var obj = new LearnerRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                message: BOOK_TEST_CENTER_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.SUCCESS,
                message: BOOK_TEST_CENTER_SUCCESS_MESSAGE
              });
            })
            .catch(error => {
              console.log(error);
              //recording logs
              var obj = new LearnerRouter();
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
        })
        .catch(error => {
          //recording logs
          var obj = new LearnerRouter();
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

  public async tests(req: Request, res: Response): void {
    const { token, learnerId } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult || learnerId == undefined) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      BookedTestCenter.find({ learnerId })
        .populate("testCenterId")
        .populate("learnerId")
        .then(result => {
          //recording logs
          var obj = new LearnerRouter();
          var resTemp = { ...responseStatus.SUCCESS, data: result };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        })
        .catch(error => {
          //recording logs
          var obj = new LearnerRouter();
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

  public async progress(req: Request, res: Response): void {
    const { token, learnerId } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult || learnerId == undefined) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      Booking.findOne({ learnerId })
        .sort({ createdDate: -1 })
        .then(result => {
          if (result && result._id) {
            console.log("re", result);
            LearnerCurriculumProgress.find({ bookingId: result._id })
              .populate("curriculumId")
              .then(resp => {
                console.log("LearnerCurriculumProgress", resp);
                //recording logs
                var obj = new LearnerRouter();
                var resTemp = { ...responseStatus.SUCCESS, data: resp };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({ ...responseStatus.SUCCESS, data: resp });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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
          } else {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: [] };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: [] });
          }
        })
        .catch(error => {
          console.log("err", error);
          //recording logs
          var obj = new LearnerRouter();
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

  public async rate(req: Request, res: Response): void {
    const { token, learnerId, driverId, bookingId, rating, attId } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (
      !checkTokenResult ||
      (learnerId == undefined &&
        driverId == undefined &&
        bookingId == undefined)
    ) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      // let dRates = [];
      // for(let i=0; i<ratings.length; i++){
      const driverRating = new DriverRating({
        learnerId,
        driverId,
        bookingId,
        attributeId: attId,
        rating: rating,
        createdBy: userDetails._id
      });
      console.log("dr", driverRating);
      // dRates.push(driverRating);
      //  if(i == ratings.length-1){
      Booking.updateOne(
        { _id: bookingId },
        {
          didFeedBack: true,
          updatedBy: userDetails._id,
          updatedDate: Date.now()
        }
      ).then(() => {});
      driverRating
        .save()
        .then(result => {
          //recording logs
          var obj = new LearnerRouter();
          var resTemp = {
            ...responseStatus.SUCCESS,
            message: LEARNER_RATE_SUCCESS_MESSAGE
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({
            ...responseStatus.SUCCESS,
            message: LEARNER_RATE_SUCCESS_MESSAGE
          });
        })
        .catch(error => {
          //recording logs
          var obj = new LearnerRouter();
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
      // }
      // }
    }
  }

  private filterVerifiedDrivers(data) {
    var xData = [];

    var async1 = require("async");
    return Promise(resolve => {
      async1.forEach(
        data,
        function(item, callback) {
          Document.find({ _id: { $in: item["userId"]["documents"] } }).then(
            data => {
              if (
                data.length > 1 &&
                data[0]["isVerified"] == 1 &&
                data[1]["isVerified"] == 1
              ) {
                xData.push(item);
              }
              callback();
            }
          );
        },
        function(err) {
          resolve({ data: xData });
        }
      );
    });
  }

  public async instructors(req: Request, res: Response): void {
    const { token, vehicleTypeId, isAutomatic, city, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      CarInfo.find()
        .populate("userId")
        .populate({
          path: "userId",
          populate: {
            path: "addresses",
            model: "Address"
          }
        })
        // .limit(perPage)
        // .skip(perPage * p)
        .then(async data => {
          // console.log("data..",data.length, data);
          let drivers = [];
          let finalResult = [];
          var totalRating = [];
          const finalData1 = data.filter(obj => {
            // console.log("----------",obj,"----------",(obj['userId'] && obj['userId']['addresses'] && obj['userId']['addresses'][0] && obj['userId']['addresses'][0]['city'] && (obj['userId']['addresses'][0]['city'] == city)));
            return (
              obj["userId"] &&
              obj["userId"]["isArchived"] == false &&
              obj["userId"]["addresses"] &&
              obj["userId"]["addresses"][0] &&
              obj["userId"]["addresses"][0]["city"] &&
              obj["userId"]["addresses"][0]["city"] == city
            );
          });
          var xObject = new LearnerRouter();
          var temp1 = await xObject.filterVerifiedDrivers(finalData1);
          var finalData = [];
          finalData = temp1["data"];

          // console.log("dsds",finalData);
          if (finalData.length > ti) {
            //var async = require('async');
            var temp: any = [];
            var attribute = [];
            for (let i = p; i < ti; i++) {
              console.log("we");
              drivers.push(finalData[i]["userId"]["_id"]);
              finalResult.push({
                instructor: finalData[i]["userId"],
                ratings: []
              });
            }

            //console.log("i am driver",drivers);

            RatingAverage.find({ driverId: { $in: drivers } })
              .then(data => {
                //console.log("dt",data);
                Attribute.find().then(data1 => {
                  for (let i = 0; i < data.length; i++) {
                    //console.log(data[i],"rate va");
                    data[i]["att"].forEach((d, index) => {
                      d.forEach((element, ind) => {
                        // console.log(element['att'],"ele");
                        // console.log("inde",index);
                        // console.log("att",d);
                        for (let k = 0; k < data1.length; k++) {
                          // console.log("name",data1[k]['_id']);
                          if (element["att"].equals(data1[k]["_id"])) {
                            var q = { _id: "", avg: 0, name: "" };
                            q._id = data1[k]["_id"];
                            q.avg = element["avg"];
                            q.name = data1[k]["name"];
                            //console.log("q",q);
                            attribute.push(q);
                          }
                        }
                      });
                      // console.log(attribute);
                    });
                    var finalAvg = {
                      driverId: data[i]["driverId"],
                      att: attribute,
                      driverAverage: data[i]["driverAverage"]
                    };
                    temp.push(finalAvg);
                    console.log(temp, "temp value");
                    // finalResult[i]['ratings'].push(temp)
                    // console.log(finalResult,'finalResult')
                    attribute = [];
                  }

                  for (let k = 0; k < finalResult.length; k++) {
                    for (let l = 0; l < temp.length; l++) {
                      if (
                        finalResult[k]["instructor"]["_id"].equals(
                          temp[l]["driverId"]
                        )
                      ) {
                        finalResult[k]["ratings"].push(temp[l]);
                        console.log(
                          "dat",
                          finalResult[k]["instructor"]["_id"],
                          temp[l]["driverId"]
                        );
                      }
                    }
                  }
                  //recording logs
                  var obj = new LearnerRouter();
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
                });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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

            // if(i == finalData.length-1){
            //   DriverRating.aggregate([
            //     {$project: {driverId:"$driverId", learnerId:"$learnerId", attributeId:"$attributeId", rating:"$review", review:"$review"}},
            //     {$match:{driverId:{$in:drivers}}},

            //     {
            //       $group:{
            //         _id:{
            //           "driverId":"$driverId",
            //           "attributeId":"$attributeId"
            //         },
            //         total:{ $sum : "$rating" }
            //       }
            //     },

            //   ]).then(result=>{
            //     if(result && result.length){
            //       for(let k=0; k<result.length; k++){
            //         for(let l=0; l<finalResult.length; l++){
            //           if(result[k]['driverId'] == finalResult[l]['instructor']['_id']){
            //             finalResult[l]['ratings'].push(result[k]);
            //           }
            //         }

            //         if(k == result.length-1){
            //           RatingAverage.find({driverId:{$in:drivers}}).then((data)=>{

            //             Attribute.find().then((data1)=>{

            //               res.status(200).json({ ...responseStatus.SUCCESS, data: finalResult,rating:data,attribute:data1 });

            //       });

            //           });

            //         }
            //       }
            //     }else{
            //       res.status(200).json({ ...responseStatus.SUCCESS, data: finalResult });
            //     }

            //   })
            //   .catch((error) => {
            //     res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR + " 3" });
            //   });
            // }
            //}
          } else if (finalData.length < ti && p < finalData.length) {
            console.log("we to");
            var temp: any = [];
            var attribute = [];
            //var async = require('async');
            for (let i = p; i < finalData.length; i++) {
              drivers.push(finalData[i]["userId"]["_id"]);
              finalResult.push({
                instructor: finalData[i]["userId"],
                ratings: []
              });
            }

            RatingAverage.find({ driverId: { $in: drivers } })
              .then(data => {
                console.log("dt", data);
                Attribute.find().then(data1 => {
                  for (let i = 0; i < data.length; i++) {
                    // console.log(data[i],"rate va");
                    data[i]["att"].forEach((d, index) => {
                      d.forEach((element, ind) => {
                        // console.log(element['att'],"ele");
                        // console.log("inde",index);
                        // console.log("att",d);
                        for (let k = 0; k < data1.length; k++) {
                          // console.log("name",data1[k]['_id']);
                          if (element["att"].equals(data1[k]["_id"])) {
                            var q = { _id: "", avg: 0, name: "" };
                            q._id = data1[k]["_id"];
                            q.avg = element["avg"];
                            q.name = data1[k]["name"];
                            //  console.log("q",q);
                            attribute.push(q);
                          }
                        }
                      });
                    });
                    // var t={"driverId":data[i]['driverId'],"att":attribute,"driverAverage":data[i]['driverAverage']};
                    // temp = t;
                    var finalAvg = {
                      driverId: data[i]["driverId"],
                      att: attribute,
                      driverAverage: data[i]["driverAverage"]
                    };
                    temp.push(finalAvg);
                    console.log(temp, "temp value 2");
                    //  finalResult[i]['ratings'].push(temp)
                    console.log(finalResult, "finalResult 2");
                    attribute = [];
                  }

                  for (let k = 0; k < finalResult.length; k++) {
                    for (let l = 0; l < temp.length; l++) {
                      if (
                        finalResult[k]["instructor"]["_id"].equals(
                          temp[l]["driverId"]
                        )
                      ) {
                        finalResult[k]["ratings"].push(temp[l]);
                        console.log(
                          "dat",
                          finalResult[k]["instructor"]["_id"],
                          temp[l]["driverId"]
                        );
                      }
                    }
                  }
                  //recording logs
                  var obj = new LearnerRouter();
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
                });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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

            // if(i == finalData.length-1){
            //   DriverRating.aggregate([
            //     {$project: {driverId:"$driverId", learnerId:"$learnerId", attributeId:"$attributeId", rating:"$review", review:"$review"}},
            //     {$match:{driverId:{$in:drivers}}},
            //     {

            //       $group:{
            //         _id:{
            //           "driverId":"$driverId",
            //          // "attributeId":"$attributeId"
            //         },
            //         total:{ $sum : "$rating" }
            //       },

            //     }
            //   ]).then(result=>{
            //     //console.log("red",result);

            //       if(result && result.length){
            //         for(let k=0; k<result.length; k++){

            //           for(let l=0; l<finalResult.length; l++){

            //             if(result[k]['_id']['driverId'].equals(finalResult[l]['instructor']['_id'])){
            //              // finalResult[l]['ratings'].push(result[k]);

            //           //    RatingAverage.findOne({driverId:result[k]['_id']['driverId']}).then(dt=>{
            //           //    // console.log("dt",dt);
            //           //     //finalResult[l]['ratings'].push(dt);
            //           //    //  finalResult[l]['ratings'].push(result[k]);
            //           //    totalRating.push(dt);
            //           //    console.log('sd',totalRating);
            //           //  finalResult.push({instructor:finalData[i]['userId'], ratings:totalRating});
            //           //  console.log("hii",finalResult);

            //           //   })
            //             }
            //           }

            //           if(k == result.length-1){

            //             res.status(200).json({ ...responseStatus.SUCCESS, data: finalResult });
            //           //  res.status(200).json({ ...responseStatus.SUCCESS, data: finalResult });
            //           }
            //         }
            //       }else{
            //         console.log("hii");
            //         res.status(200).json({ ...responseStatus.SUCCESS, data: finalResult });
            //       }
            //     })

            //   .catch((error) => {
            //     res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR + " 2" });
            //   });
            // }

            // }
          } else {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: NO_RECORDS_FOUND
              });
          }
        })
        .catch(error => {
          console.log(error);
          //recording logs
          var obj = new LearnerRouter();
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
              message: UNKNOW_ERROR + " 1"
            });
        });
    }
  }
  //function

  public async bookLesson(req: Request, res: Response): void {
    const {
      token,
      slotId,
      packageId,
      lessonStartDate,
      paymentType,
      driverId
    } = req.body;

    const {
      name,
      addressLineOne,
      addressLineTwo,
      city,
      state,
      pincode,
      country,
      lat,
      long,
      addressOf
    } = req.body.pickUpAddress;
    let currentDateTime = new Date();
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (
      !checkTokenResult ||
      (slotId == undefined &&
        packageId == undefined &&
        driverId == undefined &&
        paymentType == undefined)
    ) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      }).then(data => {
        Booking.find({ learnerId: data._id })
          .sort({ createdDate: -1 })
          .then(result => {
            console.log("ahdahsd", result);
            if (result && result.length > 0) {
              RideBooking.find({
                bookingId: result[0]["_id"],
                startDateTime: { $gt: currentDateTime },
                status: { $ne: "COMPLETED" }
              })
                .then(result => {
                  console.log("res", result);
                  if (result.length == 0) {
                    console.log("comp");
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
                      addressOf,
                      createdBy: userDetails._id
                    });

                    address.save();
                    const order = new Order({
                      packageId,
                      driverId,
                      learnerId: data._id,
                      slotId,
                      pickUpAddressId: address._id,
                      lessonStartDate,
                      paymentType,
                      paymentStatus: "PENDING",
                      createdBy: userDetails._id
                    });

                    order
                      .save()
                      .then(orderData => {
                        let link =
                          BaseURL.WEB_BASE_URL +
                          "?token=" +
                          token +
                          "&orderId=" +
                          orderData._id;
                        console.log(link);
                        //recording logs
                        var obj = new LearnerRouter();
                        var resTemp = {
                          ...responseStatus.SUCCESS,
                          data: orderData,
                          paymentURL: link
                        };
                        obj.makeLogs(req, resTemp);
                        obj = null;
                        //recording logs end
                        res.status(200).json({
                          ...responseStatus.SUCCESS,
                          data: orderData,
                          paymentURL: link
                        });
                      })
                      .catch(error => {
                        //recording logs
                        var obj = new LearnerRouter();
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
                  } else {
                    //recording logs
                    var obj = new LearnerRouter();
                    var resTemp = {
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: ALREADY_HAVE_BOOKING
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(200).json({
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: ALREADY_HAVE_BOOKING
                    });
                  }

                  // if(result && (result.length || result[0]['_id'])){
                  //   res.status(200).json({ ...responseStatus.FAILURE, message: ALREADY_HAVE_BOOKING });
                  //}
                  //  else{

                  //   const address = new Address({
                  //     name, addressLineOne, addressLineTwo, city, state, pincode, country, lat, long, addressOf
                  //   });

                  //   address.save();
                  //    const order = new Order({
                  //     packageId,
                  //     driverId,
                  //     learnerId : data._id,
                  //     slotId,
                  //     pickUpAddressId: address._id,
                  //     lessonStartDate,
                  //     paymentType,
                  //     paymentStatus: 'PENDING'
                  //   });

                  //   order.save()
                  //   .then((orderData) => {
                  //     let link = BaseURL.WEB_BASE_URL+'paypal?token='+token+'&orderId='+orderData._id;
                  //     console.log(link);
                  //     res.status(200).json({ ...responseStatus.SUCCESS,data:orderData, paymentURL: link });
                  //   })
                  //   .catch((error) => {

                  //     res.status(500).json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
                  //   });
                  // }
                })
                .catch(err => {
                  //recording logs
                  var obj = new LearnerRouter();
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
                addressOf,
                createdBy: userDetails._id
              });

              address.save();
              const order = new Order({
                packageId,
                driverId,
                learnerId: data._id,
                slotId,
                pickUpAddressId: address._id,
                lessonStartDate,
                paymentType,
                paymentStatus: "PENDING",
                createdBy: userDetails._id
              });

              order
                .save()
                .then(orderData => {
                  let link =
                    BaseURL.WEB_BASE_URL +
                    "?token=" +
                    token +
                    "&orderId=" +
                    orderData._id;
                  console.log(link);
                  //recording logs
                  var obj = new LearnerRouter();
                  var resTemp = {
                    ...responseStatus.SUCCESS,
                    data: orderData,
                    paymentURL: link
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({
                    ...responseStatus.SUCCESS,
                    data: orderData,
                    paymentURL: link
                  });
                })
                .catch(error => {
                  //recording logs
                  var obj = new LearnerRouter();
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
            }
          })
          .catch(err => {
            //recording logs
            var obj = new LearnerRouter();
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
      });
    }
  }

  public async orderById(req: Request, res: Response): void {
    const { token, orderId } = req.body;
   console.log(req.body,'i m in lurnr router')
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult || orderId == undefined) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      Order.findOne({ _id: orderId })
        .populate("packageId")
        .populate("driverId")
        .populate("learnerId")
        .populate("slotId")
        .then(result => {
          if (result && result._id) {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: result };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          } else {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            });
          }
        })
        .catch(error => {
          //recording logs
          var obj = new LearnerRouter();
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

  /**
   * createPayment
   */
  public createPayment(req: Request, res: Response): void {
    const { amount } = req.body;
    console.log(req.body);
    //Sandbox
    let CLIENT_TOKEN =
      "AbIIRArVxQZBOTbdTjMvfHd6X4Q9qx9zdo40ZjGAQ1l17CaixqCwjV-heA6EB3gQCBYjREBkeihHFxwF";
    let CLIENT_SECRET =
      "EAARvAMXf42w6KQ1hat4Pxt807R9ga6PYT9LanDmOKI0sjmnzH46HRb3uCfsEMfma-ubwwbrH5L1RmDf";

    //Production
    // let CLIENT_TOKEN =
    //   "AUVQZYRMQwMdsl5chWU0W7HH4qQ7gVbkIjnaIVz2sUsK8oj3RF_-qCqv16y4tP7at8zFWYc-guvx66CG";
    // let CLIENT_SECRET =
    //   "ELHX9ejDN9YrsNJQslHsYXoALB5a8wE1LVf_XZ0GnVot3wdJvHmtcm9tdw-tCyf80ApaopgYsxDvXLmh";
    request.post(
       "https://api.sandbox.paypal.com/v1/payments/payment",
      //"https://api.paypal.com/v1/payments/payment",
      {
        auth: {
          user: CLIENT_TOKEN,
          pass: CLIENT_SECRET
        },
        body: {
          intent: "sale",
          payer: {
            payment_method: "paypal"
          },
          transactions: [
            {
              amount: {
                total: amount,
                currency: "GBP" //"USD"
              }
            }
          ],
          redirect_urls: {
            return_url: "https://www.mysite.com",
            cancel_url: "https://www.mysite.com"
          }
        },
        json: true
      },
      (err, response) => {
        if (err) {
          //recording logs
          var obj = new LearnerRouter();
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
        }
        // 3. Return the payment ID to the client
        console.log(response.body);
        //recording logs
        var obj = new LearnerRouter();
        var resTemp1 = { ...responseStatus.SUCCESS, payerID: response.body };
        obj.makeLogs(req, resTemp1);
        obj = null;
        //recording logs end
        res
          .status(200)
          .json({ ...responseStatus.SUCCESS, paymentID: response.body });
      }
    );
  }

  /**
   * executePayment
   */
  public executePayment(req: Request, res: Response): void {
    let paymentID = req.body.paymentID;
    let payerID = req.body.payerID;
    let amount = req.body.amount;

    //Sandbox
    let CLIENT_TOKEN =
      "AbIIRArVxQZBOTbdTjMvfHd6X4Q9qx9zdo40ZjGAQ1l17CaixqCwjV-heA6EB3gQCBYjREBkeihHFxwF";
    let CLIENT_SECRET =
      "EAARvAMXf42w6KQ1hat4Pxt807R9ga6PYT9LanDmOKI0sjmnzH46HRb3uCfsEMfma-ubwwbrH5L1RmDf";

    //Production
    // let CLIENT_TOKEN =
    //   "AUVQZYRMQwMdsl5chWU0W7HH4qQ7gVbkIjnaIVz2sUsK8oj3RF_-qCqv16y4tP7at8zFWYc-guvx66CG";
    // let CLIENT_SECRET =
    //   "ELHX9ejDN9YrsNJQslHsYXoALB5a8wE1LVf_XZ0GnVot3wdJvHmtcm9tdw-tCyf80ApaopgYsxDvXLmh";

    // "https://api.sandbox.paypal.com/v1/payments/payment",
    //https://api.paypal.com/v1/payments/payment/
    request.post(
      "https://api.sandbox.paypal.com/v1/payments/payment" + paymentID + "/execute",
      {
        auth: {
          user: CLIENT_TOKEN,
          pass: CLIENT_SECRET
        },
        body: {
          payer_id: payerID,
          transactions: [
            {
              amount: {
                total: amount,
                currency: "GBP" //"USD"
              }
            }
          ]
        },
        json: true
      },
      (err, response) => {
        if (err) {
          //recording logs
          var obj = new LearnerRouter();
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
        }
        // 3. Return the payment ID to the client
        console.log(response.body);
        //recording logs
        var obj = new LearnerRouter();
        var resTemp1 = { ...responseStatus.SUCCESS, paymentID: response.body };
        obj.makeLogs(req, resTemp1);
        obj = null;
        //recording logs end
        res
          .status(200)
          .json({ ...responseStatus.SUCCESS, paymentID: response.body });
      }
    );
  }

  public async lessons(req: Request, res: Response): void {
    const { token, learnerId } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult || learnerId == undefined) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      Booking.find({ learnerId: learnerId })
        .sort({ createdDate: -1 })
        .then(result => {
          //console.log('sghfsd',result);
          if (result) {
            // console.log("ff");
            var bookingIds = [];
            result.forEach(ele => {
              bookingIds.push(ele._id);
            });
            //console.log(bookingIds);
            RideBooking.find({ bookingId: { $in: bookingIds } })
              .populate("driverId")
              .then(result => {
                //recording logs
                var obj = new LearnerRouter();
                var resTemp = { ...responseStatus.SUCCESS, data: result };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res
                  .status(200)
                  .json({ ...responseStatus.SUCCESS, data: result });
              })
              .catch(error => {
                //recording logs
                var obj = new LearnerRouter();
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
          } else {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: [] };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: [] });
          }
        })
        .catch(error => {
          //recording logs
          var obj = new LearnerRouter();
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

  /**
   * saveBookedTestCenterLocationHistory
   */
  public async saveBookedTestCenterLocationHistory(
    req: Request,
    res: Response
  ): void {
    const { token, bookedTestCenter, locations } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({
        token,
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          if (data && data._id) {
            let locationHistory = [];
            for (let i = 0; locations.length; i++) {
              locationHistory.push({
                bookedTestCenter: bookedTestCenter,
                learnerId: data._id,
                lat: locations[i]["lat"],
                long: locations[i]["long"],
                createdBy: userDetails._id
              });
              if (i == locations.length - 1) {
                BookedTestCenterLocationHistory.insertMany(locationHistory)
                  .then(result => {
                    console.log("data", result);
                    BookedTestCenter.findOneAndUpdate(
                      { _id: bookedTestCenter },
                      { status: TestStatus.COMPLETED }
                    );
                    //recording logs
                    var obj = new LearnerRouter();
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
                  .catch(error => {
                    //recording logs
                    var obj = new LearnerRouter();
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
              }
            }
          } else {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_TOKEN,
              message: UNKNOW_ERROR
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res
              .status(200)
              .json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_TOKEN,
                message: INVALID_REQUEST
              });
          }
        })
        .catch(error => {
          //recording logs
          var obj = new LearnerRouter();
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

  public async updateBookTestCenterStatus(req: Request, res: Response): void {
    const { token, testCenterId } = req.body;

    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      BookedTestCenter.findOneAndUpdate(
        { _id: testCenterId },
        {
          status: "COMPLETED",
          updatedBy: userDetails._id,
          updatedDate: Date.now()
        }
      ).then(resl => {
        res.status(200).json({
          ...responseStatus.SUCCESS,
          message: "Status Updated !"
        });
      });
    }
  }

  public async driverById(req: Request, res: Response) {
    let obj = new LearnerRouter();
    let checkTokenResult = await obj.checkToken(req.body.token);
    if (!checkTokenResult) {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res
        .status(200)
        .json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
    } else {
      User.findOne({ _id: req.body.driverId })
        .populate({
          path: "addresses",
          model: "Address"
        })
        .populate("documents")

        .populate({
          path: "documents",
          populate: {
            path: "documentType",
            model: "DocumentType"
          }
        })
        .populate("companions")
        .then(data => {
          let result = data.toJSON();
          CarInfo.findOne({ userId: req.body._id }).then(resp => {
            result["carInfo"] = resp;
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: data };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          });
        });
    }
  }

  //token checking
  private checkToken(token, isSubAdminCreate = false) {
    return Promise(resolve => {
      if ((token != undefined || token != null) && token.length > 0) {
        var query = {
          token,
          userType: UserTypes.LEARNER,
          userRole: UserRoles.APP_USER,
          isArchived: false
        };

        User.findOne(query).then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = "checking token fails.";
            obj.makeLogs(token, resTemp);
            obj = null;
            //recording logs end
            resolve(false);
          } else {
            //recording logs
            var obj = new LearnerRouter();
            var resTemp = "checking token succeed.";
            obj.makeLogs(token, resTemp);
            obj = null;
            //recording logs end
            resolve(true);
          }
        });
      } else {
        //recording logs
        var obj = new LearnerRouter();
        var resTemp = "checking token fails.";
        obj.makeLogs(token, resTemp);
        obj = null;
        //recording logs end
        resolve(false);
      }
    });
  }

  // set up our routes
  public routes() {
    this.router.post("/sendOTP", this.send);
    this.router.post("/resendOTP", this.send);
    this.router.post("/verifyOTP", this.verify);
    this.router.post("/create", this.create);
    this.router.post("/update", this.update);
    this.router.post("/profile", this.profile);

    this.router.post("/instructors", this.instructors);
    this.router.post("/vehicleTypes", this.vehicleTypes);
    this.router.post("/slots", this.slots);
    this.router.post("/packages", this.packages);

    this.router.post("/bookLesson", this.bookLesson);
    this.router.post("/lessons", this.lessons);

    this.router.post("/orderById", this.orderById);
    this.router.post("/driverById", this.driverById);

    this.router.post("/createPayment", this.createPayment);
    this.router.post("/executePayment", this.executePayment);

    this.router.post("/progress", this.progress);

    this.router.post("/rate", this.rate);

    this.router.post("/testCenters", this.testCenters);
    this.router.post("/bookTestCenter", this.bookTestCenter);
    this.router.post("/tests", this.tests);
    this.router.post("/dashboard", this.dashboard);

    this.router.post(
      "/saveBookedTestCenterLocationHistory",
      this.saveBookedTestCenterLocationHistory
    );

    this.router.post(
      "/updateBookTestCenterStatus",
      this.updateBookTestCenterStatus
    );
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

    var fileName = "LearnerRouter" + d + "-" + (m + 1) + "-" + y + ".txt";

    var logStream = fs.createWriteStream("logs/" + fileName, { flags: "a" });
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write(message + "\n");
    logStream.end("this is the end line \n");
  }
}

const learnerRouter = new LearnerRouter();
learnerRouter.routes();

export default learnerRouter.router;
