import { InvoiceStatus } from "./../constants/InvoiceStatus";
import { NotificationTypes } from "./../constants/NotificationTypes";
import { TaxFor } from "./../constants/TaxFor";
import { Request, Response, Router } from "express";
import * as mongoose from "mongoose";
import { Md5 } from "md5-typescript";
import User from "../models/User";
import { AddressOf } from "./../constants/AddressOf";
import LearnerInvoice from "../models/LearnerInvoice";
import Curriculum from "../masters/Curriculum";
import LearnerCurriculumProgress from "../models/LearnerCurriculumProgress";
import { ErrorCodes } from "./../constants/ErrorCodes";

import {
  SCHOOL_NOT_FOUND,
  SCHOOL_DISABLED_SUCCESS,
  SCHOOL_ENABLED_SUCCESS,
  SUB_ADMIN_DISABLED_SUCCESS,
  SUB_ADMIN_ENABLED_SUCCESS,
  SUB_ADMIN_NOT_FOUND,
  LEARNER_ENABLED_SUCCESS,
  LEARNER_DISABLED_SUCCESS,
  LEARNER_NOT_FOUND,
  ACCOUNT_TEMPORARY_DISABLED,
  INVALID_CREDENTIALS,
  FAILED_PAYMENT_STATUS_UPDATE,
  PAYMENT_FAILED,
  ORDER_BOOK_SUCCESS,
  DRIVER_ENABLED_SUCCESS,
  DRIVER_DISABLED_SUCCESS,
  DRIVER_NOT_FOUND,
  DRIVER_VERIFIED_SUCCESS,
  INVALID_REQUEST,
  SUB_ADMIN_UPDATED_SUCCESS,
  SUB_ADMIN_CREATED_SUCCESS,
  DUTY_ON_MESSAGE,
  MOBILE_NUMBER_ALREADY_EXISTS,
  DUTY_OFF_MESSAGE,
  EMAIL_ALREADY_EXISTS,
  USER_ALREADY_EXISTS,
  UNKNOW_ERROR,
  DRIVER_CREATED_SUCCESS,
  INVALID_OTP_MESSAGE,
  LEARNER_CHECKIN_SUCCESS,
  INVALID_LEARNER_CHECKIN,
  DRIVER_RATE_SUCCESS_MESSAGE,
  INVOICE_GENERATED_SUCCESS,
  INFORMATION_UPDATED_SUCCESS,
  SCHOOL_UPDATE,
  SCHOOL_DRIVER_UPDATE,
  NO_RECORDS_FOUND
} from "./../constants/Messages";
import Address from "../models/Address";
import CarInfo from "../models/CarInfo";
import Document from "../models/Document";
import { UserTypes } from "../constants/UserTypes";
import { UserRoles } from "../constants/UserRoles";
var nodemailer = require('nodemailer');
//import { Promise, Mongoose } from "mongoose";
import BankDetail from "../models/BankDetail";
import School from "../models/School";
import SchoolToUser from "../models/SchoolToUser";
import { responseStatus } from "./../constants/responseStatus";
import RideBooking from "../models/RideBooking";
import BillingRate from "../models/BillingRate";
import Tax from "../masters/Tax";
import Invoice from "../models/Invoice";
import BookedTestCenter from "../models/BookedTestCenter";
import PushInfo from "../models/PushInfo";
import Utils from "../utilities/utils";
import Booking from "../models/Booking";
import BookTestCenter from "../models/BookedTestCenter";
import { Organization } from "../constants/Organization";
import { DefaultBillingRate } from "../constants/DefaultBillingRate";
import Slot from "../masters/Slot";
import Order from "../models/Order";
import DriverRating from "../models/DriverRating";
import Attribute from "../masters/Attribute";
import RatingAverage from "../models/RatingAverage";
import RideRate from "../masters/RideRate";
import multer = require("multer");
import * as fs from "fs";
import { BaseURL } from "./../constants/BaseURL";
import UserDetails from "./UserDetails";
import DocumentType from "../masters/DocumentType";
import { timingSafeEqual } from "crypto";
import { resolve } from "path";
import { async } from "q";
import City from "../models/City";
import Country from "../models/Country";
import State from "../models/State";

const force_upload = multer({
  limits: { fieldSize: 25 * 1024 * 1024 }
});

export class AdminRouter {
  public router: Router;
  public files: any;

  constructor() {
    this.router = Router();
    this.routes();
  }

