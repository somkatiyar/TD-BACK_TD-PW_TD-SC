import { RideBookingTransferRequestStatus } from "./../constants/RideBookingTransferRequestStatus";
import { NotificationTypes } from "./../constants/NotificationTypes";
import { LatLongTypes } from "./../constants/LatLongTypes";
import { UserRoles } from "./../constants/UserRoles";
import { ErrorCodes } from "./../constants/ErrorCodes";
import * as fs from "fs";

import {
  ACCOUNT_TEMPORARY_DISABLED,
  INVALID_CREDENTIALS,
  YOUR_REQUEST_TRANSFER_SUCCESS,
  UNKNOW_ERROR,
  INFORMATION_UPDATED_SUCCESS,
  NO_BUDDIES_FOUND,
  FAILED_TO_SEND_NOTIFICATION,
  YOUR_REQUEST_ACCEPTED_SUCCESS,
  RIDE_COMPLETED,
  OTP_SENT_SUCCESS_MESSAGE,
  MOBILE_NUMBER_NOT_PRESENT,
  UNABLE_TO_FIND_BUDDIES_PUSH_INFO,
  MOBILE_NUMBER_ALREADY_EXISTS,
  EMAIL_ALREADY_EXISTS,
  INVALID_REQUEST,
  DUTY_ON_MESSAGE,
  DUTY_OFF_MESSAGE,
  USER_ALREADY_EXISTS,
  DRIVER_CREATED_SUCCESS,
  INVALID_OTP_MESSAGE,
  LEARNER_CHECKIN_SUCCESS,
  INVALID_LEARNER_CHECKIN,
  DRIVER_RATE_SUCCESS_MESSAGE
} from "./../constants/Messages";
import { Md5 } from "md5-typescript";
import { AddressOf } from "../constants/AddressOf";
import { Request, Response, Router } from "express";
import User from "../models/User";
import OnDuty from "../models/OnDuty";
import Address from "../models/Address";
import CarInfo from "../models/CarInfo";
import Document from "../models/Document";
import RideBooking from "../models/RideBooking";
import Booking from "../models/Booking";
import VerificationCode from "../models/VerificationCode";
import DriverRating from "../models/DriverRating";
import { responseStatus } from "../constants/responseStatus";
import { UserTypes } from "../constants/UserTypes";
import Utils from "../utilities/utils";
import VehicleData from "../models/VehicleData";
import SchoolToUser from "../models/SchoolToUser";
import City from "../models/City";
import PushInfo from "../models/PushInfo";
import RideBookingTransferRequest from "../models/RideBookingTransferRequest";
import LearnerCurriculumProgress from "../models/LearnerCurriculumProgress";
import RatingAverage from "../models/RatingAverage";
//import { Mongoose,Promise } from "mongoose";
import UserDetails from "./UserDetails";

