import { BaseURL } from "./../constants/BaseURL";
import { UserRoles } from "./../constants/UserRoles";
import { UserTypes } from "./../constants/UserTypes";
import Booking from "../models/Booking";
import RideBooking from "../models/RideBooking";
import Order from "../models/Order";
import { NotificationTypes } from "./../constants/NotificationTypes";
import * as cors from 'cors';
import Slot from "../masters/Slot";
var nodemailer = require('nodemailer');
import EmailSendClass from "../utilities/EmailSend"

import LearnerInvoice from "../models/LearnerInvoice";
import {
  DRIVER_CREATED_ADDED_TO_SCHOOL,
  INVALID_REQUEST,
  DRIVER_CREATED_SUCCESS,
  EMAIL_ALREADY_EXISTS,
  UNKNOW_ERROR,
  INFORMATION_UPDATED_SUCCESS,
  NO_RECORDS_FOUND,
  USER_ALREADY_EXISTS,
  MOBILE_NUMBER_ALREADY_EXISTS,
  PAYMENT_FAILED,
  ORDER_BOOK_SUCCESS,
  FAILED_PAYMENT_STATUS_UPDATE
} from "./../constants/Messages";
import { responseStatus } from "./../constants/responseStatus";
import { FileTypes } from "./../constants/FileTypes";
import { Request, Response, Router } from "express";
import express = require("express");
import multer = require("multer");
import User from "../models/User";
import Document from "../models/Document";
import VehicleType from "../masters/VehicleType";
import City from "../models/City";
import State from "../models/State";
import Country from "../models/Country";
import Invoice from "../models/Invoice";
import * as fs from "fs";
import * as uuidv1 from "uuid/v1";
import DocumentType from "../masters/DocumentType";
import GearType from "../masters/GearType";
import Curriculum from "../masters/Curriculum";
import Attribute from "../masters/Attribute";
import PushInfo from "../models/PushInfo";
import Utils from "../utilities/utils";
import Address from "../models/Address";
import CarInfo from "../models/CarInfo";
import School from "../models/School";
import SchoolToUser from "../models/SchoolToUser";
import { Md5 } from "md5-typescript";
import { AddressOf } from "./../constants/AddressOf";
import { strict } from "assert";
import UserDetails from "./UserDetails";
import LearnerCurriculumProgress from "../models/LearnerCurriculumProgress";
import { ErrorCodes } from "../constants/ErrorCodes";

const force_upload = multer({
  limits: { fieldSize: 25 * 1024 * 1024 }
});

export class CommonRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  public async slots(req: Request, res: Response) {
    const { token } = req.body;

    let obj = new CommonRouter();
    let userDetails = await UserDetails.getUserDetails(token);
    console.log(userDetails);