  public async enableDisableMasterDocument(req: Request, res: Response) {
    const { token, master, docId } = req.body;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      let mongoose = require("mongoose");
      const { db } = mongoose.connection;
      var id = mongoose.Types.ObjectId(docId);
      var query = { _id: id };
      console.log(master);
      db.collection(master)
        .findOne(query)
        .then(data => {
          if (data.isArchived == true) {
            var queryToUpdate = {
              $set: {
                isArchived: false,
                updatedBy: userDetails["_id"],
                updatedDate: Date.now()
              }
            };
            db.collection(master)
              .findOneAndUpdate(query, queryToUpdate)
              .then(x => {
                //recording logs
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  message: "Record enabled."
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  message: "Record enabled."
                });
              });
          } else {
            var queryToUpdate = {
              $set: {
                isArchived: true,
                updatedBy: userDetails["_id"],
                updatedDate: Date.now()
              }
            };
            db.collection(master)
              .findOneAndUpdate(query, queryToUpdate)
              .then(x => {
                //recording logs
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  message: "Record disabled."
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  message: "Record disabled."
                });
              });
          }
        });
    }
  }

  /*  create new ride for given booking id and orderid in case payment status fail due to some error*/
  public async createNewRide(req: Request, res: Response): void {
    const { token, orderId, bookingId } = req.body;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      Order.findOne({ _id: orderId }).then(fn_data => {
        console.log(fn_data);
        if (fn_data["paymentStatus"] != "COMPLETED") {
          //recording logs
          var obj = new AdminRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            message: "Payment is pending."
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: "Payment is pending."
          });
        } else {
          Order.findOne({ _id: orderId })
            .populate("packageId")
            .populate("slotId")
            .then(result => {
              console.log("paymentStatus", result);
              if (result["paymentStatus"] == "COMPLETED") {
                //Here booking and slots then all done give a message....
                console.log("res", result);

                const { packageId } = result["packageId"]._id;
                const driver = result["driverId"];
                const learner = result["learnerId"];
                const lessonStartDate = result["lessonStartDate"];
                const pickUpAddress = result["pickUpAddressId"];
                let date = new Date(lessonStartDate);

                date.setDate(
                  date.getDate() + Number(result["packageId"].numberOfDay - 1)
                );
                const lessonEndDate = date;

                Booking.findOne({ _id: bookingId })
                  .then(resp => {
                    if (resp && resp._id) {
                      const rideBookings = [];
                      const from = result["slotId"]["fromTime"].split(":");
                      const to = result["slotId"]["toTime"].split(":");

                      for (
                        let i = 0;
                        i < result["packageId"].numberOfDay;
                        i++
                      ) {
                        console.log(
                          "previous::::",
                          lessonStartDate,
                          lessonStartDate.getDate()
                        );
                        let startDateTime = new Date(lessonStartDate);
                        let endDateTime = new Date(lessonStartDate);
                        startDateTime.setDate(
                          lessonStartDate.getDate() + Number(i)
                        );
                        startDateTime.setHours(Number(from[0]));
                        startDateTime.setMinutes(Number(from[1]));

                        endDateTime.setDate(
                          lessonStartDate.getDate() + Number(i)
                        );
                        endDateTime.setHours(Number(to[0]));
                        endDateTime.setMinutes(Number(to[1]));
                        console.log("date::::", startDateTime, endDateTime);

                        const rideBooking = new RideBooking({
                          bookingId: resp._id,
                          status: "NOT_ACTIVE",
                          driverId: driver,
                          slotId: result["slotId"]._id,
                          pickUpAddress: pickUpAddress,
                          dropAddress: pickUpAddress,
                          startDateTime: startDateTime,
                          endDateTime: endDateTime,
                          createdBy: userDetails._id
                        });

                        rideBookings.push(rideBooking);
                        if (i == result["packageId"].numberOfDay - 1) {
                          RideBooking.insertMany(rideBookings)
                            .then(data => {
                              const learnerInvoice = new LearnerInvoice({
                                bookingId: resp._id,
                                driverId: driver,
                                learnerId: learner,
                                tax: result["packageId"]["tax"],
                                amount: result["packageId"]["amount"],
                                learnerInvoiceId: 0,
                                createdBy: userDetails._id
                              });

                              Booking.updateOne(
                                { _id: bookingId },
                                { hasError: null }
                              ).then(() => {});

                              learnerInvoice.save();

                              // Sending notification to driver against new booking by some user.
                              PushInfo.find({
                                userId: { $in: [driver] }
                              }).then(resp => {
                                if (resp && resp.length > 0) {
                                  let to = [];
                                  let title = "New Booking";
                                  let date = new Date(
                                    result["testDate"]
                                  ).toDateString();
                                  let message = "You got a new booking.";
                                  for (let l = 0; l < resp.length; l++) {
                                    to.push(resp[l]["pushToken"]);
                                    if (l == resp.length - 1) {
                                      let params = {
                                        type:
                                          NotificationTypes.LEARNER_BOOKING_CONFIRMATION,
                                        _id: driver
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

                              Curriculum.find().then(curr => {
                                let curs = [];
                                curr.forEach((element, k) => {
                                  curs.push({
                                    bookingId: resp._id,
                                    curriculumId: element._id,
                                    progress: 0,
                                    createdBy: userDetails._id
                                  });

                                  if (k == curr.length - 1) {
                                    LearnerCurriculumProgress.insertMany(curs);
                                  }
                                });
                              });
                              //recording logs
                              var obj = new AdminRouter();
                              var resTemp = {
                                ...responseStatus.SUCCESS,
                                message: ORDER_BOOK_SUCCESS
                              };
                              obj.makeLogs(req, resTemp);
                              obj = null;
                              //recording logs end
                              res.status(200).json({
                                ...responseStatus.SUCCESS,
                                message: ORDER_BOOK_SUCCESS
                              });
                            })
                            .catch(error => {
                              console.log("i m error", error.message);

                              //recording logs

                              var resTemp = {
                                ...responseStatus.FAILURE,
                                errorCode: ErrorCodes.INVALID_REQUEST,

                                message: UNKNOW_ERROR + error["message"]
                              };
                              obj.makeLogs(req, resTemp);
                              obj = null;
                              //recording logs end

                              res.status(200).json({
                                ...responseStatus.FAILURE,
                                errorCode: ErrorCodes.INVALID_REQUEST,
                                message: UNKNOW_ERROR + error["message"]
                              });
                            });
                        }
                      }
                    } else {
                      //recording logs
                      var obj = new AdminRouter();
                      var resTemp = {
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: FAILED_PAYMENT_STATUS_UPDATE
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      res.status(200).json({
                        ...responseStatus.FAILURE,
                        errorCode: ErrorCodes.INVALID_REQUEST,
                        message: FAILED_PAYMENT_STATUS_UPDATE
                      });
                    }
                  })
                  .catch(error => {
                    console.log(error);
                    //recording logs

                    var resTemp = {
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR + error["message"]
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(200).json({
                      ...responseStatus.FAILURE,
                      errorCode: ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR + error["message"]
                    });
                  });

                console.log(
                  "lessonStartDate",
                  lessonStartDate,
                  "lessonEndDate",
                  lessonEndDate
                );
              } else {
                //recording logs
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: PAYMENT_FAILED
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.FAILURE,
                  errorCode: ErrorCodes.INVALID_REQUEST,
                  message: PAYMENT_FAILED
                });
              }
            })
            .catch(error => {
              //recording logs

              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              });
            });
        }
      });
    } //end here order update
  }

  public async subAdminCreate(req: Request, res: Response): void {
    const {
      token,
      firstName,
      lastName,
      email,
      password,
      countryCode,
      adiOrPdiBadgeNumber,
      drivingLicense,
      companions,
      mobileNumber
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
      long
    } = req.body.address;

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token, true);
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      let tempEmail = new RegExp(req.body.email, "i");

      User.findOne({ email: tempEmail }).then(result => {
        console.log(result);
        if (result) {
          //recording logs
          var obj = new AdminRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: EMAIL_ALREADY_EXISTS
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: EMAIL_ALREADY_EXISTS
          });
          console.log("dd");
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
            addressOf: AddressOf.APP_DRIVER,
            createdBy: userDetails._id
          });

          const user = new User({
            firstName,
            lastName,
            email,
            password,
            adiOrPdiBadgeNumber,
            userType: UserTypes.PORTAL_USER,
            userRole: UserRoles.SUB_ADMIN,
            drivingLicense,
            mobileNumber,
            countryCode,
            addresses: [address._id],
            companions: [],
            //documents: documents,
            token: Md5.init(req.body.email),
            createdBy: userDetails._id
          });

          address.save();
          user.save().then(data => {


            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              message: SUB_ADMIN_CREATED_SUCCESS
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: SUB_ADMIN_CREATED_SUCCESS
            });
          });
        }
      });
    }
  }

  public async subAdminUpdate(req: Request, res: Response): void {
    const {
      token,
      adminId,
      isArchived,
      firstName,
      lastName,
      email,
      password,
      countryCode,
      adiOrPdiBadgeNumber,
      drivingLicense,
      companions,
      mobileNumber
    } = req.body;
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

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token, true);
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      const address = {
        name,
        addressLineOne,
        addressLineTwo,
        city,
        state,
        pincode,
        country,
        lat,
        long,
        addressOf: AddressOf.APP_DRIVER,
        isArchived,
        updatedBy: userDetails._id,
        updatedDate: Date.now()
      };

      const user = {
        firstName,
        lastName,
        password,
        adiOrPdiBadgeNumber,
        userType: UserTypes.PORTAL_USER,
        userRole: UserRoles.SUB_ADMIN,
        drivingLicense,
        mobileNumber,
        countryCode,
        companions: [],
        //documents: documents,
        isArchived,
        updatedBy: userDetails._id,
        updatedDate: Date.now()
      };

      Address.findOneAndUpdate({ _id: addressId }, address).then(() => {});
      User.findOneAndUpdate({ _id: adminId }, user).then(data => {
        //recording logs
        var obj = new AdminRouter();
        var resTemp = {
          ...responseStatus.SUCCESS,
          message: SUB_ADMIN_UPDATED_SUCCESS
        };
        obj.makeLogs(req, resTemp);
        obj = null;
        //recording logs end
        res.status(200).json({
          ...responseStatus.SUCCESS,
          message: SUB_ADMIN_UPDATED_SUCCESS
        });
      });
    }
  }

  public async getSubAdmin(req: Request, res: Response) {
    const { token, page, keyword, isSearching } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      User.find({
        userType: UserTypes.PORTAL_USER,
        userRole: UserRoles.SUB_ADMIN
      })
        .populate("addresses")
        .then(data => {
          console.log(data);
          var finalResult1 = data;
          var finalData = [];
          let keyword1 = new RegExp("^" + keyword, "i");
          var finalResult = [];
          if (isSearching) {
            finalResult1.forEach(x => {
              if (
                x["firstName"].match(keyword1) ||
                x["email"].match(keyword1) ||
                x["mobileNumber"].match(keyword1)
              ) {
                finalResult.push(x);
              }
            });
          } else {
            console.log("pp");
            finalResult = finalResult1;
          }

          var totalPages = Math.round(finalResult.length);

          if (finalResult.length >= ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
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
        });
    }
  }

  public async learnerCreate(req: Request, res: Response): void {
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

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(req.body.token);
    let userDetails = await UserDetails.getUserDetails(req.body.token);
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
      const user = new User({
        mobileNumber,
        firstName,
        lastName,
        email,
        password,
        dob,
        drivingLicense,
        userType,
        userRole,
        token: token,
        countryCode,
        createdBy: userDetails._id
      });
      var tempEmail = new RegExp(email, "i");
      console.log(tempEmail);
      User.findOne({ email: tempEmail }).then(r => {
        if (r != null) {
          //recording logs
          var obj = new AdminRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: EMAIL_ALREADY_EXISTS
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res.status(200).json({
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: EMAIL_ALREADY_EXISTS
          });
        } else {
          User.findOne({ mobileNumber, countryCode })
            .then(result => {
              if (result && result._id) {
                //recording logs
                var obj = new AdminRouter();
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
                      name: result['firstName'] + " " + result['lastName'],
                      subject: "Learner Registration..!" 
                    };
                    Utils.emailSend(locals) 
                    //recording logs
                    var obj = new AdminRouter();
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
                    var obj = new AdminRouter();
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
              var obj = new AdminRouter();
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

  public login(req: Request, res: Response): void {
    const { email, password } = req.body;
    const token = Md5.init(req.body.email);

    if (req.body.email && req.body.password) {
      User.findOne({
        email,
        password,
        userType: UserTypes.PORTAL_USER,
        $or: [
          { userRole: UserRoles.SUPER_ADMIN },
          { userRole: UserRoles.SUB_ADMIN }
        ]
      })
        .then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new AdminRouter();
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
            if (data["isArchived"]) {
              //recording logs
              var obj = new AdminRouter();
              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: ACCOUNT_TEMPORARY_DISABLED
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: ACCOUNT_TEMPORARY_DISABLED
              });
            } else {
              //reupdating token
              User.findOneAndUpdate({ _id: data._id }, { token: token }).then(
                result => {
                  User.updateOne(
                    { _id: result._id },
                    { updatedDate: Date.now() }
                  ).then(() => {});
                  //recording logs
                  var obj = new AdminRouter();
                  var resTemp1 = { ...responseStatus.SUCCESS, data };
                  obj.makeLogs(req, resTemp1);
                  obj = null;
                  //recording logs end
                  res.status(200).json({ ...responseStatus.SUCCESS, data });
                }
              );
            }
          }
        })
        .catch(error => {
          //recording logs
          var obj = new AdminRouter();
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
      var obj = new AdminRouter();
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

  public async learners(req: Request, res: Response): void {
    const { token, page, keyword, isSearching } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      User.find({
        userType: UserTypes.LEARNER,
        userRole: UserRoles.APP_USER
      })
        .then(data => {
          var finalResult1 = data;
          var finalData = [];

          let keyword1 = new RegExp("^" + keyword, "i");

          var finalResult = [];
          if (isSearching) {
            finalResult1.forEach(x => {
              if (
                x["firstName"].match(keyword1) ||
                x["email"].match(keyword1) ||
                x["mobileNumber"].match(keyword1)
              ) {
                finalResult.push(x);
              }
            });
          } else {
            finalResult = finalResult1;
          }

          var totalPages = Math.round(finalResult.length);
          if (finalResult.length > ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }

            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            });
          }

          //res.status(200).json({ ...responseStatus.SUCCESS, data });
        })
        .catch(error => {
          //recording logs
          var obj = new AdminRouter();
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

  public async enableDisableSchool(req: Request, res: Response) {
    const { token, schoolId } = req.body;

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
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
    } else {
      School.findOne({ _id: schoolId }).then(data => {
        console.log(data);
        if (data != null || !data) {
          var message = SCHOOL_ENABLED_SUCCESS;

          if (data["isArchived"]) {
            School.updateOne(
              { _id: schoolId },
              {
                isArchived: false,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            ).then(() => {});
            SchoolToUser.find({ school: schoolId }).then(data => {
              data.forEach(ele => {
                SchoolToUser.updateOne(
                  { _id: ele["_id"] },
                  {
                    isArchived: false,
                    updatedBy: userDetails._id,
                    updatedDate: Date.now()
                  }
                ).then(() => {});
                User.updateOne(
                  { _id: ele["user"] },
                  {
                    isArchived: false,
                    updatedBy: userDetails._id,
                    updatedDate: Date.now()
                  }
                ).then(() => {});
              });
            });

            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              message: message
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: message
            });
          } else {
            var message = SCHOOL_DISABLED_SUCCESS;

            School.updateOne(
              { _id: schoolId },
              {
                isArchived: true,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            ).then(() => {});
            SchoolToUser.find({ school: schoolId }).then(data => {
              data.forEach(ele => {
                SchoolToUser.updateOne(
                  { _id: ele["_id"] },
                  {
                    isArchived: true,
                    updatedBy: userDetails._id,
                    updatedDate: Date.now()
                  }
                ).then(() => {});
                User.updateOne(
                  { _id: ele["user"] },
                  {
                    isArchived: true,
                    token: "",
                    updatedBy: userDetails._id,
                    updatedDate: Date.now()
                  }
                ).then(() => {});
              });
            });
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              message: message
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: message
            });
          }
        } else {
          var message = SCHOOL_NOT_FOUND;
          //recording logs
          var obj = new AdminRouter();
          var resTemp11 = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: DRIVER_NOT_FOUND
          };
          obj.makeLogs(req, resTemp11);
          obj = null;
          //recording logs end
          res
            .status(200)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: DRIVER_NOT_FOUND
            });
        }
      });
    }
  }

  public async acceptDisableUsers(req: Request, res: Response) {
    const { token, driverId, action } = req.body;

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

    if (!checkTokenResult) {
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
    } else {
      User.findOne({ _id: driverId }).then(data => {
        console.log(data);
        if (data != null || !data) {
          if (action == "accept" || action == "ACCEPT") {
            Document.findOneAndUpdate(
              { _id: data["documents"][0] },
              {
                isVerified: 1,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            ).then(data => {});
            Document.findOneAndUpdate(
              { _id: data["documents"][1] },
              {
                isVerified: 1,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            ).then(data => {});
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              message: DRIVER_VERIFIED_SUCCESS
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: DRIVER_VERIFIED_SUCCESS
            });
          } else {
            var message = "";

            if (data["isArchived"]) {
              User.updateOne(
                { _id: driverId },
                {
                  isArchived: false,
                  updatedBy: userDetails._id,
                  updatedDate: Date.now()
                }
              ).then(() => {});
              if (data["userType"] == UserTypes.DRIVER) {
                message = DRIVER_ENABLED_SUCCESS;
              } else if (data["userType"] == UserTypes.LEARNER) {
                message = LEARNER_ENABLED_SUCCESS;
              } else {
                message = SUB_ADMIN_ENABLED_SUCCESS;
              }
              //recording logs
              var obj = new AdminRouter();
              var resTemp1 = {
                ...responseStatus.SUCCESS,
                message: message
              };
              obj.makeLogs(req, resTemp1);
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
              if (data["userType"] == UserTypes.DRIVER) {
                message = DRIVER_DISABLED_SUCCESS;
              } else if (data["userType"] == UserTypes.LEARNER) {
                message = LEARNER_DISABLED_SUCCESS;
              } else {
                message = SUB_ADMIN_DISABLED_SUCCESS;
              }
              //recording logs
              var obj = new AdminRouter();
              var resTemp1 = {
                ...responseStatus.SUCCESS,
                message: message
              };
              obj.makeLogs(req, resTemp1);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.SUCCESS,
                message: message
              });
            }
          }
        } else {
          if (data["userType"] == UserTypes.DRIVER) {
            message = DRIVER_NOT_FOUND;
          } else if (data["userType"] == UserTypes.LEARNER) {
            message = LEARNER_NOT_FOUND;
          } else {
            message = SUB_ADMIN_NOT_FOUND;
          }
          //recording logs
          var obj = new AdminRouter();
          var resTemp11 = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: DRIVER_NOT_FOUND
          };
          obj.makeLogs(req, resTemp11);
          obj = null;
          //recording logs end
          res
            .status(200)
            .json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: DRIVER_NOT_FOUND
            });
        }
      });
    }
  }

  public async drivers(req: Request, res: Response): void {
    var async = require("async");
    const { token, page, keyword, isSearching } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);

    if (!checkTokenResult) {
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
    } else {
      async.parallel(
        [
          function(callback) {
            User.find()
              .populate("documents")
              .then(data1 => {
                //console.log("polk");
                callback(null, data1);
              });
          },

          function(callback) {
            console.log("ji");

            User.aggregate([
              {
                $lookup: {
                  from: "schooltousers",
                  localField: "_id",
                  foreignField: "user",
                  as: "SchoolToUser"
                }
              },
              {
                $unwind: {
                  path: "$SchoolToUser",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $lookup: {
                  from: "schools",
                  localField: "SchoolToUser.school",
                  foreignField: "_id",
                  as: "SchoolToUser.school"
                }
              }
            ]).then(data => {
              console.log("ddss");
              callback(null, data);
            });
          }
        ],
        function(error, results) {
          console.log(results.length, "poloo");

          results[0].forEach(function(ele, index) {
            //  console.log(ele._id,results[1][index]._id);

            results[1][index].documents = ele.documents;
          });

          var finalResult1 = results[1].filter(obj => {
            return (
              obj["userType"] == UserTypes.DRIVER &&
              obj["userRole"] == UserRoles.APP_USER
            );
          });
          var finalData = [];
          let keyword1 = new RegExp("^" + keyword, "i");

          //  console.log(finalResult1,"i m here");

          var finalResult = [];
          if (isSearching) {
            finalResult1.forEach(x => {
              console.log(x.firstName);

              if (
                x.firstName.match(keyword1) ||
                x.email.match(keyword1) ||
                x.mobileNumber.match(keyword1)
              ) {
                if (
                  x.SchoolToUser["school"] != undefined &&
                  x.SchoolToUser["school"].length > 0
                ) {
                  if (x.SchoolToUser.school[0]["schoolName"].match(keyword1)) {
                    finalResult.push(x);
                  } else {
                    finalResult.push(x);
                  }
                } else {
                  finalResult.push(x);
                }
              } else {
                if (
                  x.SchoolToUser.school != undefined &&
                  x.SchoolToUser.school.length > 0
                ) {
                  //console.log("oplk");
                  if (x.SchoolToUser.school[0]["schoolName"].match(keyword1)) {
                    finalResult.push(x);
                  }
                }
              }
            });
          } else {
            console.log("pp");
            finalResult = finalResult1;
          }

          var totalPages = Math.round(finalResult.length);

          if (finalResult.length >= ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            });
          }

          //console.log(results[0]);
        }
      );

      // User.aggregate([      {
      //         $lookup:
      //           {
      //             from: "schooltousers",
      //             localField: "_id",
      //             foreignField: "user",
      //             as: "SchoolToUser"
      //           }
      //      },{
      //       $unwind: {
      //         path:"$SchoolToUser",
      //       preserveNullAndEmptyArrays: true
      //      }
      //   },
      //   {
      //       $lookup: {
      //           from: "schools",
      //           localField: "SchoolToUser.school",
      //           foreignField: "_id",
      //           as: "SchoolToUser.school"
      //       },
      //    } ], function( e, result ) {

      //   if ( e ) return;

      //   // You would probably have to do some loop here, as probably 'result' is array
      //   User.find().populate("documents").then((data)=>{

      //       res.status(200).json({ ...responseStatus.SUCCESS, data: data,userInfo:result  });

      //   });

      // })

      //   User.aggregate([

      //     {
      //       $lookup:
      //         {
      //           from: "schooltousers",
      //           localField: "_id",
      //           foreignField: "user",
      //           as: "SchoolToUser"
      //         }
      //    },{
      //     $unwind: {
      //       path:"$SchoolToUser",
      //     preserveNullAndEmptyArrays: true
      //    }
      // },
      // {
      //     $lookup: {
      //         from: "schools",
      //         localField: "SchoolToUser.school",
      //         foreignField: "_id",
      //         as: "SchoolToUser.school"
      //     },
      //  }
      // ]).exec((err,data)=>{
      //    // User.class
      // })
      // ]).then((data)=>{
      //   //console.log("gsgds",data);

      //   var x  =  data as [User];

      //   console.log("i m data",x);

      //   // data.forEach(function(v,i,x){
      //   //    Document.findById({$in:v["documents"]}).then((d)=>{
      //   //       data[i]["documents"] = [];
      //   //       data[i]["documents"] = d;
      //   //       console.log("ff",data);
      //   //    });

      //   // });
      //   const finalResult = data.filter(obj => { return (obj['userType'] == UserTypes.DRIVER && obj['userRole'] == UserRoles.APP_USER) });
      //  // console.log("gsgds",finalResult);

      //   res.status(200).json({ ...responseStatus.SUCCESS, data: finalResult  });

      //  });

      // User.find({ userType: UserTypes.DRIVER, userRole: UserRoles.APP_USER })
      // .populate({
      //     path:"school",
      //     model:"User",
      //   populate:{
      //     path:"_id",
      //     model:"SchoolToUser",
      //     populate:{
      //       path:"school",
      //       model:"School",

      //     }
      //   }
      // })
      //   .then((data) => {

      //     res.status(200).json({ ...responseStatus.SUCCESS, data });
      //   })
      //   .catch((error) => {

      //     res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });

      //   });
    }
  }

  public async learnerUpdate(req: Request, res: Response): void {
    const { token, _id } = req.body;
    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(req.body.token);

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
      userDetails._id;
      User.updateOne(
        { _id: _id },
        { updatedBy: userDetails._id, updatedDate: Date.now() }
      ).then(() => {});
      User.findOneAndUpdate({ _id }, req.body)
        .then(data => {
          console.log(data);
          if (!data || data == null) {
            //recording logs
            var obj = new AdminRouter();
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
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              message: "PROFILE_UPDATED_SUCCESS_MESSAGE"
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: "PROFILE_UPDATED_SUCCESS_MESSAGE"
            });
          }
        })
        .catch(error => {
          //recording logs
          var obj = new AdminRouter();
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

  public async driverUpdate(req: Request, res: Response): void {
    const { token, _id } = req.body;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      User.updateOne(
        { _id: _id },
        { updatedBy: userDetails._id, updatedDate: Date.now() }
      ).then(() => {});
      User.findOneAndUpdate({ _id }, req.body)
        .then(data => {
          console.log(data);
          if (!data || data == null) {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              message: INVALID_REQUEST
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              message: INVALID_REQUEST
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              message: "PROFILE_UPDATED_SUCCESS_MESSAGE"
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              message: "PROFILE_UPDATED_SUCCESS_MESSAGE"
            });
          }
        })
        .catch(error => {
          //recording logs
          var obj = new AdminRouter();
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

  public async profile(req: Request, res: Response): void {
    const { token, mobileNumber } = req.body;
    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (!checkTokenResult) {
      if (req.body.mobileNumber && req.body.token) {
        User.findOne({
          token,
          mobileNumber,
          userType: UserTypes.PORTAL_USER,
          userRole: UserRoles.SUPER_ADMIN
        })
          .then(data => {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = { ...responseStatus.SUCCESS, data };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data });
          })
          .catch(error => {
            //recording logs
            var obj = new AdminRouter();
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

  public async generateInvoice(req: Request, res: Response): void {
    const { token, fromDate, toDate, userId } = req.body;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      if (req.body.token && req.body.fromDate && req.body.toDate) {
        User.findOne({
          token,
          userType: UserTypes.PORTAL_USER,
          userRole: UserRoles.SUPER_ADMIN
        })
          .then(found => {
            if (found._id) {
              if (userId) {
                User.findOne({ _id: userId })
                  .then(result => {
                    if (
                      result["userType"] == UserTypes.PORTAL_USER &&
                      result["userRole"] == UserRoles.SCHOOL_USER
                    ) {
                      // Invoice of all drivers of a particular school in the name of school.
                      SchoolToUser.findOne({ user: result._id })
                        .then(resp => {
                          if (!resp || resp == null) {
                            //recording logs
                            var obj = new AdminRouter();
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
                          } else {
                            SchoolToUser.find({
                              school: resp["school"],
                              user: { $nin: result._id }
                            })
                              .then(stuData => {
                                if (stuData && stuData.length > 0) {
                                  let users = [];
                                  for (let i = 0; i < stuData.length; i++) {
                                    users.push(stuData["user"]);
                                    if (i == stuData.length - 1) {
                                      RideBooking.find({
                                        driverId: { $in: users },
                                        status: "COMPLETED",
                                        invoiceId: "",
                                        startDateTime: {
                                          $gt: new Date(fromDate)
                                        },
                                        endDateTime: {
                                          $lt: new Date(toDate).setDate(
                                            new Date(toDate).getDate() + 1
                                          )
                                        }
                                      })
                                        .then(rbData => {
                                          if (rbData && rbData.length > 0) {
                                            BillingRate.findOne({ userId })
                                              .then(brData => {
                                                if (!brData || brData == null) {
                                                  //recording logs
                                                  var obj = new AdminRouter();
                                                  var resTemp1 = {
                                                    ...responseStatus.FAILURE,
                                                    errorCode:
                                                      ErrorCodes.INVALID_REQUEST,
                                                    message: INVALID_REQUEST
                                                  };
                                                  obj.makeLogs(req, resTemp1);
                                                  obj = null;
                                                  //recording logs end
                                                  res.status(200).json({
                                                    ...responseStatus.FAILURE,
                                                    errorCode:
                                                      ErrorCodes.INVALID_REQUEST,
                                                    message: INVALID_REQUEST
                                                  });
                                                } else {
                                                  Tax.findOne({
                                                    taxFor:
                                                      TaxFor.DRIVER_N_SCHOOL
                                                  })
                                                    .then(tData => {
                                                      if (
                                                        !tData &&
                                                        tData == null
                                                      ) {
                                                        //recording logs
                                                        var obj = new AdminRouter();
                                                        var resTemp1 = {
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message: INVALID_REQUEST
                                                        };
                                                        obj.makeLogs(
                                                          req,
                                                          resTemp1
                                                        );
                                                        obj = null;
                                                        //recording logs end
                                                        res.status(200).json({
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message: INVALID_REQUEST
                                                        });
                                                      } else {
                                                        let noOfRides =
                                                          rbData.length;
                                                        let amount =
                                                          noOfRides *
                                                          brData["rate"];
                                                        let tax =
                                                          (tData[
                                                            "taxPercentage"
                                                          ] /
                                                            100) *
                                                            amount <
                                                          0
                                                            ? 0
                                                            : (tData[
                                                                "taxPercentage"
                                                              ] /
                                                                100) *
                                                              amount;
                                                        let invoice = new Invoice(
                                                          {
                                                            tax: tax,
                                                            amount: amount,
                                                            driverId: userId,
                                                            createdBy:
                                                              userDetails._id
                                                          }
                                                        );
                                                        invoice
                                                          .save()
                                                          .then(invoiceData => {
                                                            //recording logs
                                                            var obj = new AdminRouter();
                                                            var resTemp1 = {
                                                              ...responseStatus.SUCCESS,
                                                              message: INVOICE_GENERATED_SUCCESS,
                                                              data: invoiceData
                                                            };
                                                            obj.makeLogs(
                                                              req,
                                                              resTemp1
                                                            );
                                                            obj = null;
                                                            //recording logs end
                                                            res
                                                              .status(200)
                                                              .json({
                                                                ...responseStatus.SUCCESS,
                                                                message: INVOICE_GENERATED_SUCCESS,
                                                                data: invoiceData
                                                              });
                                                          })
                                                          .catch(err => {
                                                            //recording logs
                                                            var obj = new AdminRouter();
                                                            var resTemp = {
                                                              ...responseStatus.FAILURE,
                                                              errorCode:
                                                                ErrorCodes.INVALID_REQUEST,
                                                              message:
                                                                UNKNOW_ERROR +
                                                                err["message"]
                                                            };
                                                            obj.makeLogs(
                                                              req,
                                                              resTemp
                                                            );
                                                            obj = null;
                                                            //recording logs end
                                                            res
                                                              .status(500)
                                                              .json({
                                                                ...responseStatus.FAILURE,
                                                                errorCode:
                                                                  ErrorCodes.INVALID_REQUEST,
                                                                message: UNKNOW_ERROR
                                                              });
                                                          });
                                                      }
                                                    })
                                                    .catch(err => {
                                                      //recording logs
                                                      var obj = new AdminRouter();
                                                      var resTemp = {
                                                        ...responseStatus.FAILURE,
                                                        errorCode:
                                                          ErrorCodes.INVALID_REQUEST,
                                                        message:
                                                          UNKNOW_ERROR +
                                                          err["message"]
                                                      };
                                                      obj.makeLogs(
                                                        req,
                                                        resTemp
                                                      );
                                                      obj = null;
                                                      //recording logs end
                                                      res.status(500).json({
                                                        ...responseStatus.FAILURE,
                                                        errorCode:
                                                          ErrorCodes.INVALID_REQUEST,
                                                        message: UNKNOW_ERROR
                                                      });
                                                    });
                                                }
                                              })
                                              .catch(err => {
                                                //recording logs
                                                var obj = new AdminRouter();
                                                var resTemp = {
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message:
                                                    UNKNOW_ERROR +
                                                    err["message"]
                                                };
                                                obj.makeLogs(req, resTemp);
                                                obj = null;
                                                //recording logs end
                                                res.status(500).json({
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message: UNKNOW_ERROR
                                                });
                                              });
                                          } else {
                                            //recording logs
                                            var obj = new AdminRouter();
                                            var resTemp1 = {
                                              ...responseStatus.FAILURE,
                                              errorCode:
                                                ErrorCodes.INVALID_REQUEST,
                                              message: INVALID_REQUEST
                                            };
                                            obj.makeLogs(req, resTemp1);
                                            obj = null;
                                            //recording logs end
                                            res.status(200).json({
                                              ...responseStatus.FAILURE,
                                              errorCode:
                                                ErrorCodes.INVALID_REQUEST,
                                              message: INVALID_REQUEST
                                            });
                                          }
                                        })
                                        .catch(err => {
                                          //recording logs
                                          var obj = new AdminRouter();
                                          var resTemp = {
                                            ...responseStatus.FAILURE,
                                            errorCode:
                                              ErrorCodes.INVALID_REQUEST,
                                            message:
                                              UNKNOW_ERROR + err["message"]
                                          };
                                          obj.makeLogs(req, resTemp);
                                          obj = null;
                                          //recording logs end
                                          res.status(500).json({
                                            ...responseStatus.FAILURE,
                                            errorCode:
                                              ErrorCodes.INVALID_REQUEST,
                                            message: UNKNOW_ERROR
                                          });
                                        });
                                    }
                                  }
                                } else {
                                  //recording logs
                                  var obj = new AdminRouter();
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
                              .catch(err => {
                                //recording logs
                                var obj = new AdminRouter();
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
                          var obj = new AdminRouter();
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
                    } else if (
                      result["userType"] == UserTypes.DRIVER &&
                      result["userRole"] == UserRoles.APP_USER
                    ) {
                      SchoolToUser.findOne({ user: result._id })
                        .then(resp => {
                          if (resp._id) {
                            //recording logs
                            var obj = new AdminRouter();
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
                          } else {
                            if (
                              result["userType"] == UserTypes.DRIVER &&
                              result["userRole"] == UserRoles.APP_USER
                            ) {
                              // get invoices of individual driver...
                              RideBooking.find({
                                driverId: userId,
                                status: "COMPLETED",
                                invoiceId: "",
                                startDateTime: { $gt: new Date(fromDate) },
                                endDateTime: {
                                  $lt: new Date(toDate).setDate(
                                    new Date(toDate).getDate() + 1
                                  )
                                }
                              })
                                .then(rbData => {
                                  console.log(rbData);
                                  if (rbData && rbData.length > 0) {
                                    BillingRate.findOne({ userId })
                                      .then(brData => {
                                        if (!brData || brData == null) {
                                          //recording logs
                                          var obj = new AdminRouter();
                                          var resTemp1 = {
                                            ...responseStatus.FAILURE,
                                            errorCode:
                                              ErrorCodes.INVALID_REQUEST,
                                            message: INVALID_REQUEST
                                          };
                                          obj.makeLogs(req, resTemp1);
                                          obj = null;
                                          //recording logs end
                                          res.status(200).json({
                                            ...responseStatus.FAILURE,
                                            errorCode:
                                              ErrorCodes.INVALID_REQUEST,
                                            message: INVALID_REQUEST
                                          });
                                        } else {
                                          Tax.findOne({
                                            taxFor: TaxFor.DRIVER_N_SCHOOL
                                          })
                                            .then(tData => {
                                              if (!tData && tData == null) {
                                                //recording logs
                                                var obj = new AdminRouter();
                                                var resTemp1 = {
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message: INVALID_REQUEST
                                                };
                                                obj.makeLogs(req, resTemp1);
                                                obj = null;
                                                //recording logs end
                                                res.status(200).json({
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message: INVALID_REQUEST
                                                });
                                              } else {
                                                let noOfRides = rbData.length;
                                                let amount =
                                                  noOfRides * brData["rate"];
                                                let tax =
                                                  (tData["taxPercentage"] /
                                                    100) *
                                                    amount <
                                                  0
                                                    ? 0
                                                    : (tData["taxPercentage"] /
                                                        100) *
                                                      amount;
                                                let invoice = new Invoice({
                                                  tax: tax,
                                                  amount: amount,
                                                  driverId: userId,
                                                  createdBy: userDetails._id
                                                });
                                                invoice
                                                  .save()
                                                  .then(invoiceData => {
                                                    //recording logs
                                                    var obj = new AdminRouter();
                                                    var resTemp1 = {
                                                      ...responseStatus.SUCCESS,
                                                      message: INVOICE_GENERATED_SUCCESS,
                                                      data: invoiceData
                                                    };
                                                    obj.makeLogs(req, resTemp1);
                                                    obj = null;
                                                    //recording logs end
                                                    res.status(200).json({
                                                      ...responseStatus.SUCCESS,
                                                      message: INVOICE_GENERATED_SUCCESS,
                                                      data: invoiceData
                                                    });
                                                  })
                                                  .catch(err => {
                                                    //recording logs
                                                    var obj = new AdminRouter();
                                                    var resTemp = {
                                                      ...responseStatus.FAILURE,
                                                      errorCode:
                                                        ErrorCodes.INVALID_REQUEST,
                                                      message:
                                                        UNKNOW_ERROR +
                                                        err["message"]
                                                    };
                                                    obj.makeLogs(req, resTemp);
                                                    obj = null;
                                                    //recording logs end
                                                    res.status(500).json({
                                                      ...responseStatus.FAILURE,
                                                      errorCode:
                                                        ErrorCodes.INVALID_REQUEST,
                                                      message: UNKNOW_ERROR
                                                    });
                                                  });
                                              }
                                            })
                                            .catch(err => {
                                              //recording logs
                                              var obj = new AdminRouter();
                                              var resTemp = {
                                                ...responseStatus.FAILURE,
                                                errorCode:
                                                  ErrorCodes.INVALID_REQUEST,
                                                message:
                                                  UNKNOW_ERROR + err["message"]
                                              };
                                              obj.makeLogs(req, resTemp);
                                              obj = null;
                                              //recording logs end
                                              res.status(500).json({
                                                ...responseStatus.FAILURE,
                                                errorCode:
                                                  ErrorCodes.INVALID_REQUEST,
                                                message: UNKNOW_ERROR
                                              });
                                            });
                                        }
                                      })
                                      .catch(err => {
                                        //recording logs
                                        var obj = new AdminRouter();
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
                                    var obj = new AdminRouter();
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
                                .catch(err => {
                                  //recording logs
                                  var obj = new AdminRouter();
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
                              var obj = new AdminRouter();
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
                          }
                        })
                        .catch(err => {
                          //recording logs
                          var obj = new AdminRouter();
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
                      var obj = new AdminRouter();
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
                  .catch(err => {
                    //recording logs
                    var obj = new AdminRouter();
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
                // get invoices of all school users and individual...
                // Here I get all rides of all drivers within date range which has not been paid
                RideBooking.find({
                  status: "COMPLETED",
                  invoiceId: "",
                  startDateTime: { $gt: new Date(fromDate) },
                  endDateTime: {
                    $lt: new Date(toDate).setDate(
                      new Date(toDate).getDate() + 1
                    )
                  }
                })
                  .then(rbData => {
                    let users = [];
                    if (rbData && rbData.length > 0) {
                      for (let i = 0; i < rbData.length; i++) {
                        users.push(rbData[i]["driverId"]);
                        if (i == rbData.length - 1) {
                          // Here i will get all drivers which are under some school
                          SchoolToUser.find({ user: { $in: users } })
                            .then(stuData => {
                              let stuArray: any = [];
                              let schoolDrivers: any = [];
                              let individualDrivers: any = [];
                              stuArray = stuData;

                              if (stuData && stuData.length > 0) {
                                for (let l = 0; l < rbData.length; l++) {
                                  let inde = stuArray.findIndex(x => {
                                    return x.user == rbData[l]["driverId"];
                                  });
                                  if (inde > -1) {
                                    schoolDrivers.push({
                                      rides: rbData[l],
                                      school: stuArray[inde]["school"]
                                    });
                                  } else {
                                    individualDrivers.push(rbData[l]);
                                  }
                                  if (l == rbData.length - 1) {
                                    let distinctSchool = [];
                                    let ds = stuArray.map(data => data.school);
                                    distinctSchool = ds.filter(
                                      (x, i, a) => x && a.indexOf(x) === i
                                    );
                                    SchoolToUser.find({
                                      school: { $in: distinctSchool }
                                    })
                                      .populate({
                                        path: "user",
                                        match: {
                                          userType: UserTypes.PORTAL_USER,
                                          userRole: UserRoles.SCHOOL_USER
                                        }
                                      })
                                      .then(result => {
                                        //go here
                                        let finalResult: any = [];
                                        finalResult = result.filter(obj => {
                                          return obj["user"];
                                        });
                                        for (
                                          let k = 0;
                                          k < schoolDrivers.length;
                                          k++
                                        ) {
                                          let index = finalResult.findIndex(
                                            x => {
                                              return (
                                                x.school ==
                                                schoolDrivers[k]["school"]
                                              );
                                            }
                                          );
                                          if (index > -1) {
                                            if (
                                              finalResult[index] &&
                                              finalResult[index]["rides"]
                                            ) {
                                              for (
                                                let j = 0;
                                                j <
                                                schoolDrivers[k]["rides"]
                                                  .length;
                                                j++
                                              ) {
                                                finalResult[index][
                                                  "rides"
                                                ].push(
                                                  schoolDrivers[k]["rides"][j]
                                                );
                                              }
                                            } else {
                                              finalResult[index].push({
                                                user:
                                                  finalResult[index]["user"],
                                                school:
                                                  finalResult[index]["school"],
                                                rides: schoolDrivers[k]["rides"]
                                              }); //something is implemented wrong here...
                                            }
                                          }
                                          if (k == schoolDrivers.length - 1) {
                                            //create invoices for school....
                                            BillingRate.find()
                                              .then(brData => {
                                                let bRData: any = [];
                                                bRData = brData;
                                                if (!brData || brData == null) {
                                                  res.status(200).json({
                                                    ...responseStatus.FAILURE,
                                                    errorCode:
                                                      ErrorCodes.INVALID_REQUEST,
                                                    message: INVALID_REQUEST
                                                  });
                                                } else {
                                                  Tax.findOne({
                                                    taxFor:
                                                      TaxFor.DRIVER_N_SCHOOL
                                                  })
                                                    .then(tData => {
                                                      if (
                                                        !tData &&
                                                        tData == null
                                                      ) {
                                                        res.status(200).json({
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message: INVALID_REQUEST
                                                        });
                                                      } else {
                                                        let groupIndividual: any = [];

                                                        //creating invoice of schools
                                                        let schoolInvoices = [];
                                                        let individualInvoices = [];

                                                        for (
                                                          let m;
                                                          m <
                                                          finalResult.length;
                                                          m++
                                                        ) {
                                                          let indx = bRData.findIndex(
                                                            x => {
                                                              return (
                                                                x.userId ==
                                                                finalResult[m][
                                                                  "user"
                                                                ]["_id"]
                                                              );
                                                            }
                                                          );
                                                          if (indx > -1) {
                                                            let noOfRides =
                                                              finalResult[m][
                                                                "rides"
                                                              ].length;
                                                            let amount =
                                                              noOfRides *
                                                              brData[indx][
                                                                "rate"
                                                              ];
                                                            let tax =
                                                              (tData[
                                                                "taxPercentage"
                                                              ] /
                                                                100) *
                                                                amount <
                                                              0
                                                                ? 0
                                                                : (tData[
                                                                    "taxPercentage"
                                                                  ] /
                                                                    100) *
                                                                  amount;
                                                            schoolInvoices.push(
                                                              {
                                                                tax: tax,
                                                                amount: amount,
                                                                createdBy:
                                                                  userDetails._id,
                                                                driverId:
                                                                  finalResult[
                                                                    m
                                                                  ]["user"][
                                                                    "_id"
                                                                  ]
                                                              }
                                                            );
                                                          }
                                                          console.log(
                                                            "schoolInvoices",
                                                            schoolInvoices
                                                          );
                                                          if (
                                                            m ==
                                                            finalResult.length -
                                                              1
                                                          ) {
                                                            // Insertion
                                                            //creating invoices of individual drivers...

                                                            for (
                                                              let a = 0;
                                                              a <
                                                              individualDrivers.length;
                                                              a++
                                                            ) {
                                                              let inx = groupIndividual.findIndex(
                                                                x => {
                                                                  return (
                                                                    x.userId ==
                                                                    individualDrivers[
                                                                      a
                                                                    ][
                                                                      "driverId"
                                                                    ]
                                                                  );
                                                                }
                                                              );
                                                              if (inx > -1) {
                                                                groupIndividual[
                                                                  inx
                                                                ]["rides"].push(
                                                                  individualDrivers[
                                                                    a
                                                                  ]
                                                                );
                                                              } else {
                                                                groupIndividual.push(
                                                                  {
                                                                    userId:
                                                                      individualDrivers[
                                                                        a
                                                                      ][
                                                                        "driverId"
                                                                      ],
                                                                    rides: [
                                                                      individualDrivers[
                                                                        a
                                                                      ]
                                                                    ]
                                                                  }
                                                                );
                                                              }
                                                              if (
                                                                a ==
                                                                individualDrivers.length -
                                                                  1
                                                              ) {
                                                                for (
                                                                  let c;
                                                                  c <
                                                                  groupIndividual.length;
                                                                  c++
                                                                ) {
                                                                  let inxx = bRData.findIndex(
                                                                    x => {
                                                                      return (
                                                                        x.userId ==
                                                                        groupIndividual[
                                                                          c
                                                                        ][
                                                                          "userId"
                                                                        ]
                                                                      );
                                                                    }
                                                                  );
                                                                  if (
                                                                    inxx > -1
                                                                  ) {
                                                                    let inoOfRides =
                                                                      groupIndividual[
                                                                        c
                                                                      ]["rides"]
                                                                        .length;
                                                                    let iamount =
                                                                      inoOfRides *
                                                                      brData[
                                                                        inxx
                                                                      ]["rate"];
                                                                    let itax =
                                                                      (tData[
                                                                        "taxPercentage"
                                                                      ] /
                                                                        100) *
                                                                        iamount <
                                                                      0
                                                                        ? 0
                                                                        : (tData[
                                                                            "taxPercentage"
                                                                          ] /
                                                                            100) *
                                                                          iamount;
                                                                    individualInvoices.push(
                                                                      {
                                                                        tax: itax,
                                                                        amount: iamount,
                                                                        createdBy:
                                                                          userDetails._id,
                                                                        driverId:
                                                                          groupIndividual[
                                                                            c
                                                                          ][
                                                                            "userId"
                                                                          ]
                                                                      }
                                                                    );
                                                                  }
                                                                  console.log(
                                                                    "individualInvoices",
                                                                    individualInvoices
                                                                  );
                                                                  if (
                                                                    c ==
                                                                    groupIndividual.length -
                                                                      1
                                                                  ) {
                                                                    // Insertion
                                                                    Invoice.collection
                                                                      .insert(
                                                                        schoolInvoices
                                                                      )
                                                                      .then(
                                                                        () =>
                                                                          Invoice.collection.insert(
                                                                            individualInvoices
                                                                          )
                                                                      )
                                                                      .then(
                                                                        () => {
                                                                          //recording logs
                                                                          var obj = new AdminRouter();
                                                                          var resTemp1 = {
                                                                            ...responseStatus.SUCCESS,
                                                                            message: INVOICE_GENERATED_SUCCESS
                                                                          };
                                                                          obj.makeLogs(
                                                                            req,
                                                                            resTemp1
                                                                          );
                                                                          obj = null;
                                                                          //recording logs end
                                                                          res
                                                                            .status(
                                                                              200
                                                                            )
                                                                            .json(
                                                                              {
                                                                                ...responseStatus.SUCCESS,
                                                                                message: INVOICE_GENERATED_SUCCESS
                                                                              }
                                                                            );
                                                                        }
                                                                      )
                                                                      .catch(
                                                                        err => {
                                                                          //recording logs
                                                                          var obj = new AdminRouter();
                                                                          var resTemp = {
                                                                            ...responseStatus.FAILURE,
                                                                            errorCode:
                                                                              ErrorCodes.INVALID_REQUEST,
                                                                            message:
                                                                              UNKNOW_ERROR +
                                                                              err[
                                                                                "message"
                                                                              ]
                                                                          };
                                                                          obj.makeLogs(
                                                                            req,
                                                                            resTemp
                                                                          );
                                                                          obj = null;
                                                                          //recording logs end
                                                                          res
                                                                            .status(
                                                                              500
                                                                            )
                                                                            .json(
                                                                              {
                                                                                ...responseStatus.FAILURE,
                                                                                errorCode:
                                                                                  ErrorCodes.INVALID_REQUEST,
                                                                                message: UNKNOW_ERROR
                                                                              }
                                                                            );
                                                                        }
                                                                      );
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    })
                                                    .catch(err => {
                                                      //recording logs
                                                      var obj = new AdminRouter();
                                                      var resTemp = {
                                                        ...responseStatus.FAILURE,
                                                        errorCode:
                                                          ErrorCodes.INVALID_REQUEST,
                                                        message:
                                                          UNKNOW_ERROR +
                                                          err["message"]
                                                      };
                                                      obj.makeLogs(
                                                        req,
                                                        resTemp
                                                      );
                                                      obj = null;
                                                      //recording logs end
                                                      res.status(500).json({
                                                        ...responseStatus.FAILURE,
                                                        errorCode:
                                                          ErrorCodes.INVALID_REQUEST,
                                                        message: UNKNOW_ERROR
                                                      });
                                                    });
                                                }
                                              })
                                              .catch(err => {
                                                //recording logs
                                                var obj = new AdminRouter();
                                                var resTemp = {
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message:
                                                    UNKNOW_ERROR +
                                                    err["message"]
                                                };
                                                obj.makeLogs(req, resTemp);
                                                obj = null;
                                                //recording logs end
                                                res.status(500).json({
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message: UNKNOW_ERROR
                                                });
                                              });
                                          }
                                        }
                                      })
                                      .catch(err => {
                                        //recording logs
                                        var obj = new AdminRouter();
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
                              } else {
                                individualDrivers = stuData;
                                // will have to write code for combining ride of individual drivers only means array contains only individual
                                //create invoices for school....
                                BillingRate.find()
                                  .then(brData => {
                                    let bRData: any = [];
                                    bRData = brData;
                                    if (!brData || brData == null) {
                                      //recording logs
                                      var obj = new AdminRouter();
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
                                      Tax.findOne({
                                        taxFor: TaxFor.DRIVER_N_SCHOOL
                                      })
                                        .then(tData => {
                                          if (!tData && tData == null) {
                                            //recording logs
                                            var obj = new AdminRouter();
                                            var resTemp = {
                                              ...responseStatus.FAILURE,
                                              errorCode:
                                                ErrorCodes.INVALID_REQUEST,
                                              message: INVALID_REQUEST
                                            };
                                            obj.makeLogs(req, resTemp);
                                            obj = null;
                                            //recording logs end
                                            res.status(200).json({
                                              ...responseStatus.FAILURE,
                                              errorCode:
                                                ErrorCodes.INVALID_REQUEST,
                                              message: INVALID_REQUEST
                                            });
                                          } else {
                                            let groupIndividual: any = [];
                                            //creating invoice of schools
                                            let individualInvoices = [];
                                            //creating invoices of individual drivers...

                                            for (
                                              let a = 0;
                                              a < individualDrivers.length;
                                              a++
                                            ) {
                                              let inx = groupIndividual.findIndex(
                                                x => {
                                                  return (
                                                    x.userId ==
                                                    individualDrivers[a][
                                                      "driverId"
                                                    ]
                                                  );
                                                }
                                              );
                                              if (inx > -1) {
                                                groupIndividual[inx][
                                                  "rides"
                                                ].push(individualDrivers[a]);
                                              } else {
                                                groupIndividual.push({
                                                  userId:
                                                    individualDrivers[a][
                                                      "driverId"
                                                    ],
                                                  rides: [individualDrivers[a]]
                                                });
                                              }
                                              if (
                                                a ==
                                                individualDrivers.length - 1
                                              ) {
                                                for (
                                                  let c;
                                                  c < groupIndividual.length;
                                                  c++
                                                ) {
                                                  let inxx = bRData.findIndex(
                                                    x => {
                                                      return (
                                                        x.userId ==
                                                        groupIndividual[c][
                                                          "userId"
                                                        ]
                                                      );
                                                    }
                                                  );
                                                  if (inxx > -1) {
                                                    let inoOfRides =
                                                      groupIndividual[c][
                                                        "rides"
                                                      ].length;
                                                    let iamount =
                                                      inoOfRides *
                                                      brData[inxx]["rate"];
                                                    let itax =
                                                      (tData["taxPercentage"] /
                                                        100) *
                                                        iamount <
                                                      0
                                                        ? 0
                                                        : (tData[
                                                            "taxPercentage"
                                                          ] /
                                                            100) *
                                                          iamount;
                                                    individualInvoices.push({
                                                      tax: itax,
                                                      amount: iamount,
                                                      createdBy:
                                                        userDetails._id,
                                                      driverId:
                                                        groupIndividual[c][
                                                          "userId"
                                                        ]
                                                    });
                                                  }
                                                  console.log(
                                                    "individualInvoices",
                                                    individualInvoices
                                                  );
                                                  if (
                                                    c ==
                                                    groupIndividual.length - 1
                                                  ) {
                                                    // Insertion
                                                    Invoice.collection
                                                      .insert(
                                                        individualInvoices
                                                      )
                                                      .then(() => {
                                                        //recording logs
                                                        var obj = new AdminRouter();
                                                        var resTemp = {
                                                          ...responseStatus.SUCCESS,
                                                          message: INVOICE_GENERATED_SUCCESS
                                                        };
                                                        obj.makeLogs(
                                                          req,
                                                          resTemp
                                                        );
                                                        obj = null;
                                                        //recording logs end
                                                        res.status(200).json({
                                                          ...responseStatus.SUCCESS,
                                                          message: INVOICE_GENERATED_SUCCESS
                                                        });
                                                      })
                                                      .catch(err => {
                                                        //recording logs
                                                        var obj = new AdminRouter();
                                                        var resTemp = {
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message:
                                                            UNKNOW_ERROR +
                                                            err["message"]
                                                        };
                                                        obj.makeLogs(
                                                          req,
                                                          resTemp
                                                        );
                                                        obj = null;
                                                        //recording logs end
                                                        res.status(500).json({
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message: UNKNOW_ERROR
                                                        });
                                                      });
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        })
                                        .catch(err => {
                                          //recording logs
                                          var obj = new AdminRouter();
                                          var resTemp = {
                                            ...responseStatus.FAILURE,
                                            errorCode:
                                              ErrorCodes.INVALID_REQUEST,
                                            message:
                                              UNKNOW_ERROR + err["message"]
                                          };
                                          obj.makeLogs(req, resTemp);
                                          obj = null;
                                          //recording logs end
                                          res.status(500).json({
                                            ...responseStatus.FAILURE,
                                            errorCode:
                                              ErrorCodes.INVALID_REQUEST,
                                            message: UNKNOW_ERROR
                                          });
                                        });
                                    }
                                  })
                                  .catch(err => {
                                    //recording logs
                                    var obj = new AdminRouter();
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
                              var obj = new AdminRouter();
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
                    } else {
                      //recording logs
                      var obj = new AdminRouter();
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
                    var obj = new AdminRouter();
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
              var obj = new AdminRouter();
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
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
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
  }

  public async schoolCreate(req: Request, res: Response): void {
    const { token } = req.body;

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
      userRole
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
    const {
      bankName,
      accountNumber,
      IFSCCode,
      branchName
    } = req.body.bankDetail;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      User.findOne({ email })
        .then(result => {
          if (result && result._id) {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: EMAIL_ALREADY_EXISTS
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
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
              createdBy: userDetails._id
            });

            address.save();

            const user = new User({
              mobileNumber,
              alternativeMobileNumber,
              email,
              password,
              userType,
              userRole,
              addresses: [address._id],
              createdBy: userDetails._id
            });

            user.save();

            const bankDetail = new BankDetail({
              bankName,
              accountNumber,
              IFSCCode,
              branchName,
              createdBy: userDetails._id
            });

            bankDetail.save();

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
              bankDetail: bankDetail._id,
              createdBy: userDetails._id
            });

            school.save();

            const schoolToUser = new SchoolToUser({
              school: school._id,
              user: user._id,
              createdBy: userDetails._id
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
             
                //recording logs
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  message: "SCHOOL_REGISTER_SUCCESS"
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  message: "SCHOOL_REGISTER_SUCCESS"
                });
              })
              .catch(error => {
                //recording logs
                var obj = new AdminRouter();
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
          var obj = new AdminRouter();
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

  public async schoolDriverCreate(req: Request, res: Response): void {
    const {
      token,
      schoolId,
      firstName,
      lastName,
      email,
      password,
      adiOrPdiBadgeNumber,
      userType,
      userRole,
      drivingLicense,
      companions,
      mobileNumber
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
      long
    } = req.body.address;
    const {
      registrationNumber,
      chassisNumber,
      vehicleTypeId,
      color,
      isAutomatic
    } = req.body.carInfo;

    const Gtoken = Md5.init(req.body.email);

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      if (
        req.body.token &&
        req.body.schoolId &&
        req.body.email &&
        req.body.password
      ) {
        User.findOne({
          email,
          userType: UserTypes.DRIVER,
          userRole: UserRoles.APP_USER
        })
          .then(result => {
            if (result && result._id) {
              //recording logs
              var obj = new AdminRouter();
              var resTemp = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: USER_ALREADY_EXISTS
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: USER_ALREADY_EXISTS
              });
            } else {
              // Document.collection.insert(req.body.documents).then((data) => {
              //   const documents = [];
              //   for (let i = 0; i < data.ops.length; i++) {
              //     documents.push(data.ops[i]._id);
              //     if (i == data.ops.length - 1) {

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
                addressOf: AddressOf.APP_DRIVER,
                createdBy: userDetails._id
              });

              const user = new User({
                firstName,
                lastName,
                email,
                password,
                adiOrPdiBadgeNumber,
                userType,
                userRole,
                drivingLicense,
                mobileNumber,
                addresses: [address._id],
                companions,
                //   documents: documents,
                token: Gtoken,
                createdBy: userDetails._id
              });

              address.save();
              user
                .save()
                .then(resp => {
                  const carInfo = new CarInfo({
                    registrationNumber,
                    chassisNumber,
                    vehicleTypeId,
                    color,
                    isAutomatic,
                    userId: user._id,
                    createdBy: userDetails._id
                  });
                  carInfo.save();
                  const schoolToUser = new SchoolToUser({
                    school: schoolId,
                    user: user._id,
                    createdBy: userDetails._id
                  });

                  schoolToUser.save();

                  let lastInsertId = { driverId: user._id };
                  //recording logs
                  var obj = new AdminRouter();
                  var resTemp = {
                    ...responseStatus.SUCCESS,
                    message: DRIVER_CREATED_SUCCESS,
                    data: lastInsertId
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({
                    ...responseStatus.SUCCESS,
                    message: DRIVER_CREATED_SUCCESS,
                    data: lastInsertId
                  });
                })
                .catch(error => {
                  //recording logs
                  var obj = new AdminRouter();
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
              // }
              //   }
              // }).catch((error) => {
              //   res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
              // });
            }
          })
          .catch(error => {
            //recording logs
            var obj = new AdminRouter();
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
  }

  public async schools(req: Request, res: Response): void {
    const { token, page, keyword, isSearching } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      SchoolToUser.find()
        .populate("school")
        .populate("user")
        .then(async data => {
          let finalResult1 = data.filter(
            x =>
              x["user"] &&
              (x["user"]["userType"] == UserTypes.PORTAL_USER &&
                x["user"]["userRole"] == UserRoles.SCHOOL_USER)
          );

          let keyword1 = new RegExp("^" + keyword, "i");

          var finalResult = [];
          if (isSearching) {
            finalResult1.forEach(x => {
              if (
                x["school"].contactPersonName.match(keyword1) ||
                x["school"].contactPersonEmail.match(keyword1) ||
                x["school"].contactPersonMobileNumber.match(keyword1) ||
                x["school"].schoolName.match(keyword1)
              ) {
                finalResult.push(x);
              }
            });
          } else {
            finalResult = finalResult1;
          }

          var async1 = require("async");
          async1.forEach(
            finalResult,
            function(item, callback) {
              Address.find({ _id: item.user["addresses"][0] }).then(
                async docs => {
                  item.user["addresses"] = docs;
                  console.log(docs[0]["city"], "hello");
                  let city = await City.find({ value: docs[0]["city"] }).then(
                    data => {
                      return JSON.stringify(data);
                    }
                  );
                  let country = await Country.find({
                    value: docs[0]["country"]
                  }).then(data => {
                    return JSON.stringify(data);
                  });
                  let state = await State.find({
                    value: docs[0]["state"]
                  }).then(data => {
                    return JSON.stringify(data);
                  });
                  item.user["addresses"][0]["city"] = city;
                  item.user["addresses"][0]["country"] = country;
                  item.user["addresses"][0]["state"] = state;

                  callback();
                }
              );
            },
            function(err) {
              var totalPages = Math.round(finalResult.length);

              var finalData = [];
              var totalPages = Math.round(finalResult.length);
              if (finalResult.length > ti) {
                for (let i = p; i < ti; i++) {
                  finalData.push(finalResult[i]);
                }
                //recording logs
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else if (finalResult.length < ti && p < finalResult.length) {
                for (let i = p; i < finalResult.length; i++) {
                  finalData.push(finalResult[i]);
                }
                //recording logs
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else {
                //recording logs
                var obj = new AdminRouter();
                var resTemp1 = {
                  ...responseStatus.FAILURE,
                  message: NO_RECORDS_FOUND
                };
                obj.makeLogs(req, resTemp1);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.FAILURE,
                  message: NO_RECORDS_FOUND
                });
              }

              //res.status(200).json({ ...responseStatus.SUCCESS, data: result });
            }
          );
        })
        .catch(error => {
          //recording logs
          var obj = new AdminRouter();
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

  public async individualDrivers(req: Request, res: Response): void {
    const { token, page, isSearching, keyword } = req.body;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      SchoolToUser.find()
        .populate("user")
        .then(data => {
          let result = data.filter(
            x =>
              x["user"] &&
              (x["user"]["userType"] == UserTypes.DRIVER &&
                x["user"]["userRole"] == UserRoles.APP_USER)
          );
          if (result) {
            let schoolUsers: any = [];
            for (let i = 0; i < result.length; i++) {
              // let userId = mongoose.Types.ObjectId(result[i]._id);
              schoolUsers.push(result[i]["user"]._id);
              if (i == result.length - 1) {
                console.log(schoolUsers);
                User.find({
                  userType: UserTypes.DRIVER,
                  userRole: UserRoles.APP_USER,
                  _id: {
                    $nin: schoolUsers
                  }
                })
                  .then(resp => {
                    var finalResult1 = resp;
                    var finalData = [];
                    let keyword1 = new RegExp("^" + keyword, "i");

                    //  console.log(finalResult1,"i m here");
                    var finalResult = [];

                    if (isSearching) {
                      finalResult1.forEach(x => {
                        if (
                          x["firstName"].match(keyword1) ||
                          x["email"].match(keyword1) ||
                          x["mobileNumber"].match(keyword1)
                        ) {
                          finalResult.push(x);
                        }
                      });
                    } else {
                      finalResult = resp;
                    }

                    //recording logs
                    var obj = new AdminRouter();
                    var resTemp = {
                      ...responseStatus.SUCCESS,
                      data: finalResult
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end

                    res.status(200).json({
                      ...responseStatus.SUCCESS,
                      data: finalResult
                    });
                  })
                  .catch(error => {
                    console.log(error);
                    //recording logs
                    var obj = new AdminRouter();
                    var resTemp = {
                      ...responseStatus.FAILURE,
                      message: UNKNOW_ERROR + error["message"]
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs end
                    res.status(500).json({
                      ...responseStatus.FAILURE,
                      message: UNKNOW_ERROR
                    });
                  });
              }
            }
          } else {
            User.find({
              userType: UserTypes.DRIVER,
              userRole: UserRoles.APP_USER
            })
              .then(resp => {
                var finalResult1 = resp;
                var finalData = [];
                let keyword1 = new RegExp("^" + keyword, "i");

                //  console.log(finalResult1,"i m here");
                var finalResult = [];

                if (isSearching) {
                  finalResult1.forEach(x => {
                    if (
                      x["firstName"].match(keyword1) ||
                      x["email"].match(keyword1) ||
                      x["mobileNumber"].match(keyword1)
                    ) {
                      finalResult.push(x);
                    }
                  });
                } else {
                  finalResult = resp;
                }
                //recording logs
                var obj = new AdminRouter();
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
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.FAILURE,
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
          var obj = new AdminRouter();
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

  public async schoolDriverRideBooking(req: Request, res: Response): void {
    const { token, driverId, startDateTime } = req.body;

    if (
      req.body.token &&
      req.body.driverId &&
      (req.body.startDateTime || true)
    ) {
      let obj = new AdminRouter();
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
        res.status(200).json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
      } else {
        RideBooking.find({
          driverId,
          startDateTime: {
            $gt: new Date(startDateTime),
            $lt: new Date(startDateTime).setDate(
              new Date(startDateTime).getDate() + 1
            )
          }
        })
          .then(result => {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: result };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          })
          .catch(error => {
            //recording logs
            var obj = new AdminRouter();
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
      var obj = new AdminRouter();
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

  public async createBillingRate(req: Request, res: Response): void {
    const { token, userId, rate } = req.body;

    if (req.body.token && req.body.userId && req.body.rate > 0) {
      let obj = new AdminRouter();
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
        res.status(200).json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
      } else {
        let billingRate = new BillingRate({
          userId,
          rate,
          createdBy: userDetails._id
        });
        billingRate
          .save()
          .then(data => {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = { ...responseStatus.SUCCESS, data };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data });
          })
          .catch(error => {
            //recording logs
            var obj = new AdminRouter();
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
      var obj = new AdminRouter();
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

  public async createTax(req: Request, res: Response): void {
    const { token, countryCode, taxFor, taxPercentage } = req.body;

    if (
      req.body.token &&
      req.body.taxFor &&
      req.body.taxPercentage > 0 &&
      req.body.countryCode > 0
    ) {
      let obj = new AdminRouter();
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
        res.status(200).json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
      } else {
        Tax.findOne({ taxFor, countryCode })
          .then(resp => {
            if (!resp || resp == null) {
              let tax = new Tax({
                countryCode,
                taxFor,
                taxPercentage,
                createdBy: userDetails._id
              });
              tax
                .save()
                .then(data => {
                  //recording logs
                  var obj = new AdminRouter();
                  var resTemp = { ...responseStatus.SUCCESS, data };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({ ...responseStatus.SUCCESS, data });
                })
                .catch(error => {
                  //recording logs
                  var obj = new AdminRouter();
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
              Tax.findOneAndUpdate(
                { taxFor, countryCode },
                {
                  taxPercentage,
                  updatedBy: userDetails._id,
                  updatedDate: Date.now()
                }
              )
                .then(data => {
                  //recording logs
                  var obj = new AdminRouter();
                  var resTemp = { ...responseStatus.SUCCESS, data };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({ ...responseStatus.SUCCESS, data });
                })
                .catch(error => {
                  //recording logs
                  var obj = new AdminRouter();
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
            var obj = new AdminRouter();
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
    } else {
      //recording logs
      var obj = new AdminRouter();
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

  public async updateTestCenterBooking(req: Request, res: Response): void {
    const { token, bookedTestCenterId, status } = req.body;
    if (req.body.token && req.body.bookedTestCenterId && req.body.status) {
      let obj = new AdminRouter();
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
        res.status(200).json({
          ...responseStatus.FAILURE,
          errorCode: ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        });
      } else {
        BookedTestCenter.findOneAndUpdate(
          { _id: bookedTestCenterId },
          { status, updatedBy: userDetails._id, updatedDate: Date.now() }
        )
          .then(result => {
            // Sending notification to user against his/her test center booking status changed.
            PushInfo.find({ userId: { $in: [result["learnerId"]] } }).then(
              resp => {
                if (resp && resp.length > 0) {
                  let to = [];
                  let title = "Test Center Booking Confirmation";
                  let date = new Date(result["testDate"]).toDateString();
                  let message =
                    "You test center booking status changed to " +
                    status +
                    ".\n" +
                    " Booking Date: " +
                    date;
                  for (let l = 0; l < resp.length; l++) {
                    to.push(resp[l]["pushToken"]);
                    if (l == resp.length - 1) {
                      let params = {
                        type: NotificationTypes.TEST_CENTER_CONFIRMED
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
              }
            );

            //recording logs
            var obj = new AdminRouter();
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
            var obj = new AdminRouter();
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
      var obj = new AdminRouter();
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
   * bookings
   */
  public async bookings(req: Request, res: Response): void {
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      Booking.find().then(result => {
        //recording logs
        var obj = new AdminRouter();
        var resTemp = { ...responseStatus.SUCCESS, data: result };
        obj.makeLogs(req, resTemp);
        obj = null;
        //recording logs end
        res.status(200).json({ ...responseStatus.SUCCESS, data: result });
      });
    }
  }

  public async bookingHistory(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      Booking.find()

        .populate({
          path: "driverId",
          model: "User"
        })
        .populate({
          path: "learnerId",
          model: "User"
        })
        .sort({ createdDate: -1 })
        .then(result => {
          var finalResult = result;
          var finalData = [];
          var totalPages = Math.round(finalResult.length);
          if (finalResult.length > ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            });
          }
          // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        });
    }
  }

  public async orderHistory(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      Order.find()

        .populate({
          path: "driverId",
          model: "User"
        })
        .populate({
          path: "learnerId",
          model: "User"
        })
        .populate({
          path: "packageId",
          model: "Package"
        })
        .populate({
          path: "slotId",
          model: "Slot"
        })
        .populate({
          path: "pickUpAddressId",
          model: "Address"
        })
        .sort({ createdDate: -1 })
        .then(result => {
          var finalResult = result;
          var finalData = [];
          var totalPages = Math.round(finalResult.length);
          if (finalResult.length > ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            });
          }
          // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        });
    }
  }

  //api for getting any user details on the basis of their id.
  public async userById(req: Request, res: Response): void {
    const { token } = req.body;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      if (req.body.type == "lurnr") {
        User.findOne({ _id: req.body._id })
          .populate("documents")
          .populate({
            path: "documents",
            populate: {
              path: "documentType",
              model: "DocumentType"
            }
          })
          .then(data => {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: data };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data });
          })
          .catch(error => {
            //recording logs
            var obj = new AdminRouter();
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
      } else if (req.body.type == "driver") {
        User.findOne({ _id: req.body._id })
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
              var obj = new AdminRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({ ...responseStatus.SUCCESS, data: result });
            });
          });
      } else if (req.body.type == "school") {
        SchoolToUser.find({ user: req.body._id })
          .populate("school")
          .populate("user")
          .populate("documents")
          .populate({
            path: "documents",
            populate: {
              path: "documentType",
              model: "DocumentType"
            }
          })
          .populate({
            path: "school",
            populate: {
              path: "bankDetail",
              model: "BankDetail"
            }
          })
          .populate({
            path: "user",
            populate: {
              path: "addresses",
              model: "Address"
            }
          })
          .then(data => {
            let id = data[0]["user"]["_id"];
            SchoolToUser.find({
              school: data[0]["school"]["_id"],
              user: { $ne: id }
            }).then(temp => {
              //recording logs
              var obj = new AdminRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                data: data,
                totalDrivers: temp.length
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.SUCCESS,
                data: data,
                totalDrivers: temp.length
              });
            });
          })

          .catch(error => {
            console.log(error);
            //recording logs
            var obj = new AdminRouter();
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
      } else if (req.body.type == "subadmin") {
        User.findOne({ _id: req.body._id })
          .populate("addresses")
          .then(data => {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: data };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: data });
          })
          .catch(error => {
            //recording logs
            var obj = new AdminRouter();
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
  //end here user details api code.

  //start here school update code.

  public async schoolUpdate(req: Request, res: Response): void {
    const { token, _id } = req.body;
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
    } = req.body;
    const {
      userId,
      mobileNumber,
      alternativeMobileNumber,
      // email,
      isArchived
    } = req.body.user;
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
    const {
      bankDetailId,
      bankName,
      accountNumber,
      IFSCCode,
      branchName
    } = req.body.bankDetail;

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
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
          updatedBy: userDetails._id,
          updatedDate: Date.now()
        }
      ).then(result => {
        User.findOneAndUpdate(
          { _id: userId },
          {
            mobileNumber,
            alternativeMobileNumber,
            // email,
            isArchived: isArchived,
            updatedBy: userDetails._id,
            updatedDate: Date.now()
          }
        ).then(() => {
          BankDetail.findOneAndUpdate(
            { _id: bankDetailId },
            {
              bankName,
              accountNumber,
              IFSCCode,
              branchName,
              updatedBy: userDetails._id,
              updatedDate: Date.now()
            }
          ).then(() => {
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
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            )
              .then(data => {
                console.log(data);
                if (!data || data == null) {
                  //recording logs
                  var obj = new AdminRouter();
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
                  var obj = new AdminRouter();
                  var resTemp = {
                    ...responseStatus.SUCCESS,
                    message: SCHOOL_UPDATE
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs end
                  res.status(200).json({
                    ...responseStatus.SUCCESS,
                    message: SCHOOL_UPDATE
                  });
                }
              })
              .catch(error => {
                //recording logs
                var obj = new AdminRouter();
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
        });
      });
    }
  }

  //end here school update code

  //school driver update code start from there

  public async schoolDriverUpdate(req: Request, res: Response): void {
    const {
      userId,
      token,
      schoolId,
      firstName,
      lastName,
      email,
      password,
      adiOrPdiBadgeNumber,
      userType,
      userRole,
      drivingLicense,
      companions,
      mobileNumber
    } = req.body;
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
    const {
      carInfoId,
      registrationNumber,
      chassisNumber,
      vehicleTypeId,
      color,
      isAutomatic
    } = req.body.carInfo;
    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
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
          updatedBy: userDetails._id,
          updatedDate: Date.now()
        }
      ).then(result => {
        User.findOneAndUpdate(
          { _id: userId },
          {
            firstName,
            lastName,
            email,
            adiOrPdiBadgeNumber,
            userType,
            userRole,
            drivingLicense,
            companions,
            mobileNumber,
            updatedBy: userDetails._id,
            updatedDate: Date.now()
          }
        ).then(() => {
          CarInfo.findOneAndUpdate(
            { _id: carInfoId },
            {
              registrationNumber,
              chassisNumber,
              vehicleTypeId,
              color,
              isAutomatic,
              updatedBy: userDetails._id,
              updatedDate: Date.now()
            }
          )

            .then(data => {
              console.log(data);
              if (!data || data == null) {
                //recording logs
                var obj = new AdminRouter();
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
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  message: SCHOOL_DRIVER_UPDATE
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  message: SCHOOL_DRIVER_UPDATE
                });
              }
            })
            .catch(error => {
              //recording logs
              var obj = new AdminRouter();
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
      });
    }
  }

  public async invoices(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      Invoice.find()
        .populate("driverId")
        .then(result => {
          // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          var finalResult = result;
          var finalData = [];
          var totalPages = Math.round(finalResult.length);
          if (finalResult.length >= ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            });
          }
        })
        .catch(err => {
          //recording logs
          var obj = new AdminRouter();
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

  public async invoiceDetailById(req: Request, res: Response): void {
    const { token, invoiceId } = req.body;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      Invoice.findOne({ _id: invoiceId })
        .then(record => {
          let invoice = record;
          if (!record || record == null) {
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: INVALID_REQUEST
            });
          } else {
            RideBooking.find({ invoiceId })
              .populate("driverId")
              .then(result => {
                //recording logs
                var obj = new AdminRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: {
                    rides: result,
                    invoice: invoice,
                    organisation: { ...Organization.OrganizationDetail }
                  }
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs end
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: {
                    rides: result,
                    invoice: invoice,
                    organisation: { ...Organization.OrganizationDetail }
                  }
                });
              })
              .catch(error => {
                //recording logs
                var obj = new AdminRouter();
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
          var obj = new AdminRouter();
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

  public async invoiceDetail(req: Request, res: Response): void {
    const { token, type, driverId, fromDate, toDate } = req.body;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      if (type == "INDIVIDUAL" && driverId) {
        // logic for getting particular individual driver invoice detail
        RideBooking.find({
          driverId: driverId,
          invoiceId: "",
          status: "COMPLETED"
        })
          .populate("driverId")
          .then(result => {
            console.log(result);
            //recording logs
            var obj = new AdminRouter();
            var resTemp = { ...responseStatus.SUCCESS, data: result };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          })
          .catch(error => {
            //recording logs
            var obj = new AdminRouter();
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
      } else if (type == "SCHOOL" && driverId) {
        console.log(".....");
        // logic for getting particular school driver invoice detail
        SchoolToUser.find({ school: { $in: driverId } })
          .populate({
            path: "user",
            match: {
              userType: UserTypes.DRIVER,
              userRole: UserRoles.APP_USER
            }
          })
          .then(data => {
            console.log("dt", data);
            let result = data.filter(
              x =>
                x["user"] &&
                (x["user"]["userType"] == UserTypes.DRIVER &&
                  x["user"]["userRole"] == UserRoles.APP_USER)
            );
            console.log("Drivers", result);
            if (result && result.length) {
              let schoolUsers = [];
              for (let i = 0; i < result.length; i++) {
                // let userId = mongoose.Types.ObjectId(result[i]._id);

                schoolUsers.push(result[i]["user"]._id);
                if (i == result.length - 1) {
                  console.log("schoolUsers", schoolUsers);
                  RideBooking.find({
                    driverId: { $in: schoolUsers },
                    invoiceId: "",
                    status: "COMPLETED"
                  })
                    .populate("driverId")
                    .then(result => {
                      //recording logs
                      var obj = new AdminRouter();
                      var resTemp = {
                        ...responseStatus.SUCCESS,
                        data: result
                      };
                      obj.makeLogs(req, resTemp);
                      obj = null;
                      //recording logs end
                      console.log("res", result);
                      res.status(200).json({
                        ...responseStatus.SUCCESS,
                        data: result
                      });
                    })
                    .catch(error => {
                      //recording logs
                      var obj = new AdminRouter();
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
              var obj = new AdminRouter();
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
            var obj = new AdminRouter();
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
      } else if (type == "INDIVIDUAL") {
        // logic for getting all individual driver invoice detail
      } else if (type == "SCHOOL") {
        // logic for getting all school driver invoice detail
      }
    }
  }

  public async createInvoice(req: Request, res: Response): void {
    const { token, type, driverId, fromDate, toDate } = req.body;
    var globalTax = 0;
    var globalePrice = 0;

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
      var resTemp = {
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      };
      obj.makeLogs(req, resTemp);
      obj = null;
      //recording logs end
    } else {
      RideRate.find({ $or: [{ isGeneric: true }, { who: driverId }] })
        .populate("taxId")
        .then(resultBK => {
          if (resultBK.length > 1) {
            globalTax = resultBK[1]["taxId"]["taxPercentage"];
            globalePrice = resultBK[1]["price"];
          } else {
            globalTax = resultBK[0]["taxId"]["taxPercentage"];
            globalePrice = resultBK[0]["price"];
          }

          User.findOne({
            token,
            userType: UserTypes.PORTAL_USER,
            userRole: UserRoles.SUPER_ADMIN
          })
            .then(data => {
              if (!data || data == null) {
                //recording logs
                var obj = new AdminRouter();
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
                if (type == "INDIVIDUAL" && driverId && fromDate && toDate) {
                  // logic for creating particular individual driver invoice
                  RideBooking.find({
                    driverId: driverId,
                    status: "COMPLETED",
                    invoiceId: "",
                    startDateTime: { $gt: new Date(fromDate) },
                    endDateTime: {
                      $lt: new Date(toDate).setDate(
                        new Date(toDate).getDate() + 1
                      )
                    }
                  })
                    .then(rbData => {
                      console.log(rbData);
                      let rideBookingList: any = [];
                      if (rbData && rbData.length > 0) {
                        for (let i = 0; i < rbData.length; i++) {
                          rideBookingList.push(rbData[i]["_id"]);
                          if (i == rbData.length - 1) {
                            BillingRate.findOne({ who: driverId })
                              .then(brData => {
                                // if(!brData || brData == null){
                                //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST+" 5"});
                                // }else{
                                Tax.findOne({ taxFor: TaxFor.DRIVER_N_SCHOOL })
                                  .then(tData => {
                                    // if (!tData && tData == null) {
                                    //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST + " 4" });
                                    // } else {
                                    let noOfRides = rbData.length;
                                    let rate = 0;
                                    if (brData != null) {
                                      rate = brData["price"];
                                    } else {
                                      // rate = DefaultBillingRate.DEFAULT;
                                      rate = globalePrice;
                                    }
                                    let amount = noOfRides * rate; //tData['taxPercentage']
                                    let tax =
                                      (globalTax / 100) * amount < 0
                                        ? 0
                                        : (globalePrice / 100) * amount;
                                    let invoice = new Invoice({
                                      tax: tax,
                                      amount: amount,
                                      driverId: driverId,
                                      createdBy: userDetails._id
                                    });
                                    invoice
                                      .save()
                                      .then(invoiceData => {
                                        RideBooking.updateMany(
                                          { _id: { $in: rideBookingList } },
                                          { invoiceId: invoiceData._id }
                                        )
                                          .then(xdata => {
                                            console.log("xdata", xdata);
                                          })
                                          .catch(err => {
                                            console.log("xdata", err);
                                          });
                                        //recording logs
                                        var obj = new AdminRouter();
                                        var resTemp = {
                                          ...responseStatus.SUCCESS,
                                          message: INVOICE_GENERATED_SUCCESS,
                                          data: invoiceData
                                        };
                                        obj.makeLogs(req, resTemp);
                                        obj = null;
                                        //recording logs end
                                        res.status(200).json({
                                          ...responseStatus.SUCCESS,
                                          message: INVOICE_GENERATED_SUCCESS,
                                          data: invoiceData
                                        });
                                      })
                                      .catch(err => {
                                        //recording logs
                                        var obj = new AdminRouter();
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
                                    // }
                                  })
                                  .catch(err => {
                                    //recording logs
                                    var obj = new AdminRouter();
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
                                // }
                              })
                              .catch(err => {
                                //recording logs
                                var obj = new AdminRouter();
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
                      } else {
                        //recording logs
                        var obj = new AdminRouter();
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
                      var obj = new AdminRouter();
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
                } else if (type == "SCHOOL" && driverId && fromDate && toDate) {
                  // logic for creating particular school driver invoice
                  SchoolToUser.findOne({ school: driverId })
                    .then(resp => {
                      if (!resp || resp == null) {
                        res.status(200).json({
                          ...responseStatus.FAILURE,
                          errorCode: ErrorCodes.INVALID_REQUEST,
                          message: INVALID_REQUEST + " 1"
                        });
                      } else {
                        SchoolToUser.find({ school: { $in: driverId } })
                          .populate({
                            path: "user",
                            match: {
                              userType: UserTypes.DRIVER,
                              userRole: UserRoles.APP_USER
                            }
                          })
                          .then(stuData => {
                            let sDriver = stuData.filter(o => o && o["user"]);
                            if (sDriver && sDriver.length > 0) {
                              let users = [];
                              for (let i = 0; i < sDriver.length; i++) {
                                console.log("sDriver", sDriver[i]);
                                users.push(sDriver[i]["user"]._id);

                                if (i == sDriver.length - 1) {
                                  console.log("sDriver", users);
                                  RideBooking.find({
                                    driverId: { $in: users },
                                    status: "COMPLETED",
                                    invoiceId: "",
                                    startDateTime: { $gt: new Date(fromDate) },
                                    endDateTime: {
                                      $lt: new Date(toDate).setDate(
                                        new Date(toDate).getDate() + 1
                                      )
                                    }
                                  })
                                    .then(rbData => {
                                      console.log("rb", rbData);
                                      if (rbData && rbData.length > 0) {
                                        let rideBookingList: any = [];
                                        for (
                                          let i = 0;
                                          i < rbData.length;
                                          i++
                                        ) {
                                          rideBookingList.push(
                                            rbData[i]["_id"]
                                          );
                                          if (i == rbData.length - 1) {
                                            BillingRate.findOne({ driverId })
                                              .then(brData => {
                                                // if(!brData || brData == null){
                                                //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST+" 2" });
                                                // }else{
                                                Tax.findOne({
                                                  taxFor: TaxFor.DRIVER_N_SCHOOL
                                                })
                                                  .then(tData => {
                                                    // if (!tData && tData == null) {
                                                    //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST + " 3" });
                                                    // } else {
                                                    let noOfRides =
                                                      rbData.length;
                                                    let rate =
                                                      brData && brData["rate"]
                                                        ? brData["rate"]
                                                        : DefaultBillingRate.DEFAULT;
                                                    let amount =
                                                      noOfRides * globalePrice; //rate //tData['taxPercentage']
                                                    let tax =
                                                      (globalTax / 100) *
                                                        amount <
                                                      0
                                                        ? 0
                                                        : (globalTax / 100) *
                                                          amount;
                                                    let invoice = new Invoice({
                                                      tax: tax,
                                                      amount: amount,
                                                      driverId: driverId,
                                                      createdBy: userDetails._id
                                                    });
                                                    invoice
                                                      .save()
                                                      .then(invoiceData => {
                                                        RideBooking.updateMany(
                                                          {
                                                            _id: {
                                                              $in: rideBookingList
                                                            }
                                                          },
                                                          {
                                                            invoiceId:
                                                              invoiceData._id
                                                          }
                                                        )
                                                          .then(xdata => {
                                                            console.log(
                                                              "xdata",
                                                              xdata
                                                            );
                                                          })
                                                          .catch(err => {
                                                            console.log(
                                                              "xdata",
                                                              err
                                                            );
                                                          });
                                                        //recording logs
                                                        var obj = new AdminRouter();
                                                        var resTemp = {
                                                          ...responseStatus.SUCCESS,
                                                          message: INVOICE_GENERATED_SUCCESS,
                                                          data: invoiceData
                                                        };
                                                        obj.makeLogs(
                                                          req,
                                                          resTemp
                                                        );
                                                        obj = null;
                                                        //recording logs end
                                                        res.status(200).json({
                                                          ...responseStatus.SUCCESS,
                                                          message: INVOICE_GENERATED_SUCCESS,
                                                          data: invoiceData
                                                        });
                                                      })
                                                      .catch(err => {
                                                        //recording logs
                                                        var obj = new AdminRouter();
                                                        var resTemp = {
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message:
                                                            UNKNOW_ERROR +
                                                            err["message"]
                                                        };
                                                        obj.makeLogs(
                                                          req,
                                                          resTemp
                                                        );
                                                        obj = null;
                                                        //recording logs end
                                                        res.status(500).json({
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message: UNKNOW_ERROR
                                                        });
                                                      });
                                                    // }
                                                  })
                                                  .catch(err => {
                                                    console.log(err);
                                                    //recording logs
                                                    var obj = new AdminRouter();
                                                    var resTemp = {
                                                      ...responseStatus.FAILURE,
                                                      errorCode:
                                                        ErrorCodes.INVALID_REQUEST,
                                                      message:
                                                        UNKNOW_ERROR +
                                                        err["message"]
                                                    };
                                                    obj.makeLogs(req, resTemp);
                                                    obj = null;
                                                    //recording logs end
                                                    res.status(500).json({
                                                      ...responseStatus.FAILURE,
                                                      errorCode:
                                                        ErrorCodes.INVALID_REQUEST,
                                                      message: UNKNOW_ERROR
                                                    });
                                                  });
                                                // }
                                              })
                                              .catch(err => {
                                                //recording logs
                                                var obj = new AdminRouter();
                                                var resTemp = {
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message:
                                                    UNKNOW_ERROR +
                                                    err["message"]
                                                };
                                                obj.makeLogs(req, resTemp);
                                                obj = null;
                                                //recording logs end
                                                res.status(500).json({
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message: UNKNOW_ERROR
                                                });
                                              });
                                          }
                                        }
                                      } else {
                                        //recording logs
                                        var obj = new AdminRouter();
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
                                      var obj = new AdminRouter();
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
                            } else {
                              //recording logs
                              var obj = new AdminRouter();
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
                            console.log(err);
                            //recording logs
                            var obj = new AdminRouter();
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
                      var obj = new AdminRouter();
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
                if (type == "INDIVIDUAL" && driverId) {
                  // logic for creating particular individual driver invoice
                  RideBooking.find({
                    driverId: driverId,
                    status: "COMPLETED",
                    invoiceId: ""
                  })
                    .then(rbData => {
                      // console.log(rbData);
                      let rideBookingList: any = [];
                      if (rbData && rbData.length > 0) {
                        for (let i = 0; i < rbData.length; i++) {
                          rideBookingList.push(rbData[i]["_id"]);
                          if (i == rbData.length - 1) {
                            BillingRate.findOne({ userId: driverId })
                              .then(brData => {
                                // if(!brData || brData == null){
                                //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST+" 5"});
                                // }else{
                                Tax.findOne({ taxFor: TaxFor.DRIVER_N_SCHOOL })
                                  .then(tData => {
                                    // if (!tData && tData == null) {
                                    //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST + " 4" });
                                    // } else {

                                    let noOfRides = rbData.length;
                                    let rate = 0;
                                    if (brData != null) {
                                      rate = brData["rate"];
                                    } else {
                                      //rate = DefaultBillingRate.DEFAULT;
                                      rate = globalePrice;
                                    }

                                    console.log("kii", rate);
                                    let amount = noOfRides * rate;

                                    let tax =
                                      (globalTax / 100) * amount < 0
                                        ? 0
                                        : (globalTax / 100) * amount;
                                    let invoice = new Invoice({
                                      tax: tax,
                                      amount: amount,
                                      driverId: driverId,
                                      createdBy: userDetails._id
                                    });
                                    console.log("inv", invoice);
                                    invoice
                                      .save()
                                      .then(invoiceData => {
                                        console.log("save inv", invoiceData);
                                        RideBooking.updateMany(
                                          { _id: { $in: rideBookingList } },
                                          { invoiceId: invoiceData._id }
                                        )
                                          .then(xdata => {
                                            console.log("xdata", xdata);
                                          })
                                          .catch(err => {
                                            console.log("xdata", err);
                                          });
                                        //recording logs
                                        var obj = new AdminRouter();
                                        var resTemp = {
                                          ...responseStatus.SUCCESS,
                                          message: INVOICE_GENERATED_SUCCESS,
                                          data: invoiceData
                                        };
                                        obj.makeLogs(req, resTemp);
                                        obj = null;
                                        //recording logs end
                                        res.status(200).json({
                                          ...responseStatus.SUCCESS,
                                          message: INVOICE_GENERATED_SUCCESS,
                                          data: invoiceData
                                        });
                                      })
                                      .catch(err => {
                                        //recording logs
                                        var obj = new AdminRouter();
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
                                    // }
                                  })
                                  .catch(err => {
                                    //recording logs
                                    var obj = new AdminRouter();
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
                                // }
                              })
                              .catch(err => {
                                //recording logs
                                var obj = new AdminRouter();
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
                      } else {
                        //recording logs
                        var obj = new AdminRouter();
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
                      var obj = new AdminRouter();
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
                } else if (type == "SCHOOL" && driverId) {
                  // logic for creating particular school driver invoice
                  SchoolToUser.findOne({ school: driverId })
                    .then(resp => {
                      if (!resp || resp == null) {
                        res.status(200).json({
                          ...responseStatus.FAILURE,
                          errorCode: ErrorCodes.INVALID_REQUEST,
                          message: INVALID_REQUEST + " 1"
                        });
                      } else {
                        SchoolToUser.find({ school: { $in: driverId } })
                          .populate({
                            path: "user",
                            match: {
                              userType: UserTypes.DRIVER,
                              userRole: UserRoles.APP_USER
                            }
                          })
                          .then(stuData => {
                            console.log("sr", stuData);

                            let sDriver = stuData.filter(o => o && o["user"]);
                            if (sDriver && sDriver.length > 0) {
                              let users = [];
                              for (let i = 0; i < sDriver.length; i++) {
                                //console.log("sDriver",sDriver[i]);
                                users.push(sDriver[i]["user"]._id);

                                if (i == sDriver.length - 1) {
                                  //  console.log("sDriver",users);
                                  RideBooking.find({
                                    driverId: { $in: users },
                                    status: "COMPLETED",
                                    invoiceId: ""
                                  })
                                    .then(rbData => {
                                      //  console.log("rb", rbData);
                                      if (rbData && rbData.length > 0) {
                                        let rideBookingList: any = [];
                                        for (
                                          let i = 0;
                                          i < rbData.length;
                                          i++
                                        ) {
                                          rideBookingList.push(
                                            rbData[i]["_id"]
                                          );
                                          if (i == rbData.length - 1) {
                                            BillingRate.findOne({ driverId })
                                              .then(brData => {
                                                // if(!brData || brData == null){
                                                //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST+" 2" });
                                                // }else{
                                                Tax.findOne({
                                                  taxFor: TaxFor.DRIVER_N_SCHOOL
                                                })
                                                  .then(tData => {
                                                    // if (!tData && tData == null) {
                                                    //   res.status(200).json({ ...responseStatus.FAILURE, message: INVALID_REQUEST + " 3" });
                                                    // } else {
                                                    let noOfRides =
                                                      rbData.length;
                                                    // let rate = (brData && brData['rate'] ? brData['rate'] : DefaultBillingRate.DEFAULT);
                                                    let rate = globalePrice;
                                                    let amount =
                                                      noOfRides * rate;
                                                    let tax =
                                                      (globalTax / 100) *
                                                        amount <
                                                      0
                                                        ? 0
                                                        : (globalTax / 100) *
                                                          amount;
                                                    let invoice = new Invoice({
                                                      tax: tax,
                                                      amount: amount,
                                                      driverId: driverId,
                                                      createdBy: userDetails._id
                                                    });
                                                    invoice
                                                      .save()
                                                      .then(invoiceData => {
                                                        RideBooking.updateMany(
                                                          {
                                                            _id: {
                                                              $in: rideBookingList
                                                            }
                                                          },
                                                          {
                                                            invoiceId:
                                                              invoiceData._id
                                                          }
                                                        )
                                                          .then(xdata => {
                                                            console.log(
                                                              "xdata",
                                                              xdata
                                                            );
                                                          })
                                                          .catch(err => {
                                                            console.log(
                                                              "xdata",
                                                              err
                                                            );
                                                          });
                                                        //recording logs
                                                        var obj = new AdminRouter();
                                                        var resTemp = {
                                                          ...responseStatus.SUCCESS,
                                                          message: INVOICE_GENERATED_SUCCESS,
                                                          data: invoiceData
                                                        };
                                                        obj.makeLogs(
                                                          req,
                                                          resTemp
                                                        );
                                                        obj = null;
                                                        //recording logs end
                                                        res.status(200).json({
                                                          ...responseStatus.SUCCESS,
                                                          message: INVOICE_GENERATED_SUCCESS,
                                                          data: invoiceData
                                                        });
                                                      })
                                                      .catch(err => {
                                                        //recording logs
                                                        var obj = new AdminRouter();
                                                        var resTemp = {
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message:
                                                            UNKNOW_ERROR +
                                                            err["message"]
                                                        };
                                                        obj.makeLogs(
                                                          req,
                                                          resTemp
                                                        );
                                                        obj = null;
                                                        //recording logs end
                                                        res.status(500).json({
                                                          ...responseStatus.FAILURE,
                                                          errorCode:
                                                            ErrorCodes.INVALID_REQUEST,
                                                          message: UNKNOW_ERROR
                                                        });
                                                      });
                                                    //  }
                                                  })
                                                  .catch(err => {
                                                    console.log(err);
                                                    //recording logs
                                                    var obj = new AdminRouter();
                                                    var resTemp = {
                                                      ...responseStatus.FAILURE,
                                                      errorCode:
                                                        ErrorCodes.INVALID_REQUEST,
                                                      message:
                                                        UNKNOW_ERROR +
                                                        err["message"]
                                                    };
                                                    obj.makeLogs(req, resTemp);
                                                    obj = null;
                                                    //recording logs end
                                                    res.status(500).json({
                                                      ...responseStatus.FAILURE,
                                                      errorCode:
                                                        ErrorCodes.INVALID_REQUEST,
                                                      message: UNKNOW_ERROR
                                                    });
                                                  });
                                                // }
                                              })
                                              .catch(err => {
                                                //recording logs
                                                var obj = new AdminRouter();
                                                var resTemp = {
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message:
                                                    UNKNOW_ERROR +
                                                    err["message"]
                                                };
                                                obj.makeLogs(req, resTemp);
                                                obj = null;
                                                //recording logs end
                                                res.status(500).json({
                                                  ...responseStatus.FAILURE,
                                                  errorCode:
                                                    ErrorCodes.INVALID_REQUEST,
                                                  message: UNKNOW_ERROR
                                                });
                                              });
                                          }
                                        }
                                      } else {
                                        //recording logs
                                        var obj = new AdminRouter();
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
                                          message: INVALID_REQUEST + " 7"
                                        });
                                      }
                                    })
                                    .catch(err => {
                                      //recording logs
                                      var obj = new AdminRouter();
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
                            } else {
                              //recording logs
                              var obj = new AdminRouter();
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
                                message: INVALID_REQUEST + " 6"
                              });
                            }
                          })
                          .catch(err => {
                            console.log(err);
                            //recording logs
                            var obj = new AdminRouter();
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
                      var obj = new AdminRouter();
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
                  var obj = new AdminRouter();
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
            })
            .catch(error => {
              //recording logs
              var obj = new AdminRouter();
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

  public async updateInvoiceStatusById(req: Request, res: Response): void {
    const { token, invoiceId } = req.body;

    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
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
      Invoice.findOneAndUpdate(
        { _id: invoiceId },
        {
          status: InvoiceStatus.PAID,
          updatedBy: userDetails._id,
          updatedDate: Date.now()
        }
      )
        .then(record => {
          if (!record || record == null) {
            //recording logs
            var obj = new AdminRouter();
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
            var obj = new AdminRouter();
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
          }
        })
        .catch(error => {
          //recording logs
          var obj = new AdminRouter();
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

  public async bookingRides(req: Request, res: Response): void {
    const { token, bookingId, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      RideBooking.find({ bookingId: bookingId })

        .populate({
          path: "pickUpAddress",
          model: "Address"
        })
        .populate({
          path: "dropAddress",
          model: "Address"
        })
        .populate({
          path: "driverId",
          model: "User"
        })
        .populate({
          path: "slotId",
          model: "Slot"
        })
        .then(result => {
          //res.status(200).json({ ...responseStatus.SUCCESS, data: result });

          var finalResult = result;
          var finalData = [];
          var totalPages = Math.round(finalResult.length);
          if (finalResult.length > ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            });
          }
        });
    }
  }

  public async testCenterBookings(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      BookTestCenter.find({})

        .populate({
          path: "learnerId",
          model: "User"
        })
        .then(result => {
          var finalResult = result;
          var finalData = [];
          var totalPages = Math.round(finalResult.length);
          if (finalResult.length > ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end

            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            });
          }
          // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        });
    }
  }

  // end here school driver update code.
  public async updateTestBookingCenter(req: Request, res: Response): void {
    const { token, bookedTestCenterId, status, testDate } = req.body;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      if (testDate == null) {
        BookedTestCenter.findOneAndUpdate(
          { _id: bookedTestCenterId },
          {
            status: status,
            updatedBy: userDetails._id,
            updatedDate: Date.now()
          }
        )
          .then(result => {
            //recording logs
            var obj = new AdminRouter();
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
            var obj = new AdminRouter();
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
      } else if (status == null) {
        BookedTestCenter.findOneAndUpdate(
          { _id: bookedTestCenterId },
          {
            testDate: testDate,
            updatedBy: userDetails._id,
            updatedDate: Date.now()
          }
        )
          .then(result => {
            //recording logs
            var obj = new AdminRouter();
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
            var obj = new AdminRouter();
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
        BookedTestCenter.findOneAndUpdate(
          { _id: bookedTestCenterId },
          {
            status: status,
            testDate: testDate,
            updatedBy: userDetails._id,
            updatedDate: Date.now()
          }
        )
          .then(result => {
            //recording logs
            var obj = new AdminRouter();
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
            var obj = new AdminRouter();
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

  public async bookingDriverAndSlotUpdate(req: Request, res: Response): void {
    const {
      token,
      driverId,
      slotId,
      type,
      bookingId,
      ridebBookingId
    } = req.body;
    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    if (!checkTokenResult) {
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
      if (type == "bookings" && bookingId) {
        if (driverId == null && slotId == null) {
          //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs end
          res.status(500).json({
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: INVALID_REQUEST
          });
        } else if (driverId == null && slotId != null) {
          //   Booking.findOneAndUpdate({_id: bookingId},{driverId:driverId})
          // .then((result) => {
          RideBooking.update(
            { bookingId: bookingId, status: { $ne: "COMPLETED" } },
            { slotId: slotId },
            { multi: true }
          )
            .then(result => {
              //recording logs
              var obj = new AdminRouter();
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
              var obj = new AdminRouter();
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
          // })
          // .catch((error) => {
          //   res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
          // });
        } else if (slotId == null && driverId != null) {
          Booking.findOneAndUpdate(
            { _id: bookingId },
            {
              driverId: driverId,
              updatedBy: userDetails._id,
              updatedDate: Date.now()
            }
          )
            .then(result => {
              RideBooking.update(
                { bookingId: bookingId, status: { $ne: "COMPLETED" } },
                {
                  driverId: driverId,
                  updatedBy: userDetails._id,
                  updatedDate: Date.now()
                },
                { multi: true }
              )
                .then(result => {
                  //recording logs
                  var obj = new AdminRouter();
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
                  var obj = new AdminRouter();
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
              //recording logs
              var obj = new AdminRouter();
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
          Booking.findOneAndUpdate(
            { _id: bookingId },
            {
              driverId: driverId,
              updatedBy: userDetails._id,
              updatedDate: Date.now()
            }
          )
            .then(result => {
              RideBooking.update(
                { bookingId: bookingId, status: { $ne: "COMPLETED" } },
                {
                  slotId: slotId,
                  driverId: driverId,
                  updatedBy: userDetails._id,
                  updatedDate: Date.now()
                },
                { multi: true }
              )
                .then(result => {
                  //recording logs
                  var obj = new AdminRouter();
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
                  var obj = new AdminRouter();
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
              //recording logs
              var obj = new AdminRouter();
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
        if (driverId == null && slotId == null) {
          //recording logs
          // var obj = new AdminRouter();
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs end
          res.status(500).json({
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: INVALID_REQUEST
          });
        } else {
          if (driverId == null && slotId != null) {
            RideBooking.findOneAndUpdate(
              { _id: ridebBookingId },
              {
                slotId: slotId,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            )
              .then(result => {
                //recording logs
                var obj = new AdminRouter();
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
                var obj = new AdminRouter();
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
          } else if (slotId == null && driverId != null) {
            RideBooking.findOneAndUpdate(
              { _id: ridebBookingId },
              {
                driverId: driverId,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            )
              .then(result => {
                //recording logs
                var obj = new AdminRouter();
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
                var obj = new AdminRouter();
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
            RideBooking.findOneAndUpdate(
              { _id: ridebBookingId },
              {
                driverId: driverId,
                slotId: slotId,
                updatedBy: userDetails._id,
                updatedDate: Date.now()
              }
            )
              .then(result => {
                //recording logs
                var obj = new AdminRouter();
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
                var obj = new AdminRouter();
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
      }
    }
  }

  public async ratingAvg(req: Request, res: Response): void {
    DriverRating.aggregate([
      {
        $group: {
          _id: "$driverId",
          averageQuantity: { $avg: "$rating" },
          attribute: { $push: "" },
          count: { $sum: 1 }
        }
      }
    ]).then(data => {
      console.log(data);

      var t = [];
      data.forEach(d => {
        var x = { driverId: d._id, attributes: [] };
        t.push(x);
      });

      // console.log(t);
      var temp = [];

      var tempRatingStorage = [];
      var indexes = [];
      var tempCount = [];
      DriverRating.find().then(dd => {
        dd.forEach((x, i) => {
          for (var xs = 0; xs < data.length; xs++) {
            if (x.driverId.equals(data[xs]._id)) {
              if (data[xs].attribute[0] == "") {
                data[xs].attribute = [];
              }
              x.attributeId.forEach(p => {
                data[xs].attribute.push(p);
              });
            }
          }
        });
        console.log(data);

        var temp = [];

        data.forEach((d, index) => {
          d.attribute.sort();
          var qc = {
            driverId: d._id,
            att: [],
            driverCount: d.count,
            rating: d.averageQuantity
          };

          temp.push(qc);

          var x = [];

          // console.log(d.attribute);
          var current = null;
          var cnt = 0;
          for (var i = 0; i < d.attribute.length; i++) {
            if (!d.attribute[i].equals(current)) {
              console.log(cnt);
              if (cnt > 0) {
                console.log(current + " comes --> " + cnt + " times<br>");
                var q = { att: "", count: 0, avg: 0 };

                q.att = current;
                q.count = cnt;
                var val = (cnt / d.count) * 100;
                var finalRate = (5 * val) / 100;
                q.avg = finalRate;
                x.push(q);
              }
              current = d.attribute[i];
              cnt = 1;
            } else {
              console.log(current);
              cnt++;
            }
          }
          temp[index]["att"] = x;

          if (cnt > 0) {
            console.log(current + " comes --> " + cnt + " times");
            var q = { att: "", count: 0, avg: 0 };
            q.att = current;
            q.count = cnt;
            var val = (cnt / d.count) * 100;
            var finalRate = (5 * val) / 100;
            q.avg = finalRate;
            x.push(q);
          }
        });
        console.log(temp);
        temp.forEach(element => {
          RatingAverage.findOne({ driverId: element["driverId"] }).then(
            data => {
              if (data == null) {
                const ratingAverage = new RatingAverage({
                  driverId: element["driverId"],
                  driverCount: element["driverCount"],
                  driverAverage: element["rating"],
                  att: element["att"]
                });
                ratingAverage.save().then(dt => {
                  console.log("Average Rating Save");
                });
              } else {
                RatingAverage.findOneAndUpdate(
                  { driverId: element["driverId"] },
                  {
                    driverId: element["driverId"],
                    driverCount: element["driverCount"],
                    driverAverage: element["rating"],
                    att: element["att"]
                  }
                ).then(dt => {
                  console.log("Average Rating Updated");
                });
              }
            }
          );
        });
        res.status(200).json({ ...responseStatus.SUCCESS, data: temp });
      });
    });
  }

  public async schoolsDriver(req: Request, res: Response) {
    const { token, schoolId, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    let obj = new AdminRouter();
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
      res.status(200).json({
        ...responseStatus.FAILURE,
        errorCode: ErrorCodes.INVALID_TOKEN,
        message: INVALID_REQUEST
      });
    } else {
      SchoolToUser.find({ school: schoolId }).then(async schoolToUserData => {
        let users = [];
        let schoolDetail = await School.findById(schoolId).then(schoolData => {
          return schoolData;
        });

        schoolToUserData.forEach(ele => {
          users.push(ele["user"]);
        });
        //console.log(users);

        User.find({
          _id: { $in: users },
          userRole: UserRoles.APP_USER,
          userType: UserTypes.DRIVER
        })
          .populate("documents")
          .then(driverData => {
            //console.log(driverData);

            var finalResult = driverData;
            var finalData = [];
            var totalPages = Math.round(finalResult.length);
            if (finalResult.length > ti) {
              for (let i = p; i < ti; i++) {
                console.log("we", i);

                finalData.push(finalResult[i]);
              }
              //recording logs
              var resTemp = {
                ...responseStatus.SUCCESS,
                data: { userDetail: finalData, schoolDetail: schoolDetail },
                totalPages: totalPages
              };
              var obj = new AdminRouter();
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.SUCCESS,
                data: { userDetail: finalData, schoolDetail: schoolDetail },
                totalPages: totalPages
              });
            } else if (finalResult.length < ti && p < finalResult.length) {
              //console.log("i m inside");
              for (let i = p; i < finalResult.length; i++) {
                finalData.push(finalResult[i]);
              }
              //recording logs
              var obj = new AdminRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                data: { userDetail: finalData, schoolDetail: schoolDetail },
                totalPages: totalPages
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs end

              res.status(200).json({
                ...responseStatus.SUCCESS,
                data: { userDetail: finalData, schoolDetail: schoolDetail },
                totalPages: totalPages
              });
            } else {
              //recording logs
              var obj = new AdminRouter();
              var resTemp1 = {
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: NO_RECORDS_FOUND
              };
              obj.makeLogs(req, resTemp1);
              obj = null;
              //recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE,
                errorCode: ErrorCodes.INVALID_REQUEST,
                message: NO_RECORDS_FOUND
              });
            }
          });
      });
    }
  }

  public async curriculums(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    let obj = new AdminRouter();
    let checkTokenResult = await obj.checkToken(token);
    if (checkTokenResult) {
      Curriculum.find()
        .then(result => {
          // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          var finalResult = result;
          var finalData = [];
          var totalPages = Math.round(finalResult.length);
          if (finalResult.length > ti) {
            for (let i = p; i < ti; i++) {
              console.log("we", i);

              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else if (finalResult.length < ti && p < finalResult.length) {
            console.log("i m inside");
            for (let i = p; i < finalResult.length; i++) {
              finalData.push(finalResult[i]);
            }
            //recording logs
            var obj = new AdminRouter();
            var resTemp = {
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            };
            obj.makeLogs(req, resTemp);
            obj = null;
            //recording logs end
            res.status(200).json({
              ...responseStatus.SUCCESS,
              data: finalData,
              totalPages: totalPages
            });
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp1 = {
              ...responseStatus.FAILURE,
              errorCode: ErrorCodes.INVALID_REQUEST,
              message: NO_RECORDS_FOUND
            };
            obj.makeLogs(req, resTemp1);
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
          //recording logs
          var obj = new AdminRouter();
          var resTemp = {
            ...responseStatus.FAILURE,
            errorCode: ErrorCodes.INVALID_REQUEST,
            message: UNKNOW_ERROR
          };
          obj.makeLogs(req, resTemp);
          obj = null;
          //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
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

      //   Curriculum.find({ isArchived: { $ne: "true" } })
      //     .then(result => {
      //       // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
      //       var finalResult = result;
      //       var finalData = [];
      //       var totalPages = Math.round(finalResult.length);
      //       if (finalResult.length > ti) {
      //         for (let i = p; i < ti; i++) {
      //           console.log("we", i);

      //           finalData.push(finalResult[i]);
      //         }
      //          //recording logs
      //  var obj = new AdminRouter();
      //  var resTemp = {
      //   ...responseStatus.SUCCESS,
      //   data: finalData,
      //   totalPages: totalPages
      //  };
      //  obj.makeLogs(req, resTemp);
      //  obj = null;
      //  //recording logs end
      //         res.status(200).json({
      //           ...responseStatus.SUCCESS,
      //           data: finalData,
      //           totalPages: totalPages
      //         });
      //       } else if (finalResult.length < ti && p < finalResult.length) {
      //         console.log("i m inside");
      //         for (let i = p; i < finalResult.length; i++) {
      //           finalData.push(finalResult[i]);
      //         }
      //         //recording logs
      //  var obj = new AdminRouter();
      //  var resTemp = {
      //   ...responseStatus.SUCCESS,
      //   data: finalData,
      //   totalPages: totalPages
      //  };
      //  obj.makeLogs(req, resTemp);
      //  obj = null;
      //  //recording logs end
      //         res.status(200).json({
      //           ...responseStatus.SUCCESS,
      //           data: finalData,
      //           totalPages: totalPages
      //         });
      //       } else {
      //         //recording logs
      //  var obj = new AdminRouter();
      //  var resTemp1 = {
      //   ...responseStatus.FAILURE, message: NO_RECORDS_FOUND
      //  };
      //  obj.makeLogs(req, resTemp1);
      //  obj = null;
      //  //recording logs end
      //         res
      //           .status(200)
      //           .json({ ...responseStatus.FAILURE, message: NO_RECORDS_FOUND });
      //       }
      //     })
      //     .catch(error => {
      //        //recording logs
      //  var obj = new AdminRouter();
      //  var resTemp = {
      //   ...responseStatus.FAILURE, message: UNKNOW_ERROR
      //  };
      //  obj.makeLogs(req, resTemp);
      //  obj = null;
      //  //recording logs end
      //       res
      //         .status(500)
      //         .json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
      //     });
    }
  }

  //token checking
  private checkToken(token, isSubAdminCreate = false) {
    return new Promise(resolve => {
      if ((token != undefined || token != null) && token.length > 0) {
        var query = {};
        if (isSubAdminCreate) {
          query = {
            token,
            userType: UserTypes.PORTAL_USER,
            userRole: UserRoles.SUPER_ADMIN
          };
        } else {
          query = {
            token,
            userType: UserTypes.PORTAL_USER,
            $or: [
              { userRole: UserRoles.SUPER_ADMIN },
              { userRole: UserRoles.SUB_ADMIN }
            ]
          };
        }
        User.findOne(query).then(data => {
          if (!data || data == null) {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = "checking token fails.";
            obj.makeLogs(token, resTemp);
            obj = null;
            //recording logs end
            resolve(false);
          } else {
            //recording logs
            var obj = new AdminRouter();
            var resTemp = "checking token succeed.";
            obj.makeLogs(token, resTemp);
            obj = null;
            //recording logs end
            resolve(true);
          }
        });
      } else {
        //recording logs
        var obj = new AdminRouter();
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
    this.router.post("/enableDisableSchool", this.enableDisableSchool);
    this.router.post("/createNewRide", this.createNewRide);
    this.router.post("/enableDisableMaster", this.enableDisableMasterDocument);
    this.router.post("/acceptDisableUsers", this.acceptDisableUsers);
    this.router.post("/updateSubAdmin", this.subAdminUpdate);
    this.router.post("/createSubAdmin", this.subAdminCreate);
    this.router.post("/getSubAdmin", this.getSubAdmin);
    this.router.post("/learnerCreate", this.learnerCreate);
    this.router.post("/login", this.login);
    this.router.post("/learners", this.learners);
    this.router.post("/drivers", this.drivers);
    this.router.post("/learnerUpdate", this.learnerUpdate);
    this.router.post("/driverUpdate", this.driverUpdate);
    this.router.post("/profile", this.profile);
    this.router.post("/schoolCreate", this.schoolCreate);
    this.router.post("/schoolDriverCreate", this.schoolDriverCreate);
    this.router.post("/schools", this.schools);
    this.router.post("/schoolDriver", this.schoolsDriver);
    this.router.post("/individualDrivers", this.individualDrivers);
    this.router.post("/schoolDriverRideBooking", this.schoolDriverRideBooking);
    this.router.post("/generateInvoice", this.generateInvoice);
    this.router.post("/createInvoice", this.createInvoice);
    this.router.post("/invoiceDetail", this.invoiceDetail);
    this.router.post("/invoiceDetailById", this.invoiceDetailById);
    this.router.post("/updateInvoiceStatusById", this.updateInvoiceStatusById);
    this.router.post("/createBillingRate", this.createBillingRate);
    this.router.post("/invoices", this.invoices);
    this.router.post("/createTax", this.createTax);
    this.router.post("/updateTestCenterBooking", this.updateTestCenterBooking);
    this.router.post("/bookings", this.bookings);
    this.router.post("/userById", this.userById);
    this.router.post("/schoolUpdate", this.schoolUpdate);
    this.router.post("/schoolDriverUpdate", this.schoolDriverUpdate);
    this.router.post("/bookingHistory", this.bookingHistory);
    this.router.post("/bookingRides", this.bookingRides);
    this.router.post("/testCenterBookings", this.testCenterBookings);
    this.router.post("/updateTestBookingCenter", this.updateTestBookingCenter);
    this.router.post(
      "/bookingDriverAndSlotUpdate",
      this.bookingDriverAndSlotUpdate
    );
    this.router.post("/orderHistory", this.orderHistory);
    this.router.post("/ratingAvg", this.ratingAvg);
    this.router.post("/curriculums", this.curriculums);
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

    var fileName = "AdminRouter" + d + "-" + (m + 1) + "-" + y + ".txt";

    var logStream = fs.createWriteStream("logs/" + fileName, { flags: "a" });
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write(message + "\n");
    logStream.end("this is the end line \n");
  }
}

const adminRouter = new AdminRouter();
adminRouter.routes();

export default adminRouter.router;