export class DriverRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private getDriverDetails(token) {
    return new Promise(resolve => {
      User.findOne({ token: token, userType: UserTypes.DRIVER })
        .populate("addresses")
        .then(data => {
          console.log(data);
          resolve(data);
        });
    });
  }

  public async onDuty(req: Request, res: Response): void {
    const { token, isActive } = req.body;
    let userDetail = await UserDetails.getUserDetails(token);
    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    let data = await obj.getDriverDetails(token);
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      OnDuty.findOneAndUpdate(
        { driverId: data["_id"] },
        { isActive, updatedBy: userDetail._id, updatedDate: Date.now() },
        { new: true }
      )
        .then(result => {
          if (!result || result == null) {
            const onDuty = new OnDuty({
              driverId: data["_id"],
              isActive
            });
            onDuty
              .save()
              .then(resp => {
                //recording logs
                var obj = new DriverRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  message: req.body.isActive
                    ? DUTY_ON_MESSAGE
                    : DUTY_OFF_MESSAGE,
                  data: resp
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  message: req.body.isActive
                    ? DUTY_ON_MESSAGE
                    : DUTY_OFF_MESSAGE,
                  data: resp
                });
              })
              .catch(error => {
                //recording logs
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              message: req.body.isActive ? DUTY_ON_MESSAGE : DUTY_OFF_MESSAGE,
              data: result
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: req.body.isActive ? DUTY_ON_MESSAGE : DUTY_OFF_MESSAGE,
              data: result
            });
          }
        })
        .catch(error => {
          //recording logs
          var obj = new DriverRouter();
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

  public login(req: Request, res: Response): void {
    const email = req.body.email;
    const password = req.body.password;
    let count = 0;
    let c = 0;
    if (req.body.email && req.body.password) {
      User.findOne({
        email: email,
        password: password,
        $or: [{ userType: "DRIVER" }, { userType: "SCHOOL_DRIVER" }]
      })
        .populate("documents")
        .then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new DriverRouter();
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
            if (data["documents"].length == 2) {
              data["documents"].forEach(element => {
                if (element["isVerified"] == 1) {
                  count++;
                }
                if (element["isVerified"] == 2) {
                  c++;
                }
              });
              console.log("c", c);
              console.log("ct", count);
              if (c > 0) {
                //recording logs
                var obj = new DriverRouter();
                var resTemp11 = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message:
                    "Your documents verification is in process. Please wait"
                };
                obj.makeLogs(req, resTemp11);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message:
                    "Your documents verification is in process. Please wait"
                });
              }
              //  else{
              //   res.status(200).json({ ...responseStatus.SUCCESS, data });
              //  }
              else if (count == 2) {
                const token = Md5.init(req.body.email);

                User.findOneAndUpdate(
                  { _id: data._id,isArchived:false },
                  { token: token, updatedDate: Date.now() }
                ).then(resData => {
                  if(resData != null){
                  //recording logs
                  var obj = new DriverRouter();
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
                } else {
                    //recording logs
                    var obj = new DriverRouter();
                    var resTemp1 = {
                      ...responseStatus.FAILURE,
                      errorCode:ErrorCodes.INVALID_REQUEST,
                      message: ACCOUNT_TEMPORARY_DISABLED
                    };
                    obj.makeLogs(req, resTemp1);
                    obj = null;
                    //recording logs end
                    res
                      .status(200)
                      .json({ ...responseStatus.FAILURE,
                        errorCode:ErrorCodes.INVALID_REQUEST,
                        message: ACCOUNT_TEMPORARY_DISABLED });
                }
                });
              } else {
                //recording logs
                var obj = new DriverRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message:
                    "Your documents verification is failed, Please contact admin."
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message:
                    "Your documents verification is failed, Please contact admin."
                });
                //res.status(200).json({ ...responseStatus.SUCCESS, data });
              }
            } else {
              //recording logs
              var obj = new DriverRouter();
              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message:
                  "There was some problem in uploading documents, Please contact admin."
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              //res.status(200).json({ ...responseStatus.SUCCESS, data });
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message:
                  "There was some problem in uploading documents, Please contact admin."
              });
            }
          }
        })
        .catch(error => {
          //recording logs
          var obj = new DriverRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR
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
      var obj = new DriverRouter();
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
  }

  public async profile(req: Request, res: Response): void {
    const { token } = req.body;

    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (checkTokenResult) {
      User.findOne({ token })
        .populate("companions")
        .populate("addresses")
        .populate("documents")
        .populate("carInfo")
        .then(data => {
          let result = data.toJSON();
          if (data && data._id) {
            DriverRating.find({ driverId: data._id })
              .then(respo => {
                let ratings = respo;
                if (respo && respo == null) {
                  CarInfo.findOne({ userId: data._id })
                    .then(resp => {
                      result["carInfo"] = resp;
                      console.log(data);
                      //recording logs
                      var obj = new DriverRouter();
                      var resTemp = {
                        ...responseStatus.SUCCESS,
                        data: result
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res
                        .status(200)
                        .json({ ...responseStatus.SUCCESS, data: result });
                    })
                    .catch(error => {
                      console.log("1", error);
                      //recording logs
                      var obj = new DriverRouter();
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
                  RatingAverage.findOne({ driverId: data._id }).then(rate => {
                    if (rate && rate != null) {
                      CarInfo.findOne({ userId: data._id })
                        .then(resp => {
                          result["carInfo"] = resp;
                          result["ratings"] = ratings;
                          result["driverTotalAverageRating"] =
                            rate["driverAverage"];
                          console.log(data);
                          //recording logs
                          var obj = new DriverRouter();
                          var resTemp = {
                            ...responseStatus.SUCCESS,
                            data: result
                          };
                          obj.makeLogs(req, resTemp);
                          obj = null;
                          //recording logs end
                          res
                            .status(200)
                            .json({ ...responseStatus.SUCCESS, data: result });
                        })
                        .catch(error => {
                          console.log("1", error);
                          //recording logs
                          var obj = new DriverRouter();
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
                      CarInfo.findOne({ userId: data._id })
                        .then(resp => {
                          result["carInfo"] = resp;
                          result["ratings"] = ratings;
                          result["driverTotalAverageRating"] = "";
                          console.log(data);
                          //recording logs
                          var obj = new DriverRouter();
                          var resTemp = {
                            ...responseStatus.SUCCESS,
                            data: result
                          };
                          obj.makeLogs(req, resTemp);
                          obj = null;
                          //recording logs end
                          res
                            .status(200)
                            .json({ ...responseStatus.SUCCESS, data: result });
                        })
                        .catch(error => {
                          console.log("1", error);
                          //recording logs
                          var obj = new DriverRouter();
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
                  });
                }
              })
              .catch(err => {
                res.status(500).json({
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR
                });
              });
          } else {
            //recording logs
            var obj = new DriverRouter();
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
        .catch(error => {
          console.log("1", error);
          //recording logs
          var obj = new DriverRouter();
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
  }

  public async bookings(req: Request, res: Response): void {
    const { token, date } = req.body;

    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (checkTokenResult && date != undefined && date.length > 0) {
      User.findOne({ token })
        .then(data => {
          if (data && data._id) {
            let dbDate = new Date(date);
            let lDate = new Date(date);
            console.log(dbDate, "dbdate");

            lDate.setDate(lDate.getDate() + 1);
            console.log(lDate, "ldate");
            RideBooking.find({
              driverId: data._id,
              startDateTime: { $gt: dbDate, $lt: lDate }
            })
              .populate("pickUpAddress")
              .populate("dropAddress")
              .populate({
                path: "slotId",
                model: "Slot"
              })
              .then(result => {
                console.log("res", result);
                let rb = [];
                let rideB = result;
                let finalData = [];
                if (result.length) {
                  for (let i = 0; i < result.length; i++) {
                    rb.push(result[i]["bookingId"]);
                    if (i == result.length - 1) {
                      // console.log("data",rb);
                      Booking.find({ _id: { $in: rb } })
                        .populate("learnerId")
                        .then(resp => {
                          //console.log(resp);
                          for (let k = 0; k < rideB.length; k++) {
                            //  console.log("k",k)
                            for (let l = 0; l < resp.length; l++) {
                              //   console.log("k, l",k, l, rideB[k]['bookingId'], resp[l]._id)
                              if (rideB[k]["bookingId"].equals(resp[l]._id)) {
                                // console.log("in...")
                                // console.log(resp[l]['learnerId']);
                                finalData.push({
                                  bookingDetail: rideB[k],
                                  userDetail: resp[l]["learnerId"]
                                });
                                break;
                              }
                            }
                            if (k == rideB.length - 1) {
                              res.status(200).json({
                                ...responseStatus.SUCCESS,
                                data: finalData
                              });
                            }
                          }
                        })
                        .catch(error => {
                          //recording logs
                          var obj = new DriverRouter();
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
                  var obj = new DriverRouter();
                  var resTemp = {
                    ...responseStatus.SUCCESS,
                    data: []
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({ ...responseStatus.SUCCESS, data: [] });
                }
              })
              .catch(error => {
                //recording logs
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
        .catch(error => {
          //recording logs
          var obj = new DriverRouter();
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
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR
          });
        });
    } else {
      //recording logs
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_REQUEST,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_REQUEST,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    }
  }

  public async learnerProfileAndProgress(req: Request, res: Response): void {
    const { token, bookingId } = req.body;

    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (checkTokenResult && bookingId != undefined && bookingId.length > 0) {
      User.findOne({ token })
        .then(data => {
          if (data && data._id) {
            Booking.findOne({ _id: bookingId })
              .populate("learnerId")
              .populate("pickUpAddressId")
              .then(resp => {
                let x = resp;
                LearnerCurriculumProgress.find({ bookingId })
                  .populate("curriculumId")
                  .then(result => {
                    if (result && result.length) {
                      let data = {
                        bookingDetail: x,
                        curriculums: result
                      };
                      //recording logs
                      var obj = new DriverRouter();
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
                    } else {
                      //recording logs
                      var obj = new DriverRouter();
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
                    console.log(error);
                    //recording logs
                    var obj = new DriverRouter();
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
              })
              .catch(error => {
                console.log(error);
                //recording logs
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
        .catch(error => {
          //recording logs
          var obj = new DriverRouter();
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

  public async learnerCheckIn(req: Request, res: Response): void {
    const { token, otp, rideBookingId, bookingId } = req.body;
    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetail = await UserDetails.getUserDetails(token);
    if (
      checkTokenResult &&
      bookingId != undefined &&
      otp &&
      rideBookingId &&
      (bookingId.length > 0 && otp.length > 0 && rideBookingId.length > 0)
    ) {
      User.findOne({ token })
        .then(data => {
          if (data && data._id) {
            Booking.findOne({ _id: bookingId })
              .populate("learnerId")
              .then(resp => {
                console.log("resp", resp);
                if (
                  resp &&
                  resp["learnerId"] &&
                  resp["learnerId"].mobileNumber
                ) {
                  RideBooking.findOne({
                    bookingId: bookingId,
                    otp: otp
                  })
                    .then(result => {
                      console.log("result", result);
                      if (!result || result == null) {
                        res.status(200).json({
                          ...responseStatus.FAILURE,
                          errorCode: ErrorCodes.INVALID_REQUEST,
                          message: INVALID_OTP_MESSAGE
                        });
                      } else {
                        RideBooking.findOneAndUpdate(
                          { _id: rideBookingId },
                          {
                            status: "ACTIVE",
                            startDateTime: Date.now(),
                            updatedBy: userDetail._id,
                            updatedDate: Date.now()
                          }
                        )
                          .then(rb => {
                            //recording logs
                            var obj = new DriverRouter();
                            var resTemp = {
                              ...responseStatus.SUCCESS,
                              message: LEARNER_CHECKIN_SUCCESS
                            };
                            obj.makeLogs(req, resTemp);
                            obj = null;
                            //recording logs end
                            res.status(200).json({
                              ...responseStatus.SUCCESS,
                              message: LEARNER_CHECKIN_SUCCESS
                            });
                          })
                          .catch(error => {
                            //recording logs
                            var obj = new DriverRouter();
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
                    .catch(error => {
                      //recording logs
                      var obj = new DriverRouter();
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
                  var obj = new DriverRouter();
                  var resTemp = {
                    ...responseStatus.FAILURE,
                    errorCode: ErrorCodes.INVALID_REQUEST,
                    message: INVALID_LEARNER_CHECKIN
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({
                    ...responseStatus.FAILURE,
                    errorCode: ErrorCodes.INVALID_REQUEST,
                    message: INVALID_LEARNER_CHECKIN
                  });
                }
              })
              .catch(error => {
                //recording logs
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
        .catch(error => {
          //recording logs
          var obj = new DriverRouter();
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

  public async rideCompleted(req: Request, res: Response): void {
    const { token, rideBookingId } = req.body;
    let userDetail = UserDetails.getUserDetails(token);
    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (
      checkTokenResult &&
      rideBookingId != undefined &&
      rideBookingId.length > 0
    ) {
      User.findOne({ token })
        .then(data => {
          if (data && data._id) {
            RideBooking.findOneAndUpdate(
              { _id: rideBookingId, status: "ACTIVE" },
              {
                status: "COMPLETED",
                endDateTime: Date.now(),
                updatedDate: Date.now(),
                updatedBy: userDetail._id
              }
            )
              .populate("bookingId")
              .populate({
                path: "driverId",
                model: "User"
              })
              .then(rb => {
                if (rb && rb._id) {
                  // Send Notification on all lessons completion of particular booking start
                  RideBooking.find({
                    bookingId: rb["bookingId"]._id,
                    status: { $in: ["ACTIVE", "NOT_ACTIVE"] }
                  })
                    .populate({
                      path: "driverId",
                      model: "User"
                    })
                    .then(respo => {
                      console.log("resp", rb["driverId"]["firstName"]);
                      if (respo && respo.length == 0) {
                        PushInfo.find({
                          userId: { $in: [rb["bookingId"]["learnerId"]] }
                        }).then(resp => {
                          if (resp && resp.length > 0) {
                            let to = [];
                            let title = "Rate Instructor";
                            let message =
                              " You have completed your driving lesson ,please rate " +
                              rb["driverId"]["firstName"] +
                              " " +
                              rb["driverId"]["lastName"] +
                              ".";
                            for (let l = 0; l < resp.length; l++) {
                              to.push(resp[l]["pushToken"]);
                              if (l == resp.length - 1) {
                                let params = {
                                  type: NotificationTypes.RATE_DRIVER,
                                  bookingId: rb["bookingId"]._id,
                                  driverId: rb["bookingId"].driverId
                                };
                                console.clear();
                                console.log("i am here", to);

                                Utils.sendPushNotification(
                                  to,
                                  message,
                                  title,
                                  params
                                ).then(notificationData => {
                                  console.log(notificationData);
                                });
                              }
                            }
                          }
                        });
                      }
                    });
                  // Send Notification on all lessons completion of particular booking end
                  //recording logs
                  var obj = new DriverRouter();
                  var resTemp = {
                    ...responseStatus.SUCCESS,
                    message: RIDE_COMPLETED
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({
                    ...responseStatus.SUCCESS,
                    message: RIDE_COMPLETED
                  });
                } else {
                  //recording logs
                  var obj = new DriverRouter();
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
              .catch(error => {
                //recording logs
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
        .catch(error => {
          //recording logs
          var obj = new DriverRouter();
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

  public async rate(req: Request, res: Response): void {
    const {
      token,
      curriculumId,
      rating,
      review,
      attributeId,
      driverId,
      bookingId
    } = req.body;

    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (
      checkTokenResult &&
      bookingId != undefined &&
      curriculumId != undefined &&
      rating != undefined &&
      (bookingId.length > 0 && curriculumId.length > 0 && rating.length > 0)
    ) {
      User.findOne({ token })
        .then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new DriverRouter();
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
            // const driverRating = new DriverRating({
            //   curriculumId,
            //   status,
            //   rating,
            //   review,
            //   attributeId,
            //   driverId,
            //   learnerId: data._id
            // });
            //   driverRating.save()
            //   .then((result) => {
            //     res.status(200).json({ ...responseStatus.SUCCESS, message: DRIVER_RATE_SUCCESS_MESSAGE });
            //   })
            //   .catch((error) => {
            //     res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
            //   });
          }
        })
        .catch(error => {
          //recording logs
          var obj = new DriverRouter();
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
   * addMobileVehicleData
   */
  public async addMobileVehicleData(req: Request, res: Response): void {
    const { token, car, lat, long, user, dataType, rideBooking } = req.body;
    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetail = await UserDetails.getUserDetails(token);
    if (
      checkTokenResult &&
      car != undefined &&
      user != undefined &&
      lat != undefined &&
      long != undefined &&
      dataType != undefined &&
      (car.length > 0 &&
        user.length > 0 &&
        long.length > 0 &&
        lat.length > 0 &&
        dataType.length > 0)
    ) {
      if (req.body.dataType == LatLongTypes.MOBILE) {
        VehicleData.findOne({ user, dataType: LatLongTypes.MOBILE })
          .then(result => {
            if (result && result._id) {
              VehicleData.updateOne(
                { _id: result._id },
                { updatedBy: userDetail._id, updatedDate: Date.now() }
              ).then(() => {});
              VehicleData.findOneAndUpdate({ _id: result._id }, req.body)
                .then(resp => {
                  //recording logs
                  var obj = new DriverRouter();
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
                  var obj = new DriverRouter();
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
              let vehicleData = new VehicleData({
                car,
                lat,
                long,
                user,
                dataType,
                createdBy: userDetail._id
              });
              vehicleData
                .save()
                .then(data => {
                  //recording logs
                  var obj = new DriverRouter();
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
                  var obj = new DriverRouter();
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
            //recording logs
            var obj = new DriverRouter();
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
        let vehicleData = new VehicleData({
          car,
          lat,
          long,
          user,
          dataType: LatLongTypes.CAR_MOVEMENT,
          rideBooking,
          createdBy: userDetail._id
        });
        vehicleData
          .save()
          .then(data => {
            //recording logs
            var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
   * colleagueLocationData in case of driver belong to school
   */
  public async colleagueLocationData(req: Request, res: Response): void {
    const { token } = req.body;

    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (checkTokenResult) {
      let result = await obj.getDriverDetails(token);
      if (result && result["_id"]) {
        SchoolToUser.findOne({ user: result["_id"] })
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
                        var obj = new DriverRouter();
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
                        var obj = new DriverRouter();
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
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
    } else {
      //recording logs
      var resTemp1 = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp1);
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
   * transferToBuddies
   */
  public async transferToBuddies(req: Request, res: Response): void {
    const { token, rideBookingId } = req.body;
    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetail = await UserDetails.getUserDetails(token);
    if (
      checkTokenResult &&
      rideBookingId != undefined &&
      rideBookingId.length > 0
    ) {
      let data = await obj.getDriverDetails(token);

      // User.findOne({
      //   token,
      //   userType: UserTypes.DRIVER,
      //   userRole: UserRoles.APP_USER
      // }).populate("addresses")
      //   .then(data => {
      console.log("dd", data["companions"]);
      if (data && data["_id"]) {
        let userData = data;
        RideBooking.findOne({ _id: rideBookingId, driverId: userData["_id"] })
          .populate("driverId")
          .populate("slotId")
          .then(respo => {
            if (respo && respo._id) {
              let rideData = respo;

              let name = userData["firstName"];
              if (userData["companions"] && userData["companions"].length > 0) {
                let buddies = userData["companions"];
                PushInfo.find({ userId: { $in: buddies } })
                  .then(resp => {
                    if (resp && resp.length > 0) {
                      let to = [];
                      let title = "Booking Transfer Request";
                      let slot = rideData["slotId"]["name"];
                      let date = new Date(
                        rideData["startDateTime"]
                      ).toDateString();
                      let message =
                        "You have a booking transfer request from " +
                        name +
                        ".\n" +
                        " Booking Date: " +
                        date +
                        " Slot:" +
                        slot;

                      for (let l = 0; l < resp.length; l++) {
                        to.push(resp[l]["pushToken"]);
                        console.log("i m tosss", to);
                        if (l == resp.length - 1) {
                          let cityValue = data["addresses"][0]["city"];
                          City.findOne({ value: cityValue }).then(temp => {
                            let rideBookingTransferRequest = new RideBookingTransferRequest(
                              {
                                rideBookingId,
                                status:
                                  RideBookingTransferRequestStatus.IN_PROGRESS,
                                to: to,
                                title: title,
                                message: message,
                                city: temp["name"],
                                createdBy: userDetail._id
                              }
                            );

                            rideBookingTransferRequest
                              .save()
                              .then(result => {
                                console.log(result);
                                if (result && result._id) {
                                  let params = {
                                    rideBookingTransferRequestId: result._id,
                                    bookingId: rideBookingId,
                                    type: NotificationTypes.TRANSFER_BOOKING,
                                    buddyIds: buddies
                                  };
                                  console.log("i m params", params);
                                  RideBooking.findOneAndUpdate(
                                    {
                                      _id: rideBookingId,
                                      driverId: userData["_id"]
                                    },
                                    {
                                      status: "TRANSFER_INITIATED",
                                      updatedBy: userDetail._id,
                                      updatedDate: Date.now()
                                    }
                                  )
                                    .then(CData => {
                                      console.log("dddd", CData);
                                    })
                                    .catch(err => {
                                      //recording logs
                                      var obj = new DriverRouter();
                                      var resTemp = {
                                        ...responseStatus.FAILURE,
                                        errorCode: ErrorCodes.INVALID_REQUEST,
                                        message: UNKNOW_ERROR + err["message"]
                                      };
                                      obj.makeLogs(req, resTemp);
                                      obj = null;
                                      //recording logs end
                                      console.log("err", err);
                                    });
                                  Utils.sendPushNotification(
                                    to,
                                    message,
                                    title,
                                    params
                                  ).then(notificationData => {
                                    if (notificationData["status"] == 1) {
                                      //recording logs
                                      var obj = new DriverRouter();
                                      var resTemp = {
                                        ...responseStatus.SUCCESS,
                                        message: YOUR_REQUEST_TRANSFER_SUCCESS
                                      };
                                      obj.makeLogs(req, resTemp);
                                      obj = null;
                                      //recording logs end
                                      res.status(200).json({
                                        ...responseStatus.SUCCESS,
                                        message: YOUR_REQUEST_TRANSFER_SUCCESS
                                      });
                                    } else {
                                      //recording logs
                                      var obj = new DriverRouter();
                                      var resTemp11 = {
                                        ...responseStatus.FAILURE,
                                        errorCode: ErrorCodes.INVALID_REQUEST,
                                        message: FAILED_TO_SEND_NOTIFICATION
                                      };
                                      obj.makeLogs(req, resTemp11);
                                      obj = null;
                                      //recording logs end
                                      res.status(200).json({
                                        ...responseStatus.FAILURE,
                                        errorCode: ErrorCodes.INVALID_REQUEST,
                                        message: FAILED_TO_SEND_NOTIFICATION
                                      });
                                    }
                                  });
                                } else {
                                  //recording logs
                                  var obj = new DriverRouter();
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
                              .catch(error => {
                                //recording logs
                                var obj = new DriverRouter();
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
                      }
                    } else {
                      //recording logs
                      var obj = new DriverRouter();
                      var resTemp = {
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNABLE_TO_FIND_BUDDIES_PUSH_INFO
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(200).json({
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: UNABLE_TO_FIND_BUDDIES_PUSH_INFO
                      });
                    }
                  })
                  .catch(err => {
                    //recording logs
                    var obj = new DriverRouter();
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
                let params = {
                  type: NotificationTypes.TRANSFER_BOOKING_ALL,
                  bookingId: rideBookingId,
                  rideBookingTransferRequestId: 0
                };

                RideBooking.findOneAndUpdate(
                  {
                    _id: rideBookingId,
                    driverId: userData["_id"]
                  },
                  {
                    status: "TRANSFER_INITIATED",
                    updatedBy: userDetail._id,
                    updatedDate: Date.now()
                  }
                )
                  .then(CData => {
                    console.log("dddd", CData);
                  })
                  .catch(err => {
                    console.log("err", err);
                  });

                let title = "Booking Transfer Request";
                let slot = rideData["slotId"]["name"];
                let date = new Date(rideData["startDateTime"]).toDateString();
                let message =
                  "You have a booking transfer request from " +
                  name +
                  ".\n" +
                  " Booking Date: " +
                  date +
                  " Slot:" +
                  slot;
                User.findOne({
                  token,
                  userType: UserTypes.DRIVER,
                  userRole: UserRoles.APP_USER
                })
                  .populate("addresses")
                  .then(data => {
                    console.log(data);
                    let cityValue = data["addresses"][0]["city"];
                    City.findOne({ value: cityValue }).then(temp => {
                      let rideBookingTransferRequest = new RideBookingTransferRequest(
                        {
                          rideBookingId,
                          status: RideBookingTransferRequestStatus.IN_PROGRESS,
                          to: temp["name"].replace(" ", "-"),
                          title: title,
                          message: message,
                          createdBy: userDetail._id
                        }
                      );

                      rideBookingTransferRequest.save().then(async result => {
                        params["rideBookingTransferRequestId"] = result._id;

                        await Utils.sendPushToTopicAndroid(
                          temp["name"].replace(" ", "-"),
                          message,
                          title,
                          params
                        ).then(notificationData => {
                          if (notificationData["status"] == 1) {
                            //recording logs
                            var obj = new DriverRouter();
                            var resTemp = {
                              ...responseStatus.SUCCESS,
                              message:
                                YOUR_REQUEST_ACCEPTED_SUCCESS + " android"
                            };
                            obj.makeLogs(req, resTemp);
                            obj = null;
                            //recording logs end
                            return resTemp;
                            // res.status(200).json({
                            //   ...responseStatus.SUCCESS,
                            //   message: YOUR_REQUEST_ACCEPTED_SUCCESS + " android"
                            // });
                          } else {
                            //recording logs
                            var obj = new DriverRouter();
                            var resTemp11 = {
                              ...responseStatus.FAILURE,
                              errorCode: ErrorCodes.INVALID_REQUEST,
                              message: FAILED_TO_SEND_NOTIFICATION + " android"
                            };
                            obj.makeLogs(req, resTemp11);
                            obj = null;
                            //recording logs end
                            return resTemp;
                            // res.status(200).json({
                            //   ...responseStatus.FAILURE,
                            //   message: FAILED_TO_SEND_NOTIFICATION +" android"
                            // });
                          }
                        });
                        await Utils.sendPushToTopiciOS(
                          temp["name"].replace(" ", "-"),
                          message,
                          title,
                          params
                        ).then(notificationData => {
                          if (notificationData["status"] == 1) {
                            //recording logs
                            var obj = new DriverRouter();
                            var resTemp = {
                              ...responseStatus.SUCCESS,
                              message: YOUR_REQUEST_ACCEPTED_SUCCESS + " iOS"
                            };
                            obj.makeLogs(req, resTemp);
                            obj = null;
                            //recording logs end
                            return resTemp;
                            // res.status(200).json({
                            //   ...responseStatus.SUCCESS,
                            //   message: YOUR_REQUEST_ACCEPTED_SUCCESS
                            // });
                          } else {
                            //recording logs
                            var obj = new DriverRouter();
                            var resTemp11 = {
                              ...responseStatus.FAILURE,
                              errorCode: ErrorCodes.INVALID_REQUEST,
                              message: FAILED_TO_SEND_NOTIFICATION + " iOS"
                            };
                            obj.makeLogs(req, resTemp11);
                            obj = null;
                            //recording logs end
                            return resTemp;
                            // res.status(200).json({
                            //   ...responseStatus.FAILURE,
                            //   message: FAILED_TO_SEND_NOTIFICATION + " iOS"
                            // });
                          }
                        });
                        //recording logs
                        var obj = new DriverRouter();
                        var resTemp = {
                          ...responseStatus.SUCCESS,
                          message:
                            NO_BUDDIES_FOUND +
                            "Your request is transferin to all drivers of your city."
                        };
                        obj.makeLogs(req, resTemp);
                        obj = null;
                        //recording logs end
                        res.status(200).json({
                          ...responseStatus.SUCCESS,
                          message:
                            NO_BUDDIES_FOUND +
                            " Your request is transfering to all drivers of your city. "
                        });
                      });
                    });
                  });
              }
            } else {
              //recording logs
              var obj = new DriverRouter();
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
          .catch(error => {
            //recording logs
            var obj = new DriverRouter();
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
      // res.status(200).json({ ...responseStatus.SUCCESS, data });
    } else {
      //recording logs
      var resTemp1 = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp1);
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
   * acceptTransferRequest
   */
  public async acceptTransferRequest(req: Request, res: Response): void {
    const { token, rideBookingTransferRequestId, driverId } = req.body;
    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetail = await UserDetails.getUserDetails(token);
    if (checkTokenResult) {
      if (req.body.rideBookingTransferRequestId) {
        RideBookingTransferRequest.findOneAndUpdate(
          { _id: rideBookingTransferRequestId },
          {
            status: RideBookingTransferRequestStatus.ACCEPTED,
            updatedBy: userDetail._id,
            updatedDate: Date.now()
          }
        ).then(data => {});

        RideBookingTransferRequest.findOne({
          _id: rideBookingTransferRequestId
        })
          .then(data => {
            if (data && data._id) {
              if (data["status"] != "ACCEPTED") {
                RideBooking.findOneAndUpdate(
                  { _id: data["rideBookingId"] },
                  {
                    driverId: driverId,
                    status: "NOT_ACTIVE",
                    updatedBy: userDetail._id,
                    updatedDate: Date.now()
                  }
                )
                  .populate("slotId")
                  .then(result => {
                    console.log(result);

                    //Below code is for sending notification to the learner that his/her instructor is changed for an appointment.
                    Booking.findOne({ _id: result["bookingId"] }).then(
                      respo => {
                        PushInfo.find({
                          userId: { $in: [respo["learnerId"]] }
                        }).then(resp => {
                          if (resp && resp.length > 0) {
                            let to = [];
                            let title = "Instructor Changed";
                            let slot = result["slotId"]["name"];
                            let date = new Date(
                              result["startDateTime"]
                            ).toDateString();
                            let message =
                              "You instructor has been changed for an appointment.\n" +
                              " Booking Date: " +
                              date +
                              " Slot:" +
                              slot;
                            for (let l = 0; l < resp.length; l++) {
                              to.push(resp[l]["pushToken"]);
                              if (l == resp.length - 1) {
                                let params = {
                                  type: NotificationTypes.INSTRUCTOR_CHANGED
                                };
                                Utils.sendPushNotification(
                                  to,
                                  message,
                                  title,
                                  params
                                ).then(notificationData => {
                                  console.log(notificationData);
                                });
                              }
                            }
                          }
                        });
                      }
                    );
                    //recording logs
                    var obj = new DriverRouter();
                    var resTemp1 = {
                      ...responseStatus.SUCCESS,
                      message: YOUR_REQUEST_ACCEPTED_SUCCESS
                    };
                    obj.makeLogs(req, resTemp1);
                    obj = null;
                    //recording logs end
                    res.status(200).json({
                      ...responseStatus.SUCCESS,
                      message: YOUR_REQUEST_ACCEPTED_SUCCESS
                    });
                  })
                  .catch(error => {
                    //recording logs
                    var obj = new DriverRouter();
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
                var obj = new DriverRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: "This request has already accepted. "
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: "This request has already accepted."
                });
              }
            } else {
              //recording logs
              var obj = new DriverRouter();
              var resTemp11 = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: INVALID_REQUEST
              };
              obj.makeLogs(req, resTemp11);
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
            var obj = new DriverRouter();
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
    } else {
      //recording logs
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
   * forgotPassword
   */
  public forgotPassword(req: Request, res: Response): void {
    const { email } = req.body;

    if (req.body.email) {
      User.findOne({
        email,
        userType: UserTypes.DRIVER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          if (data && data._id) {
            let OTP =
              "123456" || Math.floor(100000 + Math.random() * 900000) + "";
            let message = "Your OTP to reset your password is\n" + OTP;
            let subject = "Forgot Password || OTP";
            let mobileNumber = data["mobileNumber"];

            console.log(message);

            Utils.sendSES(email, message, subject).then(sesData => {
              console.log(sesData);
            });

            if (mobileNumber) {
              Utils.sendSNS(mobileNumber, OTP)
                .then(result => {})
                .catch(error => {
                  console.log(error);
                });
            }

            VerificationCode.findOne({ email })
              .then(resp => {
                if (!resp || resp == null) {
                  const verificationCode = new VerificationCode({
                    email,
                    otp: OTP
                  });

                  verificationCode
                    .save()
                    .then(ins => {
                      //recording logs
                      var obj = new DriverRouter();
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
                      var obj = new DriverRouter();
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
                  if (email) {
                    VerificationCode.findOneAndUpdate({ email }, { otp: OTP })
                      .then(result => {
                        //recording logs
                        var obj = new DriverRouter();
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
                        var obj = new DriverRouter();
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
                    var obj = new DriverRouter();
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
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
          var obj = new DriverRouter();
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
      var obj = new DriverRouter();
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
  }

  /**
   * updatePassword
   */
  public updatePassword(req: Request, res: Response): void {
    const { email, OTP, newPassword } = req.body;

    if (req.body.email && req.body.OTP && req.body.OTP) {
      User.findOne({
        email,
        userType: UserTypes.DRIVER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          if (data && data._id) {
            VerificationCode.findOne({ email, otp: OTP })
              .then(resp => {
                console.log("verified", resp, req.body);
                if (!resp || resp == null) {
                  //recording logs
                  var obj = new DriverRouter();
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
                  User.findOneAndUpdate(
                    {
                      email,
                      userType: UserTypes.DRIVER,
                      userRole: UserRoles.APP_USER
                    },
                    { password: newPassword }
                  )
                    .then(async result => {
                      let userDetail = await UserDetails.getUserDetails(
                        result._id
                      );
                      User.updateOne(
                        { _id: result._id },
                        { updatedBy: userDetail._id, updatedDate: Date.now() }
                      );
                      res.status(200).json({
                        ...responseStatus.SUCCESS,
                        message: INFORMATION_UPDATED_SUCCESS
                      });
                    })
                    .catch(error => {
                      //recording logs
                      var obj = new DriverRouter();
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
              .catch(error => {
                //recording logs
                var obj = new DriverRouter();
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
            var obj = new DriverRouter();
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
          var obj = new DriverRouter();
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
      var obj = new DriverRouter();
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
  }

  /**
   * updateLearnerProgress
   */
  public async updateLearnerProgress(req: Request, res: Response): void {
    const { token, curriculumId, progress } = req.body;
    let obj = new DriverRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetail = await UserDetails.getUserDetails(token);
    if (
      checkTokenResult &&
      curriculumId != undefined &&
      progress &&
      (curriculumId.length > 0 && progress)
    ) {
      LearnerCurriculumProgress.findOneAndUpdate(
        { _id: curriculumId },
        { progress, updatedBy: userDetail._id, updatedDate: Date.now() }
      )
        .then(result => {
          if (result && result._id) {
            //recording logs
            var obj = new DriverRouter();
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
          } else {
            //recording logs
            var obj = new DriverRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: INVALID_REQUEST
            });
          }
        })
        .catch(err => {
          //recording logs
          var obj = new DriverRouter();
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

  //token checking
  private checkToken(token) {
    return new Promise(resolve => {
      if ((token != undefined || token != null) && token.length > 0) {
        var query = {
          token,
          userType: UserTypes.DRIVER,
          userRole: UserRoles.APP_USER
        };

        User.findOne(query).then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new DriverRouter();
            var resTemp = "checking token fails.";
            //obj.makeLogs(token, resTemp);
            obj = null;
            //recordins logs ends
            resolve(false);
          } else {
            //recording logs
            var obj = new DriverRouter();
            var resTemp = "checking token succeed.";
            //obj.makeLogs(token, resTemp);
            obj = null;
            //recordins logs ends
            resolve(true);
          }
        });
      } else {
        //recording logs
        var obj = new DriverRouter();
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
    this.router.post("/login", this.login);
    this.router.post("/onDuty", this.onDuty);
    this.router.post("/profile", this.profile);
    this.router.post("/bookings", this.bookings);
    this.router.post("/learnerCheckIn", this.learnerCheckIn);
    this.router.post(
      "/learnerProfileAndProgress",
      this.learnerProfileAndProgress
    );
    this.router.post("/rate", this.rate);
    this.router.post("/addMobileVehicleData", this.addMobileVehicleData);
    this.router.post("/colleagueLocationData", this.colleagueLocationData);
    this.router.post("/transferToBuddies", this.transferToBuddies);
    this.router.post("/acceptTransferRequest", this.acceptTransferRequest);
    this.router.post("/rideCompleted", this.rideCompleted);

    this.router.post("/forgotPassword", this.forgotPassword);

    this.router.post("/updatePassword", this.updatePassword);
    this.router.post("/updateLearnerProgress", this.updateLearnerProgress);
  }

  private makeLogs(req: any, res: any) {
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

    var fileName = "DriverRouter" + d + "-" + (m + 1) + "-" + y + ".txt";

    var logStream = fs.createWriteStream("logs/" + fileName, { flags: "a" });
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write(message + "\n");
    logStream.end("this is the end line \n");
  }
}

const driverRouter = new DriverRouter();
driverRouter.routes();

export default driverRouter.router;