    if( (userDetails.userType == UserTypes.PORTAL_USER && userDetails.userRole == UserRoles.SUPER_ADMIN)
    || 
    (userDetails.userType == UserTypes.PORTAL_USER && userDetails.userRole == UserRoles.SUB_ADMIN)
    ||
    (userDetails.userType == UserTypes.LEARNER && userDetails.userRole == UserRoles.APP_USER)
    ){
      Slot.find({ isArchived: { $ne: "true" } })
      .then(result => {
        //recording logs
        var obj = new CommonRouter();
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
        var obj = new CommonRouter();
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
      console.log("ggg");
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
     
          
          
    }
  }

  public async paymentStatus(req: Request, res: Response): void {

    var currentBookingId = "";
    const {
      token,
      orderId,
      paymentType,
      paymentStatus,
      paymentId,
      transactionId
    } = req.body;
    
    let userDetails = await UserDetails.getUserDetails(token);
    if((userDetails.userType == UserTypes.PORTAL_USER && userDetails.userRole == UserRoles.SUPER_ADMIN)
        || 
        (userDetails.userType == UserTypes.PORTAL_USER && userDetails.userRole == UserRoles.SUB_ADMIN)
        ||
        (userDetails.userType == UserTypes.LEARNER && userDetails.userRole == UserRoles.APP_USER)
    ){

    if ((orderId == undefined && paymentType == undefined && paymentId == undefined && transactionId == undefined )) {
        
     //recording logs
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,message:INVALID_REQUEST
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
      res.status(200).json({...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,message:INVALID_REQUEST})

    }else {
            Order.findOne({ paymentId: paymentId }).then(fn_data => {
              if (fn_data != null) {
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: "Payment ID is already exist"
                });
              } else {
                Order.findOneAndUpdate(
                  { _id: orderId },
                  { paymentType, paymentStatus, paymentId, transactionId,updatedBy:userDetails._id,updatedDate:Date.now() },
                  { new: true }
                )
                  .populate("packageId")
                  .populate("slotId")
                  .then(result => {
                    console.log("paymentStatus", result);
                    if (req.body.paymentStatus == "COMPLETED") {
                      //Here booking and slots then all done give a message....
                      console.log("res", result);

                      const { packageId } = result["packageId"]._id;
                      const driver = result["driverId"];
                      const learner = result["learnerId"];
                      const lessonStartDate = result["lessonStartDate"];
                      const pickUpAddress = result["pickUpAddressId"];
                      let date = new Date(lessonStartDate);

                      date.setDate(
                        date.getDate() +
                          Number(result["packageId"].numberOfDay - 1)
                      );
                      const lessonEndDate = date;

                      const booking = new Booking({
                        orderId: result._id,
                        packageId: packageId,
                        driverId: driver,
                        learnerId: learner,
                        lessonStartDate: lessonStartDate,
                        lessonEndDate: lessonEndDate,
                        createdBy:userDetails._id
                      });
                      booking
                        .save()
                        .then(resp => {
                          if (resp && resp._id) {
                            currentBookingId = resp._id;
                            const rideBookings = [];
                            const from = result["slotId"]["fromTime"].split(
                              ":"
                            );
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
                              console.log(
                                "date::::",
                                startDateTime,
                                endDateTime
                              );

                              var otp = Math.floor(Math.random() * 1000000 + 1);

                              const rideBooking = new RideBooking({
                                bookingId: resp._id,
                                status: "NOT_ACTIVE",
                                driverId: driver,
                                slotId: result["slotId"]._id,
                                pickUpAddress: pickUpAddress,
                                dropAddress: pickUpAddress,
                                startDateTime: startDateTime,
                                endDateTime: endDateTime,
                                otp: otp,
                                createdBy:userDetails._id
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
                                      createdBy:userDetails._id
                                    });

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
                                          createdBy:userDetails._id
                                        });

                                        if (k == curr.length - 1) {
                                          LearnerCurriculumProgress.insertMany(
                                            curs
                                          );
                                        }
                                      });
                                    });

                                     //recording logs
     var obj = new CommonRouter();
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
                                    console.log(error);
                                    Booking.findOneAndUpdate(
                                      { _id: currentBookingId },
                                      {
                                        hasError:
                                          "Booking created, but got error and error is :- " +
                                          error["message"],
                                          updatedBy:userDetails._id,
                                          updatedDate:Date.now()
                                      }
                                    ).then(x => {});

                                    //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end

                                    res.status(200).json({
                                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                      message: UNKNOW_ERROR + error
                                    });
                                  });
                              }
                            }
                          } else {
                            //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
      message: FAILED_PAYMENT_STATUS_UPDATE
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                            res.status(200).json({
                              ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                              message: FAILED_PAYMENT_STATUS_UPDATE
                            });
                          }
                        })
                        .catch(error => {
                          console.log(error);
                          Booking.findOneAndUpdate(
                            { _id: currentBookingId },
                            {
                              hasError:
                                "Booking created, but got error and error is :- " +
                                error["message"],
                                updatedBy:userDetails._id,
                                updatedDate:Date.now()
                            }
                          ).then(x => {});
 //recording logs
 var obj = new CommonRouter();
 var resTemp = {
   ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
   message: UNKNOW_ERROR + error["message"]
 };
 obj.makeLogs(req, resTemp);
 obj = null;
 //recording logs end
                          res.status(200).json({
                            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
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
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
      message: PAYMENT_FAILED
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                      res.status(200).json({
                        ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                        message: PAYMENT_FAILED
                      });
                    }
                  })
                  .catch(error => {
                    res.status(200).json({
                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR + "23"
                    });
                  });
              }
            });
          } //end here order update
        } else {
          //recording logs
     var obj = new CommonRouter();
     var resTemp1 = {
      ...responseStatus.FAILURE,
      errorCode:ErrorCodes.INVALID_TOKEN,
      message: INVALID_REQUEST
     };
     obj.makeLogs(req, resTemp1);
     obj = null;
     //recording logs end
                      res.status(200).json({
                        ...responseStatus.FAILURE,
                        errorCode:ErrorCodes.INVALID_TOKEN,
                        message: INVALID_REQUEST
                       });
        }

  }


  /**
   * companions
   */
  public companions(req: Request, res: Response): void {
    const { searchText, driverId,token } = req.body;
    if (req.body.searchText) {
      User.find({
        userType: UserTypes.DRIVER,
        userRole: UserRoles.APP_USER,
        $or: [
          { firstName: { $regex: searchText, $options: "$i" } },
          { lastName: { $regex: searchText, $options: "$i" } },
          { email: { $regex: searchText, $options: "$i" } }
        ]
      })
        .select(["firstName", "lastName", "profilePictureUrl"])
        .then(data => {
          if (driverId != "" || driverId != null) {
            const mongoose = require("mongoose");

            if (data != null) {
              var fData = data.filter(el => {
                if (!el._id.equals(driverId)) {
                  return el;
                }
              });
            }
          }
           //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: fData
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: fData });
        })
        .catch(error => {
           //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + error["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    } else {
      //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: [] 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
      res.status(200).json({ ...responseStatus.SUCCESS, data: [] });
    }
  }

  /**
   * pushInfo
   */
  public async pushInfo(req: Request, res: Response): void {
    const { deviceId, userId, pushToken, os, userType, userRole } = req.body;
    let userDetails = await UserDetails.getUserDetails(userId);
    if(
    (userDetails.userType == UserTypes.DRIVER && userDetails.userRole == UserRoles.APP_USER)
    ||
    (userDetails.userType == UserTypes.LEARNER && userDetails.userRole == UserRoles.APP_USER)
){

    if (
      req.body.deviceId &&
      req.body.userId &&
      req.body.pushToken &&
      req.body.os &&
      req.body.userType &&
      req.body.userRole
    ) {
      PushInfo.findOne({ deviceId, userId, os })
        .then(result => {
          if (!result && result == null) {
            console.log("push -save", result);
            let pushInfo = new PushInfo({
              deviceId,
              userId,
              pushToken,
              os,
              userType,
              userRole,
              createdBy:userDetails._id
            });
            console.log("pushinfo", pushInfo);
            pushInfo
              .save()
              .then(data => {
                //recording logs
     var obj = new CommonRouter();
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
                console.log(err);
                 //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
      message: UNKNOW_ERROR + err["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                res.status(500).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR 
                });
              });
          } else {
            console.log(
              "iii",
              pushToken,
              "device",
              deviceId,
              "os",
              os,
              "userId",
              userId
            );
            PushInfo.findOneAndUpdate({ deviceId, userId, os }, { pushToken,updatedBy:userDetails._id,updatedDate:Date.now() })
              .then(data => {
                console.log("push-update-succ");
                //recording logs
     var obj = new CommonRouter();
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
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + err["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                res.status(500).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR
                });
              });
          }
        })
        .catch(err => {
           //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + err["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    } else {
      console.log("invalid");
       //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: INVALID_REQUEST
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
      res
        .status(200)
        .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST });
    }
  }else {
      //recording logs
 var obj = new CommonRouter();
 var resTemp1 = {
  ...responseStatus.FAILURE,
  errorCode:ErrorCodes.INVALID_TOKEN,
  message: INVALID_REQUEST
 };
 obj.makeLogs(req, resTemp1);
 obj = null;
 //recording logs end
                  res.status(200).json({
                    ...responseStatus.FAILURE,
                    errorCode:ErrorCodes.INVALID_TOKEN,
                    message: INVALID_REQUEST
                   });
    }
  }

  public vehicleTypes(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    if (req.body.token) {
      VehicleType.find()
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
     var obj = new CommonRouter();
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
     var obj = new CommonRouter();
     var resTemp1 = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: NO_RECORDS_FOUND
     };
     obj.makeLogs(req, resTemp1);
     obj = null;
     //recording logs end
            res
              .status(200)
              .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: NO_RECORDS_FOUND });
          }
        })
        .catch(error => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + error["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    } else {
      VehicleType.find({ isArchived: { $ne: "true" } })
        .then(result => {
           //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        })
        .catch(error => {
            //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    }
  }

 

  public attributes(req: Request, res: Response): void {
    Attribute.find({ isArchived: { $ne: "true" } })
      .then(result => {
         //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
        res.status(200).json({ ...responseStatus.SUCCESS, data: result });
      })
      .catch(error => {
         //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
        res
          .status(500)
          .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
      });
  }

  public countries(req: Request, res: Response): void {
    const { token } = req.body;

    // let perPage = 10;
    // let p = Number(page) * perPage;
    // let ti = p + perPage;

    if (req.body.token) {
      Country.find()
        .then(result => {
          // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          var finalResult = result;
          var finalData = [];
          var totalPages = Math.round(finalResult.length);
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });

          //  if(finalResult.length > ti){
          //    for(let i=p; i < ti; i++){
          //      console.log("we",i);

          //      finalData.push(finalResult[i]);
          //    }
          //    res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages  });

          //  }else if(finalResult.length < ti && p < finalResult.length){
          //    console.log("i m inside");
          //    for(let i=p; i < finalResult.length; i++){
          //      finalData.push(finalResult[i]);
          //    }
          //    res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages  });

          //  }else{
          //    res.status(200).json({ ...responseStatus.FAILURE, message: NO_RECORDS_FOUND});
          //  }
        })
        .catch(error => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    } else {
      Country.find({ isArchived: { $ne: "true" } })
        .then(result => {
           //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        })
        .catch(error => {
           //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    }
  }

  public states(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    if (req.body.token) {
      State.find()
        .then(result => {
           //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          // var finalResult = result;
          // var finalData = [];
          // var totalPages = Math.round(finalResult.length);
          //  if(finalResult.length > ti){
          //    for(let i=p; i < ti; i++){
          //      console.log("we",i);

          //      finalData.push(finalResult[i]);
          //    }
          //    res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages  });

          //  }else if(finalResult.length < ti && p < finalResult.length){
          //    console.log("i m inside");
          //    for(let i=p; i < finalResult.length; i++){
          //      finalData.push(finalResult[i]);
          //    }
          //    res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages  });

          //  }else{
          //    res.status(200).json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: NO_RECORDS_FOUND});
          //  }
        })
        .catch(error => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    } else {
      State.find({ isArchived: { $ne: "true" } })
        .then(result => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        })
        .catch(error => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    }
  }

  public cities(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    if (req.body.token) {
      City.find()
        .then(result => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          // var finalResult = result;
          // var finalData = [];
          // var totalPages = Math.round(finalResult.length);
          //  if(finalResult.length > ti){
          //    for(let i=p; i < ti; i++){
          //      console.log("we",i);

          //      finalData.push(finalResult[i]);
          //    }
          //    res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages  });

          //  }else if(finalResult.length < ti && p < finalResult.length){
          //    console.log("i m inside");
          //    for(let i=p; i < finalResult.length; i++){
          //      finalData.push(finalResult[i]);
          //    }
          //    res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages  });

          //  }else{
          //    res.status(200).json({ ...responseStatus.FAILURE, message: NO_RECORDS_FOUND});
          //  }
        })
        .catch(error => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    } else {
      City.find({ isArchived: { $ne: "true" } })
        .then(result => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, data: result 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        })
        .catch(error => {
          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR 
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(500)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
        });
    }
  }

  // public states(req: Request, res: Response): void {
  //   const {parent} = req.body;
  //   State.find({parent})
  //   .then((result) => {
  //     res.status(200).json({ ...responseStatus.SUCCESS, data: result });
  //   })
  //   .catch((error) => {
  //     res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
  //   });
  // }

  // public cities(req: Request, res: Response): void {
  //   const {parent} = req.body;
  //   City.find({parent})
  //   .then((result) => {
  //     res.status(200).json({ ...responseStatus.SUCCESS, data: result });
  //   })
  //   .catch((error) => {
  //     res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
  //   });
  // }

  public async resource(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {

    const { fileType, id, files } = req.body;
    let userDetails = await UserDetails.getUserDetails(id);

    let d = new Date();
    let filesData = [];
    let clientFilesData = req.body.files;
    let fileArray = JSON.parse(clientFilesData);
    console.log(userDetails);
    if(
      
      (userDetails.userType == UserTypes.LEARNER && userDetails.userRole == UserRoles.APP_USER)
  ){
    DocumentType.find()
      .then(result => {
        if (
          result &&
          result.length &&
          fileArray.data &&
          fileArray.data.length
        ) {
          let docTypes: any = [];
          for (let l = 0; l < result.length; l++) {
            docTypes.push({ name: result[l]["name"], _id: result[l]["_id"] });
            if (l == result.length - 1) {
              // console.log(docTypes);
              fileArray.data.forEach((file, i) => {
                let fileName = d.getTime() + "" + i;
                let resourceType = file["resourceType"];
                let docTypeId = "";

                for (let j = 0; j < docTypes.length; j++) {
                  if (docTypes[j]["name"] == file["documentType"]) {
                    docTypeId = docTypes[j]["_id"];
                  }
                }

                fs.writeFile(
                  "uploads/" + fileName,
                  file["data"],
                  { encoding: "base64" },
                  err => {
                    let rt = resourceType || "";
                    let dt = docTypeId || "";

                    filesData.push({
                      value: fileName,
                      documentType: dt,
                      resourceType: rt,
                      createdBy:userDetails._id
                    });
                    // console.log(filesData);
                    let pcount = 0;
                    let dcount = 0;
                    if (i == fileArray.data.length - 1) {
                      if (fileType == FileTypes.PROFILE_PICTURE && id) {
                        User.findOneAndUpdate(
                          { _id: id },
                          { profilePictureUrl: filesData[0]["value"],updatedBy:userDetails._id,updatedDate:Date.now() }
                        )
                          .then(data => {
                            //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                            res.status(200).json({
                              ...responseStatus.SUCCESS,
                              message: INFORMATION_UPDATED_SUCCESS
                            });

                            //  User.findOne({_id : id}).populate('documents').then(imageData=>{
                            //    console.log("img", imageData);
                            //   if(imageData['profilePictureUrl'] && imageData['documents'].length > 0 ){

                            //     imageData['documents'].forEach(element => {
                            //       console.log("first-",element);
                            //        Utils.faceMatch(BaseURL.PUBLIC_RESOURCE_URL+imageData['profilePictureUrl'], BaseURL.PUBLIC_RESOURCE_URL+element['value']).then(resl=>{
                            //         pcount++;
                            //         if(resl['status'] == 1){
                            //           console.log("match=>...");
                            //          Document.findOneAndUpdate( {_id :  element['_id']},{isVerified: 1}).then(dadtta=>{
                            //           // res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS });
                            //          })
                            //          .catch((error) => {

                            //           //res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });

                            //         });
                            //         }else{
                            //           console.log("no match=>...");
                            //           Document.findOneAndUpdate( {_id :  element['_id']},{isVerified: 0}).then(dadtta=>{
                            //          //  res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                            //          })
                            //          .catch((error) => {

                            //          // res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });

                            //         });
                            //         }
                            //       })
                            //     });
                            //     if(pcount ==2){
                            //       res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                            //     }
                            //     //end foreach loop
                            //    }else{
                            //      //update user with verified status= false
                            //    }
                            //  })
                            //  .catch((error) => {

                            //   res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });

                            // });
                          })
                          .catch(err => {
                            //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR  + err["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                            res.status(500).json({
                              ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                              message: UNKNOW_ERROR
                            });
                          });
                      } else if (fileType == FileTypes.DRIVER_DOCS && id) {
                        Document.insertMany(filesData)
                          .then(data => {
                            // console.log("final Data:", data);
                            let documents = [];

                            var enteredTimes = 0;

                            for (let i = 0; i < data.length; i++) {
                              documents.push(data[i]._id);
                              if (i == data.length - 1) {
                                User.findOneAndUpdate(
                                  {
                                    _id: id,
                                    userType: UserTypes.DRIVER,
                                    userRole: UserRoles.APP_USER,
                                    updatedBy: userDetails._id,
                                    updatedDate: Date.now()
                                  },
                                  { documents: documents }
                                )
                                  .then(data => {
                                    User.findOne({ _id: id })
                                      .populate("documents")
                                      .then(imageData => {
                                        console.log("imageData", imageData);
                                        if (
                                          imageData["profilePictureUrl"] &&
                                          imageData["documents"].length > 0
                                        ) {
                                          imageData["documents"].forEach(
                                            element => {
                                              console.log("sec-", element);
                                              Utils.faceMatch(
                                                BaseURL.PUBLIC_RESOURCE_URL +
                                                  imageData[
                                                    "profilePictureUrl"
                                                  ],
                                                BaseURL.PUBLIC_RESOURCE_URL +
                                                  element["value"]
                                              ).then(resl => {
                                                dcount++;
                                                enteredTimes++;
                                                var message =
                                                  "\n from resource api" +
                                                  new Date().toISOString() +
                                                  " : " +
                                                  "UserId: " +
                                                  id +
                                                  "\n" +
                                                  JSON.stringify(resl) +
                                                  "\n";

                                                var logStream = fs.createWriteStream(
                                                  "logs/info.txt",
                                                  { flags: "a" }
                                                );
                                                // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
                                                logStream.write(message);
                                                logStream.end(
                                                  "this is the end line \n"
                                                );
                                                if (resl["status"] == 1) {
                                                  console.log("match=>...");
                                                  Document.findOneAndUpdate(
                                                    { _id: element["_id"] },
                                                    { isVerified: 1,updatedBy:userDetails._id,updatedDate:Date.now() }
                                                  )
                                                    .then(dadtta => {
                                                      //res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS });
                                                      if (enteredTimes > 1) {
                                                        //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS
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
                                                      // res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
                                                    });
                                                } else {
                                                  console.log("no match=>...");
                                                  Document.findOneAndUpdate(
                                                    { _id: element["_id"] },
                                                    { isVerified: 0,updatedBy:userDetails._id,updatedDate:Date.now() }
                                                  )
                                                    .then(dadtta => {
                                                      //  res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                                                      if (enteredTimes > 1) {
                                                        //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS, message: "Account created but documentes not verified, Please contact to admin."
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                                                        res.status(200).json({
                                                          ...responseStatus.SUCCESS,
                                                          message:
                                                            "Account created but documentes not verified, Please contact to admin."
                                                        });
                                                      }
                                                    })
                                                    .catch(error => {
                                                      // res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
                                                    });
                                                }
                                              });
                                            }
                                          );
                                          if (dcount == 2) {
                                            //  res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                                          }
                                          //end foreach loop
                                        } else {
                                          //update user with verified status= false
                                        }
                                      })
                                      .catch(error => {
                                        //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + error["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                                        res.status(500).json({
                                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                          message: UNKNOW_ERROR
                                        });
                                      });
                                  })
                                  .catch(err => {
                                    //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + err["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                                    res.status(500).json({
                                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                      message: UNKNOW_ERROR
                                    });
                                  });
                              }
                            }
                          })
                          .catch(error => {
                            console.log("track1::::", error);
                              //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + error["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                            res.status(500).json({
                              ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                              message: UNKNOW_ERROR
                            });
                          });
                      } else {
                          //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                        res.status(200).json({
                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                          message: INVALID_REQUEST
                        });
                      }
                    }
                  }
                );
              });
            }
          }
        } else {
            //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
          res
            .status(200)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST });
        }
      })
      .catch(err => {
        console.log(err);
         //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + err["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
        res
          .status(500)
          .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
      });
    } else {
       //recording logs
 var obj = new CommonRouter();
 var resTemp1 = {
  ...responseStatus.FAILURE,
  errorCode:ErrorCodes.INVALID_TOKEN,
  message: INVALID_REQUEST
 };
 obj.makeLogs(req, resTemp1);
 obj = null;
 //recording logs end
                  res.status(200).json({
                    ...responseStatus.FAILURE,
                    errorCode:ErrorCodes.INVALID_TOKEN,
                    message: INVALID_REQUEST
                   });
    }
  }

  public saveFilesToDisk(fileName, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile("uploads/" + fileName, data, { encoding: "base64" }, err => {
        if (err) {
          reject({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: err });
        }
        resolve({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: err });
      });
    });

    // files.data.forEach(function(x,index){
    //   var fileName = d.getTime();
    //   fs.writeFile('uploads/'+fileName, x["data"], {encoding: 'base64'}, (err) => {
    //     console.log(err,"i m file error" , count++);

    //   })

    // })
    //return;
  }

  public resourceUpload(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    const { fileType, id, files } = req.body;
    let d = new Date();
    let filesData = [];
    let clientFilesData = req.body.files;
    let fileArray = JSON.parse(clientFilesData);
    //var x = new CommonRouter();
    //x.saveFilesToDisk(fileArray);

    DocumentType.find()
      .then(result => {
        if (
          result &&
          result.length &&
          fileArray.data &&
          fileArray.data.length
        ) {
          let docTypes: any = [];
          for (let l = 0; l < result.length; l++) {
            docTypes.push({ name: result[l]["name"], _id: result[l]["_id"] });
            if (l == result.length - 1) {
              // console.log(docTypes);
              fileArray.data.forEach((file, i) => {
                let fileName = d.getTime() + "" + i;
                let resourceType = file["resourceType"];
                let docTypeId = "";

                for (let j = 0; j < docTypes.length; j++) {
                  if (docTypes[j]["name"] == file["documentType"]) {
                    docTypeId = docTypes[j]["_id"];
                  }
                }

                var x = new CommonRouter();
                x.saveFilesToDisk(fileName, file["data"])
                  .then(x => {
                    console.log("done na done");
                    // })
                    // fs.writeFile('uploads/'+fileName, file['data'], {encoding: 'base64'}, (err) => {
                    //   if(err){
                    //     res.status(200).json({ ...responseStatus.FAILURE, message: "file uploading failed"+err});
                    //   }
                    let rt = resourceType || "";
                    let dt = docTypeId || "";

                    filesData.push({
                      value: fileName,
                      documentType: dt,
                      resourceType: rt
                    });
                    // console.log(filesData);
                    let pcount = 0;
                    let dcount = 0;
                    if (i == fileArray.data.length - 1) {
                      if (fileType == FileTypes.PROFILE_PICTURE && id) {
                        User.findOneAndUpdate(
                          { _id: id },
                          { profilePictureUrl: filesData[0]["value"] }
                        )
                          .then(data => {
                            res.status(200).json({
                              ...responseStatus.SUCCESS,
                              message: INFORMATION_UPDATED_SUCCESS
                            });
                            //  User.findOne({_id : id}).populate('documents').then(imageData=>{
                            //    console.log("img", imageData);
                            //   if(imageData['profilePictureUrl'] && imageData['documents'].length > 0 ){

                            //     imageData['documents'].forEach(element => {
                            //       console.log("first-",element);
                            //        Utils.faceMatch(BaseURL.PUBLIC_RESOURCE_URL+imageData['profilePictureUrl'], BaseURL.PUBLIC_RESOURCE_URL+element['value']).then(resl=>{

                            //         if(resl['status'] == 1){

                            //           console.log("match=>...");
                            //          Document.findOneAndUpdate( {_id :  element['_id']},{isVerified: 1}).then(dadtta=>{
                            //           pcount++;
                            //           if(pcount > 1){
                            //             res.status(200).json({ ...responseStatus.SUCCESS, message: "Your document verification has completed" });

                            //            }
                            //          })
                            //          .catch((error) => {

                            //           //res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });

                            //         });
                            //         }else{
                            //           console.log("no match=>...");
                            //           Document.findOneAndUpdate( {_id :  element['_id']},{isVerified: 0}).then(dadtta=>{
                            //             pcount++;
                            //             if(dcount > 1){
                            //               res.status(200).json({ ...responseStatus.SUCCESS, message: "Your document verification has not completed" });

                            //              }
                            //          //  res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                            //          })
                            //          .catch((error) => {

                            //          // res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });

                            //         });
                            //         }
                            //       })
                            //     });
                            //     //if(pcount ==2){
                            //     //  res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                            //    // }
                            //     //end foreach loop
                            //    }else{
                            //      //update user with verified status= false
                            //    }
                            //  })
                            //  .catch((error) => {

                            //   res.status(500).json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });

                            // });
                          })
                          .catch(err => {
                            res.status(500).json({
                              ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                              message: UNKNOW_ERROR
                            });
                          });
                      } else if (fileType == FileTypes.DRIVER_DOCS && id) {
                        Document.insertMany(filesData)
                          .then(data => {
                            console.log("final Data:", data);
                            let documents = [];

                            for (let i = 0; i < data.length; i++) {
                              documents.push(data[i]._id);

                              if (i == data.length - 1) {
                                User.findOneAndUpdate(
                                  {
                                    _id: id,
                                    userType: UserTypes.DRIVER,
                                    userRole: UserRoles.APP_USER
                                  },
                                  { documents: documents }
                                )
                                  .then(data => {
                                    User.findOne({ _id: id })
                                      .populate("documents")
                                      .then(imageData => {
                                        console.log("imageData", imageData);
                                        if (
                                          imageData["profilePictureUrl"] &&
                                          imageData["documents"].length > 0
                                        ) {
                                          imageData["documents"].forEach(
                                            element => {
                                              console.log("sec-", element);

                                              Utils.faceMatch(
                                                BaseURL.PUBLIC_RESOURCE_URL +
                                                  imageData[
                                                    "profilePictureUrl"
                                                  ],
                                                BaseURL.PUBLIC_RESOURCE_URL +
                                                  element["value"]
                                              ).then(resl => {
                                                dcount++;

                                                var str =
                                                  BaseURL.PUBLIC_RESOURCE_URL +
                                                  imageData[
                                                    "profilePictureUrl"
                                                  ];
                                                str +=
                                                  BaseURL.PUBLIC_RESOURCE_URL +
                                                  element["value"];

                                                var message =
                                                  "\n from resource upload " +
                                                  new Date().toISOString() +
                                                  " : " +
                                                  "UserId: " +
                                                  id +
                                                  "\n" +
                                                  JSON.stringify(resl) +
                                                  "\n";

                                                var logStream = fs.createWriteStream(
                                                  "logs/info.txt",
                                                  { flags: "a" }
                                                );
                                                // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
                                                logStream.write(message);
                                                logStream.end(
                                                  "this is the end line \n"
                                                );

                                                if (resl["status"] == 1) {
                                                  console.log("match=>...");
                                                  Document.findOneAndUpdate(
                                                    { _id: element["_id"] },
                                                    { isVerified: 1 }
                                                  )
                                                    .then(dadtta => {
                                                      if (dcount > 1) {
                                                        res.status(200).json({
                                                          ...responseStatus.SUCCESS,
                                                          message:
                                                            "Your document verification has completed"
                                                        });
                                                      }
                                                    })
                                                    .catch(error => {
                                                      res.status(500).json({
                                                        ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                                        message:
                                                          UNKNOW_ERROR + 2
                                                      });
                                                    });
                                                } else {
                                                  console.log("no match=>...");

                                                  Document.findOneAndUpdate(
                                                    { _id: element["_id"] },
                                                    { isVerified: 0 }
                                                  )
                                                    .then(dadtta => {
                                                      //                                //  res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                                                      if (dcount > 1) {
                                                        res.status(200).json({
                                                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                                          message:
                                                            "Your document verification has not completed " +
                                                            str
                                                        });
                                                      }
                                                    })
                                                    .catch(error => {
                                                      res.status(500).json({
                                                        ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                                        message:
                                                          UNKNOW_ERROR + 1
                                                      });
                                                    });
                                                }
                                              });
                                            }
                                          );
                                          // if(dcount ==2){
                                          // res.status(200).json({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS});
                                          // }
                                          //end foreach loop
                                        } else {
                                          //update user with verified status= false
                                          res.status(500).json({
                                            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                            message: UNKNOW_ERROR + id
                                          });
                                        }
                                      })
                                      .catch(error => {
                                        res.status(500).json({
                                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                          message: UNKNOW_ERROR
                                        });
                                      });
                                  })
                                  .catch(err => {
                                    res.status(500).json({
                                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                                      message: UNKNOW_ERROR
                                    });
                                  });
                              }
                            }
                          })
                          .catch(error => {
                            console.log("track1::::", error);
                            res.status(500).json({
                              ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                              message: UNKNOW_ERROR
                            });
                          });
                      } else {
                        res.status(200).json({
                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                          message: INVALID_REQUEST
                        });
                      }
                    }
                  })
                  .catch(function(err) {
                    console.log(err);
                  });
              });
            }
          }
        } else {
          res
            .status(200)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST });
        }
      })
      .catch(err => {
        console.log(err);
        res
          .status(500)
          .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
      });
  }

  public addDummyInvoice(req: Request, res: Response): void {
    const { invoiceGeneratedId, driverId, amount, description, tax } = req.body;
    let userDetails = UserDetails.getUserDetails(driverId);
    let inv = new Invoice({
      invoiceGeneratedId,
      driverId,
      amount,
      description,
      tax,
      createdBy:userDetails._id
    });
    inv
      .save()
      .then(result => {
         //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.SUCCESS
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
        res.status(200).json({ ...responseStatus.SUCCESS });
      })
      .catch(error => {
        console.log("inn", error);
         //recording logs
     var obj = new CommonRouter();
     var resTemp = {
      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + error["message"]
     };
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
        res
          .status(500)
          .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
      });
  }

  public verifyFaceIdentity(req: Request, res: Response): void {
    const { identifier } = req.body;

    User.findOne({ _id: identifier })
      .populate("documents")
      .then(data => {
        let imageURL = BaseURL.PUBLIC_RESOURCE_URL + data["profilePictureUrl"];
        let licenceURL = "";
        console.log("image_url", imageURL);
        let documents = data["documents"];
        let licenceDocumentId = "";
        // console.log(data);
        DocumentType.find()
          .then(resp => {
            for (let i = 0; i < resp.length; i++) {
              console.log("DocumentType", resp[i]);
              if (resp[i]["name"] == "DRIVING_LICENSE") {
                licenceDocumentId = resp[i]._id;
                console.log("in...");
              }
              if (i == resp.length - 1) {
                for (let k = 0; k < documents.length; k++) {
                  console.log(
                    "document",
                    typeof documents[k]["documentType"],
                    typeof licenceDocumentId
                  );
                  if (documents[k]["documentType"].equals(licenceDocumentId)) {
                    licenceURL =
                      BaseURL.PUBLIC_RESOURCE_URL + documents[k]["value"];
                    console.log("document in...", licenceURL);
                  }
                  if (k == documents.length - 1) {
                    console.log(imageURL, licenceURL);
                    Utils.faceMatch(imageURL, licenceURL)
                      .then(result => {
                        // console.log(result);
                         //recording logs
     var obj = new CommonRouter();
     var resTemp = result
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                        res.status(200).json(result);
                      })
                      .catch(err => {
                        console.log(err);
                          //recording logs
     var obj = new CommonRouter();
     var resTemp = { ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
      message: UNKNOW_ERROR + err["message"]}
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
                        res.status(500).json({
                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                          message: UNKNOW_ERROR
                        });
                      });
                  }
                }
              }
            }
          })
          .catch(err => {
            console.log("....", err);
            //recording logs
     var obj = new CommonRouter();
     var resTemp = { ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
      message: UNKNOW_ERROR + err["message"]}
     obj.makeLogs(req, resTemp);
     obj = null;
     //recording logs end
            res
              .status(500)
              .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
          });
      })
      .catch(error => {
//recording logs
var obj = new CommonRouter();
var resTemp = { ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
 message: UNKNOW_ERROR + error["message"]}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
        res
          .status(500)
          .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
      });
  }
  /**
   * driverUpdate
   */
  public async driverUpdate(req: Request, res: Response): void {
    const {
      token,
      driverId,
      isVerified,
      email,
      firstName,
      lastName,
      password,
      adiOrPdiBadgeNumber,
      drivingLicense,
      companions,
      mobileNumber,
      documents,
      countryCode,
      aboutme,
      isArchived,
      schoolId
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

    let userDetails = await UserDetails.getUserDetails(token).catch((err)=>{console.log("catched")})
    console.log(userDetails,"dd");
    if(userDetails != undefined){
    if((userDetails.userType == UserTypes.PORTAL_USER && userDetails.userRole == UserRoles.SUPER_ADMIN)
        || 
        (userDetails.userType == UserTypes.PORTAL_USER && userDetails.userRole == UserRoles.SUB_ADMIN)
        ||
        (userDetails.userType == UserTypes.DRIVER && userDetails.userRole == UserRoles.APP_USER) 
        ||
        (userDetails.userType == UserTypes.PORTAL_USER && userDetails.userRole == UserRoles.SCHOOL_USER)

    ){
      var tempEmail = new RegExp(email ,"i");

      User.find({ email: tempEmail,_id:{$ne:driverId} }).then(result => {
        if (result && result["_id"]) {
          //recording logs
var obj = new CommonRouter();
var resTemp = { ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: USER_ALREADY_EXISTS}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
          res
            .status(200)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: USER_ALREADY_EXISTS });
        } else {
          User.findOne({ _id: driverId }).then(
            re => {
              console.log(req.body.token, ">>>>>>>>>>vivek token");

              if (re == null) {
                //recording logs
var obj = new CommonRouter();
var resTemp = { ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: INVALID_REQUEST
                });
              } else if (!re && re._id == null) {
                //recording logs
var obj = new CommonRouter();
var resTemp = { ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: MOBILE_NUMBER_ALREADY_EXISTS}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: MOBILE_NUMBER_ALREADY_EXISTS
                });
              } else {
                User.findOne({ token }).then(data => {
                  console.log(data, "data111");

                  if (!data || data == null) {
                    //recording logs
var obj = new CommonRouter();
var resTemp = { ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                    res.status(200).json({
                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                      message: INVALID_REQUEST
                    });
                  } else {
                    if (
                      data["userType"] == UserTypes.PORTAL_USER &&
                      data["userRole"] == UserRoles.SUPER_ADMIN
                    ) {
                      console.log("admin");
                      var x = new CommonRouter();
                      x.updateDriverInfo(req).then(result => {
                         //recording logs
var obj = new CommonRouter();
var resTemp = result
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                        res.status(200).send(result);
                      });
                    } else if (
                      data["userType"] == UserTypes.PORTAL_USER &&
                      data["userRole"] == UserRoles.SCHOOL_USER
                    ) {
                      SchoolToUser.find({
                        school: schoolId,
                        user: driverId
                      }).then(r => {
                        var x = new CommonRouter();
                        console.log(r, "fff");
                        if (!r || r == null) {
                           //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: INVALID_REQUEST
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                          res.status(200).json({
                            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                            message: INVALID_REQUEST
                          });
                        } else {
                          x.updateDriverInfo(req).then(result => {
                             //recording logs
var obj = new CommonRouter();
var resTemp = result
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                            res.status(200).send(result);
                          });
                        }
                      });
                    } else if (
                      data["userType"] == UserTypes.DRIVER &&
                      data["userRole"] == UserRoles.APP_USER
                    ) {
                      console.log(driverId, "    ", data._id);
                      if (data._id.equals(driverId)) {
                        console.log("driver", data._id, driverId);
                        var x = new CommonRouter();
                        x.updateDriverInfo(req).then(result => {
                           //recording logs
var obj = new CommonRouter();
var resTemp = result
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                          res.status(200).send(result);
                        });
                      } else {
                         //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: INVALID_REQUEST
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                        res.status(200).json({
                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                          message: INVALID_REQUEST
                        });
                      }
                    } else {
                       //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: INVALID_REQUEST
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                      res.status(200).json({
                        ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                        message: INVALID_REQUEST
                      });
                    }
                  }
                });
              }
            }
          );
        }
      });
    } else {
       //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE,
  errorCode:ErrorCodes.INVALID_TOKEN,
  message: INVALID_REQUEST
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
      res
        .status(200)
        .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN ,message: INVALID_REQUEST });
    }
  } else {
 //recording logs
 var obj = new CommonRouter();
 var resTemp = {
   ...responseStatus.FAILURE,
   errorCode:ErrorCodes.INVALID_TOKEN,
   message: INVALID_REQUEST
 }
 obj.makeLogs(req, resTemp);
 obj = null;
 //recording logs end
       res
         .status(200)
         .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN ,message: INVALID_REQUEST });  }
  }

  public async updateDriverInfo(req) {
    const {
      token,
      driverId,
      isVerified,
      email,
      firstName,
      lastName,
      password,
      adiOrPdiBadgeNumber,
      drivingLicense,
      companions,
      mobileNumber,
      documents,
      countryCode,
      aboutme,
      schoolId
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
      gearType
    } = req.body.carInfo;

    var doc1 = "";
    var doc2 = "";
    var doc1Value = "";
    var doc2Value = "";
    var pf = "";
    let userDetails = await UserDetails.getUserDetails(token);
    let driverDetails = await UserDetails.getUserDetails(driverId);
    let tempCountryCode = driverDetails["countryCode"];

    

    if(countryCode != null || countryCode != "" || countryCode != undefined){
      tempCountryCode = countryCode
    }

    return new Promise((resolve, reject) => {
      User.findOne({ _id: driverId })
        .then(result => {
          if (result && result._id) {
            User.findOneAndUpdate(
              { _id: result._id },
              {
                firstName,
                lastName,
                password,
                adiOrPdiBadgeNumber,
                drivingLicense,
                companions,
                mobileNumber,
                countryCode:tempCountryCode,
                aboutme,
                updatedBy:userDetails._id,
                updatedDate:Date.now()
              }
            )
              .then(data => {
                console.log(1, data);
                doc1 = data["documents"][0];
                doc2 = data["documents"][1];

                pf = data["profilePictureUrl"];

                console.log(doc1, "pol", doc2);

                if (isVerified) {
                  Document.findOneAndUpdate(
                    { _id: doc1 },
                    { isVerified: 1, updatedBy:userDetails._id,
                      updatedDate:Date.now() }
                  ).then(data1 => {
                    doc1Value = data1["value"];
                  });
                  Document.findOneAndUpdate(
                    { _id: doc2 },
                    { isVerified: 1, updatedBy:userDetails._id,
                      updatedDate:Date.now() }
                  ).then(data2 => {
                    doc2Value = data2["value"];
                  });
                } else {
                  Document.findOne({ _id: doc1 }).then(data1 => {
                    doc1Value = data1["value"];
                  });
                  Document.findOne({ _id: doc2 }).then(data2 => {
                    doc2Value = data2["value"];
                  });
                }

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
                    updatedBy:userDetails._id,
                    updatedDate:Date.now()
                  }
                )
                  .then(() => {
                    console.log(2);
                    CarInfo.findOneAndUpdate(
                      { _id: carInfoId },
                      {
                        registrationNumber,
                        chassisNumber,
                        vehicleTypeId,
                        gearType,
                        updatedBy:userDetails._id,
                        updatedDate:Date.now()
                      }
                    )
                      .then(() => {
                        console.log(3, req.body.files.data.length);

                        if (req.body.files.data.length > 0) {
                          var x = new CommonRouter();
                          var d = new Date();
                          var fName = d.getTime() + "" + 0;

                          x.saveFilesToDisk(
                            fName,
                            req.body.files.data[0]["data"]
                          ).then(res => {
                            //commenet below once match identity start working
                            User.findOneAndUpdate(
                              { _id: driverId },
                              { profilePictureUrl: fName, updatedBy:userDetails._id,
                                updatedDate:Date.now() }
                            ).then(() => {});
                            //recording logs
                      var obj = new CommonRouter();
 var resTemp1 = {
   ...responseStatus.SUCCESS,
    message: INFORMATION_UPDATED_SUCCESS}
 
 obj.makeLogs(req, resTemp1);
 obj = null;
 //recording logs end
                            resolve({
                              ...responseStatus.SUCCESS,
                              message: INFORMATION_UPDATED_SUCCESS
                            });
                            //uncomment below once match identity start working
                            
                            // var x = new CommonRouter();
                            // x.matchIdentityNew(
                            //   fName,
                            //   doc1Value,
                            //   req.body.driverId,
                            //   doc1
                            // ).then(re => {
                            //   console.log("ppppppp>>" + fName);

                            //   User.findOneAndUpdate(
                            //     { _id: driverId },
                            //     { profilePictureUrl: fName }
                            //   ).then(() => {});
                            //   resolve({
                            //     ...responseStatus.SUCCESS,
                            //     message: INFORMATION_UPDATED_SUCCESS
                            //   });

                            //   if (re["data"] == 1) {
                            //     var x = new CommonRouter();
                            //     x.matchIdentityNew(
                            //       fName,
                            //       doc2Value,
                            //       req.body.driverId,
                            //       doc2
                            //     ).then(re => {
                            //       if (x["data"] == 1) {
                            //         User.findOneAndUpdate(
                            //           { _id: driverId },
                            //           { profilePictureUrl: fName }
                            //         ).then(() => {});
                            //         resolve({
                            //           ...responseStatus.SUCCESS,
                            //           message: INFORMATION_UPDATED_SUCCESS
                            //         });
                            //       } else {
                            //         var x1 = "uploads/" + fName;
                            //         fs.unlink(x1, err => {});
                            //         resolve({
                            //           ...responseStatus.SUCCESS,
                            //           message:
                            //             "Information updated, but profile pic cannot be changed due to it not matched with documents."
                            //         });
                            //       }
                            //     });
                            //   } else {
                            //     var x1 = "uploads/" + fName;
                            //     // var newx1 = x1.replace("web","uploads");
                            //     console.log(x1);
                            //     fs.unlink(x1, err => {
                            //       console.log(">>>>>err11", err);
                            //     });
                            //     resolve({
                            //       ...responseStatus.SUCCESS,
                            //       message:
                            //         "Information updated, but profile pic cannot be changed due to it not matched with documents."
                            //     });
                            //   }
                           // });
                          });
                        } else {
                          resolve({
                            ...responseStatus.SUCCESS,
                            message: "Information updated."
                          });
                        }
                      })
                      .catch(error => {
                        //res.status(500).json({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
                        
                        resolve({
                          ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                          message: UNKNOW_ERROR 
                        });
                      });
                  })
                  .catch(error => {
                    resolve({
                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                      message: UNKNOW_ERROR 
                    });
                  });
              })
              .catch(error => {
                resolve({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + "3" + error
                });
              });
          } else {
            resolve({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: INVALID_REQUEST });
          }
        })
        .catch(error => {
          resolve({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR + "4" });
        });
    });
  }

  public gearTypes(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    GearType.find()
      .then(result => {
        // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
        var finalResult = result;
        var finalData = [];
        var totalPages = Math.round(finalResult.length);
         //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.SUCCESS,
  message: finalResult
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
        res.status(200).json({ ...responseStatus.SUCCESS, data: finalResult });

        // if (finalResult.length > ti) {
        //   for (let i = p; i < ti; i++) {
        //     console.log("we", i);

        //     finalData.push(finalResult[i]);
        //   }
        //   res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages });

        // } else if (finalResult.length < ti && p < finalResult.length) {
        //   console.log("i m inside");
        //   for (let i = p; i < finalResult.length; i++) {
        //     finalData.push(finalResult[i]);
        //   }
        //   res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages });

        // } else {
        //   res.status(200).json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: NO_RECORDS_FOUND });
        // }
      })
      .catch(error => {
         //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: UNKNOW_ERROR
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
        res
          .status(500)
          .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
      });
  }

  // public searchInModule(req: Request, res: Response): void {
  //   const { token, page,module,term1,term2,term3,term4,keyword,condition } = req.body;
  //   let perPage = 10;
  //   let p = Number(page) * perPage;
  //   let ti = p + perPage;
  //   User.findOne({token:req.body.token,userType:UserTypes.PORTAL_USER,userRole:UserRoles.SUPER_ADMIN}).then(data=>{
  //     if(!data && data == null){
  //     res.status(200).json({...responseStatus.FAILURE,message:INVALID_REQUEST});
  //     }else{
  //       let mongoose = require('mongoose')

  //       const { db } = mongoose.connection;
  //       let keyword1 = new RegExp("^"+keyword,'i');

  //       var query = {};

  //       if(module == "users"){
  //         var tempCondition = "";
  //         if(condition == "SCHOOL"){
  //           tempCondition = "PORTAL_USER"
  //         } else{
  //           tempCondition = condition
  //         }
  //         query = {$or:[{[term1]: keyword1},{[term2]:keyword1},{[term3]:keyword1},{[term4]:keyword1},{userType:tempCondition}]};

  //         if(condition == "DRIVER"){
  //           tempCondition = "";
  //           console.log("i m con",condition);

  //           User.aggregate([

  //             {
  //             $lookup:
  //             {
  //               from: "schooltousers",
  //               localField: "_id",
  //               foreignField: "user",
  //               as: "SchoolToUser"
  //             }
  //           }, {
  //             $unwind: {
  //               path: "$SchoolToUser",
  //               preserveNullAndEmptyArrays: true
  //             }
  //           },
  //           {
  //             $lookup: {
  //               from: "schools",
  //               localField: "SchoolToUser.school",
  //               foreignField: "_id",
  //               as: "SchoolToUser.school"
  //             },
  //           }]).then((result) => {
  //             console.log("ddssqqqqqq")
  //             var finalResult = [];

  //             result.forEach(x=>{
  //               console.log(x.SchoolToUser);
  //               if(
  //                 x.firstName.match(keyword1) || x.email.match(keyword1) || x.mobileNumber.match(keyword1)

  //               ){
  //                 if(x.SchoolToUser["school"] != undefined && x.SchoolToUser["school"].length > 0){
  //                    if(x.SchoolToUser.school[0]["schoolName"].match(keyword1)){
  //                       finalResult.push(x);
  //                    }
  //                 } else {
  //                   finalResult.push(x);
  //                 }

  //               } else {
  //                 if(x.SchoolToUser.school != undefined && x.SchoolToUser.school.length > 0){
  //                   console.log("oplk");
  //                   if(x.SchoolToUser.school[0]["schoolName"].match(keyword1)){
  //                      finalResult.push(x);
  //                   }
  //                }
  //               }
  //             })

  //         var finalData = [];
  //         if(module == "users"){
  //         var totalPages = Math.round(finalResult.length);

  //         if (finalResult.length >= ti) {
  //           for (let i = p; i < ti; i++) {
  //             console.log("we22", i);

  //             if(tempCondition == "PORTAL_USER"){
  //               if(finalResult[i].userRole == "SCHOOL_USER"){
  //                 finalData.push(finalResult[i]);

  //               }
  //             } else {
  //               finalData.push(finalResult[i]);

  //             }

  //           }
  //           res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages,currentCount:finalData.length });
  //           return;
  //         } else if (finalResult.length < ti && p < finalResult.length) {
  //           console.log("i m inside111");
  //           for (let i = p; i < finalResult.length; i++) {
  //             if(tempCondition == "PORTAL_USER"){
  //               if(finalResult[i].userRole == "SCHOOL_USER"){
  //                 finalData.push(finalResult[i]);

  //               }
  //             } else {
  //               finalData.push(finalResult[i]);

  //             }

  //           }

  //           res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages });
  //           return;

  //         }
  //       }
  //     });

  //   }
  //       }else {
  //         query = {$or:[{[term1]: keyword1},{[term2]:keyword1},{[term3]:keyword1},{[term4]:keyword1}]}
  //       }
  //       if(condition != "DRIVER"){
  //       console.log(query);
  //       db.collection(module).find(query).toArray(function(err, result) {
  //         if (err) throw err;
  //         var finalResult = result
  //         var finalData = [];
  //         if(module == "users"){
  //         var totalPages = Math.round(finalResult.length);
  //         if (finalResult.length > ti) {
  //           for (let i = p; i < ti; i++) {
  //             console.log("we", i);

  //             if(tempCondition == "PORTAL_USER"){
  //               if(finalResult[i].userRole == "SCHOOL_USER"){
  //                 finalData.push(finalResult[i]);

  //               }
  //             } else {
  //               finalData.push(finalResult[i]);

  //             }

  //           }
  //           res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages,currentCount:finalData.length });

  //         } else if (finalResult.length < ti && p < finalResult.length) {
  //           console.log("i m inside");
  //           for (let i = p; i < finalResult.length; i++) {
  //             if(tempCondition == "PORTAL_USER"){
  //               if(finalResult[i].userRole == "SCHOOL_USER"){
  //                 finalData.push(finalResult[i]);

  //               }
  //             } else {
  //               finalData.push(finalResult[i]);

  //             }

  //           }

  //           res.status(200).json({ ...responseStatus.SUCCESS, data: finalData, totalPages: totalPages });

  //         } else {
  //           res.status(200).json({ ...responseStatus.FAILURE, message: NO_RECORDS_FOUND });
  //         }

  //       });

  //     }
  //   }
  //   });

  // }

  //New sign up
  public matchIdentityNew(src, dest, id, docId) {
    return new Promise((resolve, reject) => {
      // resolve({
      //         ...responseStatus.SUCCESS,
      //         data: {"status":1},
      //         docId: docId
      //       });

      Utils.faceMatch(
        BaseURL.PUBLIC_RESOURCE_URL + src,
        BaseURL.PUBLIC_RESOURCE_URL + dest
      )
        .then(resl => {
          var str = BaseURL.PUBLIC_RESOURCE_URL + src;
          str += BaseURL.PUBLIC_RESOURCE_URL + dest;

          var message =
            "\n from resource match 1111 upload " +
            new Date().toISOString() +
            " : " +
            "UserId: " +
            id +
            "\n" +
            JSON.stringify(resl) +
            "\n";

          var logStream = fs.createWriteStream("logs/info.txt", { flags: "a" });
          // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
          logStream.write(message + " >>>>" + str);
          logStream.end("this is the end line \n");
          resolve({
            ...responseStatus.SUCCESS,
            data: resl["status"],
            docId: docId
          });
        })
        .catch(err => {
          reject({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, err });
        });
    });
  }

  public async resourceUploadNew(file: any, userID: any,token=null) {
    let userDetails = await UserDetails.getUserDetails(token);
    return new Promise((resolve, reject) => {
      var documentsData = [];
      const files = file;
      const userId = userID;
      let d = new Date();
      var isprofilePiceUploaded = false;
      var pfName = "";
      //console.log("{{}}",files);
      DocumentType.find().then(result => {
        result.forEach((docTypeData, index) => {
          files.data.forEach(x => {
            if (x.documentType == docTypeData["name"]) {
              var obj = {
                documentType: docTypeData._id,
                resourceType: x.resourceType,
                value: d.getTime() + "" + index,
                fileType: x.fileType,
                createdBy: userDetails == null ? null : userDetails._id 
              };
              documentsData.push(obj);
              var classObj = new CommonRouter();
              classObj.saveFilesToDisk(obj.value, x.data).then(() => {});
            } else if (x.documentType == "" && !isprofilePiceUploaded) {
              var obj1 = {
                data: x.data,
                typeID: "",
                resourceType: x.resourceType,
                fName: d.getTime() + "" + index,
                fileType: x.fileType
              };
              var classObj = new CommonRouter();
              classObj
                .saveFilesToDisk(obj1.fName, x.data["data"])
                .then(() => {});
              pfName = obj1.fName;
              isprofilePiceUploaded = true;
              User.findOneAndUpdate(
                { _id: userId },
                { profilePictureUrl: obj1.fName, updatedBy:userDetails == null ? null : userDetails._id ,
                  updatedDate:Date.now() }
              ).then(data => {});
            }
          });
        });
        var count = 1;

        Document.insertMany(documentsData).then(data => {
          var docIDs = [];
          data.forEach(x => {
            docIDs.push(x._id);
            var classObj = new CommonRouter();
            classObj
              .matchIdentityNew(pfName, x["value"], userId, x["_id"])
              .then(res => {
                count++;
                if (res["data"] == 1) {
                  Document.findOneAndUpdate(
                    { _id: res["docId"] },
                    { isVerified: 1, updatedBy:userDetails == null ? null : userDetails._id ,
                      updatedDate:Date.now() }
                  ).then(dadtta => {
                    if (count > 1) {
                      //res.status(200).json({ ...responseStatus.SUCCESS, message: "Your document verification has completed" });
                      resolve({ ...responseStatus.SUCCESS });
                    }
                  });
                } else {
                  Document.findOneAndUpdate(
                    { _id: res["docId"] },
                    { isVerified: 1, updatedBy:userDetails == null ? null : userDetails._id ,
                      updatedDate:Date.now() }
                  ).then(dadtta => {
                    if (count > 1) {
                      //uncomment once you change isVerified from 1 to 0 in else update section, once face api start running
                      //resolve({...responseStatus.FAILURE});
                      //comment below once you set isVerified 0 from 1
                      resolve({ ...responseStatus.SUCCESS });
                    }
                  });
                }
              })
              .catch(() => {
                resolve({ ...responseStatus.FAILURE });
              });
          });
          User.findOneAndUpdate({ _id: userId }, { documents: docIDs, updatedBy:userDetails == null ? null : userDetails._id ,
            updatedDate:Date.now() }).then(
            data => {
              //resolve({...responseStatus.SUCCESS});
            }
          );
        });
      });
    });
  }

  public async createDriverNew(req: Request, res: Response) {
    //console.log(req.body.files);
    
    const {
      firstName,
      lastName,
      email,
      password,
      countryCode,
      adiOrPdiBadgeNumber,
      userType,
      userRole,
      drivingLicense,
      companions,
      mobileNumber,
      schoolId
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
      gearType
    } = req.body.carInfo;
    const { files } = req.body.files;
    const self = this;

    const token = Md5.init(req.body.email);
    //console.log(token);

    let tempEmail = new RegExp(req.body.email, "i");
    let userDetails = await UserDetails.getUserDetails(req.body.token == undefined ? null : req.body.token);


    console.log(userDetails, "tempEmail");

    User.findOne({ email: tempEmail })
      .then(result => {
        console.log(result);
        if (result) {
           //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: EMAIL_ALREADY_EXISTS
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
          res
            .status(200)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: EMAIL_ALREADY_EXISTS });
          console.log("dd");
        } else {
          User.findOne({ mobileNumber, countryCode }).then(re => {
            if (re && re._id) {
               //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: MOBILE_NUMBER_ALREADY_EXISTS
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
              res.status(200).json({
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: MOBILE_NUMBER_ALREADY_EXISTS
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
                addressOf: AddressOf.APP_DRIVER,
                createdBy: userDetails == null ? null : userDetails._id 
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
                countryCode,
                addresses: [address._id],
                companions,
                //documents: documents,
                token: token,
                createdBy: userDetails == null ? null : userDetails._id 
              });

              console.log("i m new user",user);

              address.save();
              user
                .save()
                .then(resp => {
                  const carInfo = new CarInfo({
                    registrationNumber,
                    chassisNumber,
                    vehicleTypeId,
                    color,
                    gearType,
                    userId: user._id,
                    createdBy: userDetails == null ? null : userDetails._id 
                  });
                  carInfo.save();
                  let lastInsertId = { driverId: user._id };
                //adding driver to school
                  if( (schoolId != undefined) && schoolId != "" || schoolId != null){
                    const schoolToUser = new SchoolToUser({
                      school: schoolId,
                      user: user._id,
                      createdBy: userDetails == null ? null : userDetails._id 
                    });

                    schoolToUser.save()
                    .then(data=>{
             
                    })
                  
                  }
                  //adding driver to school ends

                  var x = new CommonRouter();
                 let  tempToken = req.body.token==undefined ? null: req.body.token;
                  x.resourceUploadNew(req.body.files, user._id,tempToken).then(p => {
                    console.log(p,'pp')
                    if (p["status"] != 0) {
                      var message = "";
                      if(schoolId){


                        School.find({_id:schoolId}) .then(schoolData =>{

                          var locals = {
                            name: req.body.firstName + " " + req.body.lastName,
                            email: req.body.email,
                            subject:"Driver Registration..!"
                          };

                          Utils.emailSend(locals)                          })

                        message = DRIVER_CREATED_ADDED_TO_SCHOOL
                      } else {

                        var locals = {
                          name: req.body.firstName + " " + req.body.lastName,
                          email: req.body.email,
                          subject:"Driver Registration..!"
                        };
                        Utils.emailSend(locals)

                        message = DRIVER_CREATED_SUCCESS
                      }
                       //recording logs
                var obj = new CommonRouter();
                var resTemp = {
              ...responseStatus.SUCCESS,
                        message: message,
                        data: lastInsertId
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                      res.status(200).json({
                        ...responseStatus.SUCCESS,
                        message: message,
                        data: lastInsertId
                      });
                    } else {
                      if(schoolId){
                        message = DRIVER_CREATED_ADDED_TO_SCHOOL
                      } else {
                        message = DRIVER_CREATED_SUCCESS
                      }
                      //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.SUCCESS,
  message:
    message +
    " But documents did not match",
  data: lastInsertId
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                      res.status(200).json({
                        ...responseStatus.SUCCESS,
                        message:
                          message +
                          " But documents did not match",
                        data: lastInsertId
                      });
                    }
                  });
                })
                .catch(error => {
                  //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: UNKNOW_ERROR + error["message"]
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
                  console.log("er-1", error);
                  res.status(500).json({
                    ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                    message: UNKNOW_ERROR 
                  });
                });
              
            }
          });
        }
      })
      .catch(error => {
        console.log("er-3");
         //recording logs
var obj = new CommonRouter();
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: UNKNOW_ERROR + error["message"]
}
obj.makeLogs(req, resTemp);
obj = null;
//recording logs end
        res
          .status(500)
          .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
      });
  }

  

  // set up our routes
  public routes() {
    this.router.post(
      "/driverCreateNew",
      force_upload.array(),
      this.createDriverNew
    );

    this.router.post("/pushInfo", this.pushInfo);
    this.router.post("/gearTypes", this.gearTypes);
    this.router.post("/vehicleTypes", this.vehicleTypes);
    this.router.post("/countries", this.countries);
    this.router.post("/states", this.states);
    this.router.post("/cities", this.cities);
    this.router.post("/attributes", this.attributes);
    this.router.post("/resource", force_upload.array(), this.resource);
    this.router.post(
      "/resourceUpload",
      force_upload.array(),
      this.resourceUpload
    );

    this.router.post("/slots", this.slots);


    this.router.post("/verifyFaceIdentity", this.verifyFaceIdentity);

    this.router.post("/addDummyInvoice", this.addDummyInvoice);
    this.router.post("/driverUpdate", this.driverUpdate);
    this.router.post("/companions", this.companions);
    this.router.post("/paymentStatus", this.paymentStatus);

    //this.router.post('/searchInModule', this.searchInModule);
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

    var fileName = "CommonRouter" + d + "-" + (m + 1) + "-" + y + ".txt";

    var logStream = fs.createWriteStream("logs/" + fileName, { flags: "a" });
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write(message + "\n");
    logStream.end("this is the end line \n");
  }

}

const commonRouter = new CommonRouter();
commonRouter.routes();

export default commonRouter.router;
