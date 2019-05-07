import { Request, Response, Router } from "express";
import { MASTER_DATA_ADDED_SUCCESS_MESSAGE } from "../constants/Messages";
import VehicleType from "../masters/VehicleType";
import Curriculum from "../masters/Curriculum";
import TestCenter from "../masters/TestCenter";
import Address from "../models/Address";
import Package from "../masters/Package";
import DocumentType from "../masters/DocumentType";
import Slot from "../masters/Slot";
import City from "../models/City";
import State from "../models/State";
import Country from "../models/Country";
import Attribute from "../masters/Attribute";
import { responseStatus } from "./../constants/responseStatus";
import * as fs from "fs";
import {ErrorCodes} from "./../constants/ErrorCodes";
import UserDetails from "./UserDetails";

import {
  INVALID_REQUEST,
  DUTY_ON_MESSAGE,
  DUTY_OFF_MESSAGE,
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
import User from "../models/User";
import { UserTypes } from "../constants/UserTypes";
import { UserRoles } from "../constants/UserRoles";
import Tax from "../masters/Tax";
import GearType from "../masters/GearType";
import RideRate from "../masters/RideRate";

import { DefaultBillingRate } from "../constants/DefaultBillingRate";
import { runInNewContext } from "vm";
import School from "../models/School";

export class MasterRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  public async addTestCenter(req: Request, res: Response): void {
    const {
      testCenterName,
      testType,
      description,
      contactNumber,
      timing,
      email,
      token
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
    } = req.body.address;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
      if (!checkTokenResult) {
        //logging starts
        var resTemp = {
          ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST
        };
        obj.makeLogs(req, resTemp);
        obj = null;
        //logging ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
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
            createdBy:userDetails._id
          });

          const testCenter = new TestCenter({
            testType,
            name: testCenterName,
            description,
            addressId: address._id,
            contactNumber,
            timing,
            email,
            createdBy:userDetails._id

          });

          address
            .save()
            .then(data => {
              if (data && data._id) {
                testCenter
                  .save()
                  .then(data => {
                    const status = res.statusCode;
                    var obj = new MasterRouter();
                    //logging starts
                    var resTemp = {
                      status,
                      message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //logging ends

                    res.status(200).json({
                      status,
                      message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                    });
                  })
                  .catch(error => {
                    //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
                    const status = res.statusCode;
                    res.status(500).json({ status, error });
                  });
              }
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async addVehicleType(req: Request, res: Response): void {
    const { name, token, description } = req.body;
    let userDetails = await UserDetails.getUserDetails(token);
    const vehicleType = new VehicleType({
      name,
      description,
      createdBy:userDetails._id

    });
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          vehicleType
            .save()
            .then(data => {
              const status = res.statusCode;
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async updateVehicleType(req: Request, res: Response): void {
    const { name, vehicleId, isArchived, token, description } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
      if (!checkTokenResult) {
       //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          VehicleType.findOneAndUpdate(
            { _id: vehicleId },
            {
              name,
              isArchived,
              description,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
    
  }

  public async vehicleTypeById(req: Request, res: Response): void {
    const { vehicleId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          VehicleType.findOne({ _id: vehicleId })
            .then(data => {
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
   }

  public async addCurriculum(req: Request, res: Response): void {
    const { name, description, token } = req.body;
    let userDetails = await UserDetails.getUserDetails(token);
    const curriculum = new Curriculum({
      name,
      description,
      createdBy:userDetails._id
    });
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          curriculum
            .save()
            .then(data => {
              const status = res.statusCode;
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }
  public async updateCurriculum(req: Request, res: Response): void {
    const { name, description, curriculumId, isArchived, token } = req.body;
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Curriculum.findOneAndUpdate(
            { _id: curriculumId },
            {
              name,
              description,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async curriculumById(req: Request, res: Response): void {
    const { curriculumId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends

          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Curriculum.findOne({ _id: curriculumId })
            .then(data => {
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async addDocumentType(req: Request, res: Response): void {
    const { name, description, token } = req.body;
    let userDetails = await UserDetails.getUserDetails(token);

    const documentType = new DocumentType({
      name,
      description,
      createdBy:userDetails._id
    });
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          documentType
            .save()
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async updateDocumentType(req: Request, res: Response): void {
    const { name, description, token, documentId, isArchived } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends

          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          DocumentType.findOneAndUpdate(
            { _id: documentId },
            {
              name,
              description,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
     
    
  }

  public async documentTypeById(req: Request, res: Response): void {
    const { documentId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          DocumentType.findOne({ _id: documentId })
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
     
  }

  public async addPackage(req: Request, res: Response): void {
    const {
      token,
      name,
      description,
      numberOfLesson,
      numberOfDay,
      price,
      taxId
    } = req.body;
    console.log(req.body,'kk')
    let userDetails = await UserDetails.getUserDetails(token);

    const pkg = new Package({
      name,
      description,
      numberOfLesson,
      numberOfDay,
      price,
      taxId,
      createdBy:userDetails._id
    });

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          pkg
            .save()
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
     
  }
  public async updatePackage(req: Request, res: Response): void {
    const {
      name,
      description,
      token,
      numberOfLesson,
      numberOfDay,
      price,
      taxId,
      packageId,
      isArchived
    } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs 
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Package.findOneAndUpdate(
            { _id: packageId },
            {
              name,
              description,
              numberOfLesson,
              numberOfDay,
              price,
              taxId,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
     
  }
  public async packageById(req: Request, res: Response): void {
    const { packageId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs 
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {


                
          Package.findOne({ _id: packageId })
        .populate('taxId')
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async addSlot(req: Request, res: Response): void {
    const { name, description, token, fromTime, toTime } = req.body;
    let userDetails = await UserDetails.getUserDetails(token);

    const slot = new Slot({
      name,
      description,
      fromTime,
      toTime,
      createdBy:userDetails._id
    });
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          slot
            .save()
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async updateSlot(req: Request, res: Response): void {
    const {
      name,
      description,
      token,
      fromTime,
      toTime,
      slotId,
      isArchived
    } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Slot.findOneAndUpdate(
            { _id: slotId },
            {
              name,
              description,
              fromTime,
              toTime,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }
  public async slotById(req: Request, res: Response): void {
    const { slotId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Slot.findOne({ _id: slotId })
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async addCountries(req: Request, res: Response): void {
    const { name, description, token, value, countryCode } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    let lastCountryValue = await Country.find().limit(1).sort({$natural:-1}).then((data)=>{
      if(data || data.length > 0){
        return parseInt(data[0]["value"]) + 1;
      } else {
        return 1;
      }
    })


      if (!checkTokenResult) {
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          const country = new Country({
            name,
            description,
            countryCode,
            createdBy:userDetails._id
          });
          var tempName = new RegExp(name,"i");
          Country.find({name: tempName }).then(re => {
            if (re.length > 0) {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: "Record Exsits"
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: "Record Exsits" });
            } else {
              country
                .save()
                .then(data => {
                  Country.updateOne({_id:data._id},{value:lastCountryValue}).then(()=>{});
                  const status = res.statusCode;
                  //recording logs
                  var obj = new MasterRouter();
                  var resTemp = {
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs ends
                  res.status(200).json({
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  });
                })
                .catch(error => {
                  //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
                  const status = res.statusCode;
                  res.status(500).json({ status, error });
                });
            }
          });
        }
      
  }

  public async updateCountries(req: Request, res: Response): void {
    const {
      name,
      description,
      token,
      countryCode,
      countryId,
      isArchived
    } = req.body;
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          var tempName = new RegExp(name,"i");
          var x = await Country.find({name:tempName,_id:{$ne:countryId}}).then((data)=>{return data});
          if(x.length <= 0 || x == []){
          Country.findOneAndUpdate(
            { _id: countryId },
            {
              name,
              description,
              //value,
              countryCode,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;

              var stateValue = [];

              State.find({ parent: data["value"] }).then(rs => {
                rs.forEach(i => {
                  //stateValue.push(i.value.toString());

                  State.findOneAndUpdate(
                    { _id: i._id },
                    {
                      isArchived,
                      updatedBy:userDetails._id,
                      updatedDate:Date.now()
                    }
                  )
                    .then(pl => {})
                    .catch(p => {
                      console.log(p, "error");
                    });

                  City.find({ parent: i["value"] }).then(tempRe => {
                    tempRe.forEach(y => {
                      City.findOneAndUpdate({ _id: y._id }, { isArchived,updatedBy:userDetails._id,updatedDate:Date.now() })
                        .then(plCity => {
                          console.log(plCity, "fffggh");
                        })
                        .catch();
                    });
                  });
                });
                //recording logs
                var obj = new MasterRouter();
                var resTemp = {
                  status,
                  message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
                res
                  .status(200)
                  .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
              });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        } else {
//recording logs
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,

  message: "Record Exsits"
};
obj.makeLogs(req, resTemp);
obj = null;
//recording logs ends
res
  .status(200)
  .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: "Record Exsits" });
        }

      } 
    
  }
  public async countriesById(req: Request, res: Response): void {
    const { countryId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs  
        var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Country.findOne({ _id: countryId })
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
     
  }

  public async addStates(req: Request, res: Response): void {
    const { name, description, token, value, isArchived, parent } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    let lastStateValue = await State.find().limit(1).sort({$natural:-1}).then((data)=>{
      if(data || data.length > 0){
        return parseInt(data[0]["value"]) + 1;
      } else {
        return 1;
      }
    })

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          const state = new State({
            name,
            description,
            isArchived,
            parent,
            createdBy:userDetails._id
          });
          let tempName = new RegExp(name,"i");
          State.find({ name: tempName,parent:{$eq:parent} }).then(re => {
            if (re.length > 0) {
              res
                .status(200)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: "Record exsits" });
            } else {
              state
                .save()
                .then(data => {
                  State.updateOne({_id:data._id},{value:lastStateValue}).then(()=>{});
                  const status = res.statusCode;
                  //recording logs
                  var obj = new MasterRouter();
                  var resTemp = {
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs ends
                  res.status(200).json({
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  });
                })
                .catch(error => {
                  //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
                  const status = res.statusCode;
                  res.status(500).json({ status, error });
                });
            }
          });
        }
      
  }
  public async updateStates(req: Request, res: Response): void {
    const {
      name,
      description,
      token,
      parent,
      stateId,
      isArchived
    } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    let tempName = new RegExp(name,"i");

    let xState = await State.find({name:tempName,_id:{$ne:stateId},parent:{$eq:parent}}).then((data)=>{return data;});
    console.log(xState)

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends 
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Country.findOne({ value: parent }).then(x => {
            if (x["isArchived"] == true && !isArchived) {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: "Please enable country first"
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: "Please enable country first"
              });
            } else {
              if(xState == null || xState == [] || xState.length <= 0){
              State.findOneAndUpdate(
                { _id: stateId },
                {
                  name,
                  description,
                  // value,
                  parent,
                  updatedBy:userDetails._id,
                  updatedDate:Date.now(),
                  isArchived
                }
              )
                .then(data => {
                  const status = res.statusCode;
                  City.find({ parent: data["value"] }).then(tempRe => {
                    tempRe.forEach(y => {
                      City.findOneAndUpdate({ _id: y._id }, { isArchived,updatedBy:userDetails._id,updatedDate:Date.now() })
                        .then(plCity => {
                          console.log(plCity, "fffggh");
                        })
                        .catch();
                    });
                  });
                  //recording logs
                  var obj = new MasterRouter();
                  var resTemp = {
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs ends
                  res.status(200).json({
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  });
                })
                .catch(error => {
                  //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
                  const status = res.statusCode;
                  res.status(500).json({ status, error });
                });
            }
           else {
//recording logs
var resTemp11 = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: "Record Exsits"
};
var obj = new MasterRouter();

obj.makeLogs(req, resTemp11);
obj = null;
//recording logs ends
res
  .status(200)
  .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: "Record Exsits" });
        }

          }
          });
        }
      
  }
  public async stateById(req: Request, res: Response): void {
    const { stateId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          State.findOne({ _id: stateId })
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async addCities(req: Request, res: Response): void {
    const { name, description, token, value, isArchived, parent } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);
    let lastCityValue = await State.find().limit(1).sort({$natural:-1}).then((data)=>{
      if(data || data.length > 0){
        return parseInt(data[0]["value"]) + 1;
      } else {
        return 1;
      }
    })

      if (!checkTokenResult) {
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          const city = new City({
            name,
            description,
            isArchived,
            parent,
            createdBy:userDetails._id
          });
          let tempName = new RegExp(name,"i");
          City.find({ name: tempName }).then(re => {
            if (re.length > 0) {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: "Record Exsits"
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: "Record Exsits" });
            } else {
              city
                .save()
                .then(data => {
                  City.updateOne({_id:data._id},{value:lastCityValue}).then(()=>{});
                  const status = res.statusCode;
                  //recording logs
                  var obj = new MasterRouter();
                  var resTemp = {
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs ends
                  res.status(200).json({
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  });
                })
                .catch(error => {
                  //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
                  const status = res.statusCode;
                  res.status(500).json({ status, error });
                });
            }
          });
        }
      
  }

  public async updateCities(req: Request, res: Response): void {
    const {
      name,
      description,
      token,
      value,
      parent,
      cityId,
      isArchived
    } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          let tempName = new RegExp(name,"i");
          var x = await City.find({_id:{$ne:cityId},name:tempName,parent:{$eq:parent}}).then((data)=>{return data});
          if(!x || x.length <= 0){
          State.findOne({ value: parent }).then(x => {
            if (x["isArchived"] == true && !isArchived) {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: "Please enable state first"
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: "Please enable state first"
              });
            } else {
              City.findOneAndUpdate(
                { _id: cityId },
                {
                  name,
                  description,
                  //value,
                  parent,
                  isArchived,
                  updatedBy:userDetails._id,
                  updatedDate:Date.now()
                }
              )
                .then(data => {
                  const status = res.statusCode;
                  //recording logs
                  var obj = new MasterRouter();
                  var resTemp = {
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs ends

                  res.status(200).json({
                    status,
                    message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
                  });
                })
                .catch(error => {
                  //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
                  const status = res.statusCode;
                  res.status(500).json({ status, error });
                });
            }
          });
        } else {
          //recording logs
var resTemp = {
  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
  message: "Record Exsits"
};
obj.makeLogs(req, resTemp);
obj = null;
//recording logs ends
res
  .status(200)
  .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: "Record Exsits" });
        }
      }
      
  }

  public async cityById(req: Request, res: Response): void {
    const { cityId, token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          City.findOne({ _id: cityId })
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async addAttribute(req: Request, res: Response): void {
    const { name, description } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          const attribute = new Attribute({
            name,
            description,
            createdBy:userDetails._id
          });

          attribute
            .save()
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
     
  }

  public async testCenterList(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          TestCenter.find()
            .populate({
              path: "addressId",
              model: "Address"
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else {
                //recording logs
                var obj = new MasterRouter();
                var resTemp1 = {
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                };
                obj.makeLogs(req, resTemp1);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                });
              }
            });
        }
     
  }

  public async testCenterById(req: Request, res: Response): void {
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          TestCenter.find({ _id: req.body.testCenterId })
            .populate({
              path: "addressId",
              model: "Address"
            })
            .then(result => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: result };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: result });
            });
        }
      
  }
  public async updateTestCenter(req: Request, res: Response): void {
    const { token } = req.body;
    const {
      testCenterId,
      testCenterName,
      testType,
      description,
      contactNumber,
      timing,
      email,
      isArchived
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
      long,
      addressOf
    } = req.body.address;
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
               var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Address.findOneAndUpdate(
            { _id: addressId },
            {
              name,
              addressLineOne,
              city,
              state,
              pincode,
              country,
              lat,
              long,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          ).then(result => {
            TestCenter.findOneAndUpdate(
              { _id: testCenterId },
              {
                name: testCenterName,
                testType,
                description,
                contactNumber,
                timing,
                email,
                isArchived,
                updatedBy:userDetails._id,
                updatedDate:Date.now()
              }
            )
              .then(data1 => {
                console.log(data1);
                if (!data1 || data1 == null) {
                  var resTemp1 = {
                    ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                    message: INVALID_REQUEST
                  };
                  var obj = new MasterRouter();
                  obj.makeLogs(req, resTemp1);
                  obj = null;
                  res.status(200).json({
                    ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                    message: INVALID_REQUEST
                  });
                } else {
                  //recording logs
                  var obj = new MasterRouter();
                  var resTemp = {
                    ...responseStatus.SUCCESS,
                    message: "Test Center Updated Successfully"
                  };
                  obj.makeLogs(req, resTemp);
                  obj = null;
                  //recording logs ends
                  res.status(200).json({
                    ...responseStatus.SUCCESS,
                    message: "Test Center Updated Successfully"
                  });
                }
              })
              .catch(error => {
                var resTemp1 = {
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: UNKNOW_ERROR + error["message"]
                };
                var obj = new MasterRouter();
                obj.makeLogs(req, resTemp1);
                obj = null;
                res
                  .status(500)
                  .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
              });
          });
        }
      
  }

  public async updateAttribute(req: Request, res: Response): void {
    const { token } = req.body;
    const { attributeId, name, description, isArchived } = req.body;
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

    console.log(checkTokenResult);

      if (!checkTokenResult) {
        //recording logs
         var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Attribute.findOneAndUpdate(
            { _id: attributeId },
            {
              name,
              description,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              console.log(data);
              if (!data || data == null) {
                var resTemp1 = {
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: INVALID_REQUEST
                };
                var obj = new MasterRouter();
                obj.makeLogs(req, resTemp1);
                obj = null;
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: INVALID_REQUEST
                });
              } else {
                //recording logs
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  message: "Attribute Updated Successfully"
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  message: "Attribute Updated Successfully"
                });
              }
            })
            .catch(error => {
              var resTemp1 = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              };
              var obj = new MasterRouter();
              obj.makeLogs(req, resTemp1);
              obj = null;
              res
                .status(500)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
            });
        }
     
  }

  public async attributeList(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;
    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
             var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Attribute.find().then(result => {
            //  res.status(200).json({ ...responseStatus.SUCCESS, data: result });
            var finalResult = result;
            var finalData = [];
            var totalPages = Math.round(finalResult.length);
            if (finalResult.length > ti) {
              for (let i = p; i < ti; i++) {
                console.log("we", i);

                finalData.push(finalResult[i]);
              }
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                data: finalData,
                totalPages: totalPages
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
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
              var obj = new MasterRouter();
              var resTemp = {
                ...responseStatus.SUCCESS,
                data: finalData,
                totalPages: totalPages
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({
                ...responseStatus.SUCCESS,
                data: finalData,
                totalPages: totalPages
              });
            } else {
              //recording logs
              var obj = new MasterRouter();
              var resTemp1 = {
                ...responseStatus.FAILURE,
                errorCode:ErrorCodes.INVALID_REQUEST,
                message: NO_RECORDS_FOUND
              };
              obj.makeLogs(req, resTemp1);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: NO_RECORDS_FOUND });
            }
          });
        }
     
  }

  public async attributeById(req: Request, res: Response): void {
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Attribute.find({ _id: req.body.attributeId }).then(result => {
            //recording logs
            var obj = new MasterRouter();
            var resTemp1 = { ...responseStatus.SUCCESS, data: result };
            obj.makeLogs(req, resTemp1);
            obj = null;
            //recording logs ends
            res.status(200).json({ ...responseStatus.SUCCESS, data: result });
          });
        }
      
  }

  public async documentTypes(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
        var resTemp1 = {
          ...responseStatus.FAILURE,
          errorCode:ErrorCodes.INVALID_TOKEN,
          message: INVALID_REQUEST
        };
        obj.makeLogs(req, resTemp1);
        obj = null;
        //recording logs ends  
        res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
          
        } else {
          DocumentType.find()
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else {
                var resTemp1 = {
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                };
                var obj = new MasterRouter();
                obj.makeLogs(req, resTemp1);
                obj = null;
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                });
              }
            })
            .catch(error => {
              var resTemp1 = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              };
              var obj = new MasterRouter();
              obj.makeLogs(req, resTemp1);
              obj = null;
              res
                .status(500)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
            });
        }
    
  }
  public async packages(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Package.find()
          .populate('taxId')
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else {
                var resTemp1 = {
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                };
                var obj = new MasterRouter();
                obj.makeLogs(req, resTemp1);
                obj = null;
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                });
              }
            })
            .catch(error => {
              var resTemp1 = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              };
              var obj = new MasterRouter();
              obj.makeLogs(req, resTemp1);
              obj = null;
              res
                .status(500)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
            });
        }
     
  }
  public async slots(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Slot.find()
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else {
                //recording logs 
                var resTemp1 = {
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                };
                var obj = new MasterRouter();
                obj.makeLogs(req, resTemp1);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                });
              }
            })
            .catch(error => {
              var resTemp1 = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              };
              var obj = new MasterRouter();
              obj.makeLogs(req, resTemp1);
              obj = null;
              res
                .status(500)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
            });
        }
      
  }
  public async taxes(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Tax.find()
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                //recording logs ends
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else {
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                });
              }
              // res.status(200).json({ ...responseStatus.SUCCESS, data: result });
            })
            .catch(error => {

              var resTemp1 = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["messsage"]
              };
              var obj = new MasterRouter();
              obj.makeLogs(req, resTemp1);
              obj = null;
              res
                .status(500)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
            });
        }
      
  }

  public async addTax(req: Request, res: Response): void {
    const { countryCode, description, taxFor, taxPercentage } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          const tax = new Tax({
            countryCode,
            description,
            taxFor,
            taxPercentage,
            createdBy:userDetails._id
          });

          tax
            .save()
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async updateTax(req: Request, res: Response): void {
    const {
      taxId,
      countryCode,
      description,
      taxFor,
      taxPercentage,
      isArchived
    } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Tax.findOneAndUpdate(
            { _id: taxId },
            {
              countryCode,
              description,
              taxFor,
              taxPercentage,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }
  public async taxById(req: Request, res: Response): void {
    const { taxId } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          Tax.findOne({ _id: taxId })
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async gearTypes(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          GearType.find()
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
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
                var obj = new MasterRouter();
                var resTemp = {
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                };
                obj.makeLogs(req, resTemp);
                obj = null;
                res.status(200).json({
                  ...responseStatus.SUCCESS,
                  data: finalData,
                  totalPages: totalPages
                });
              } else {
                var resTemp1 = {
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                };
                var obj = new MasterRouter();
                obj.makeLogs(req, resTemp1);
                obj = null;
                res.status(200).json({
                  ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                  message: NO_RECORDS_FOUND
                });
              }
            })
            .catch(error => {
              console.log(error);
              var resTemp1 = {
                ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                message: UNKNOW_ERROR + error["message"]
              };
              var obj = new MasterRouter();
              obj.makeLogs(req, resTemp1);
              obj = null;
              res
                .status(500)
                .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
            });
        }
     
  }

  public async addGearType(req: Request, res: Response): void {
    const { name } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          const gear = new GearType({
            name,
            createdBy:userDetails._id
          });

          gear
            .save()
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }
  public async updateGearType(req: Request, res: Response): void {
    const { gearId, name, isArchived } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          GearType.findOneAndUpdate(
            { _id: gearId },
            {
              name,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
     
  }
  public async gearTypeById(req: Request, res: Response): void {
    const { gearId } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          GearType.findOne({ _id: gearId })
            .then(data => {
              //recording logs
              var obj = new MasterRouter();
              var resTemp = { ...responseStatus.SUCCESS, data: data };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res.status(200).json({ ...responseStatus.SUCCESS, data: data });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async rideRates(req: Request, res: Response): void {
    const { token, page } = req.body;
    let perPage = 10;
    let p = Number(page) * perPage;
    let ti = p + perPage;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          RideRate.find({ isGeneric: { $eq: "true" } }).then(data => {
            if (data.length > 0) {
              RideRate.find()
                .populate("taxId")
                .then(result => {
                  //res.status(200).json({ ...responseStatus.SUCCESS, data: result });
                  var finalResult = result;
                  var finalData = [];
                  var totalPages = Math.round(finalResult.length);
                  if (finalResult.length >= ti) {
                    for (let i = p; i < ti; i++) {
                      console.log("we", i);

                      finalData.push(finalResult[i]);
                    }

                    var async1 = require("async");
                    var count = 0;
                  async1.forEach(finalData,function(item,callback) {

                    if(item.isSchool){
                      School.findById(item["who"]).then((data)=>{
                        let index = finalData.indexOf(item);

                        finalData[index]["who"] = data;
                        callback();
                      })
                    } else {
                      User.findById(item["who"]).then((data)=>{
                        let index = finalData.indexOf(item);

                        finalData[index]["who"] = data;
                        callback();
                      })
                    }
            
                    
                }, function( err) {
                    //recording logs
                    var obj = new MasterRouter();
                    var resTemp = {
                      ...responseStatus.SUCCESS,
                      data: finalData,
                      totalPages: totalPages
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs ends
                    res.status(200).json({
                      ...responseStatus.SUCCESS,
                      data: finalData,
                      totalPages: totalPages
                    });
                  });
                  } else if (
                    finalResult.length < ti &&
                    p < finalResult.length
                  ) {
                    console.log("i m inside");
                    var finalData = [];
                    for (let i = p; i < finalResult.length; i++) {
                      finalData.push(finalResult[i]);
                    }
                    var async1 = require("async");
                  async1.forEach(finalData,function(item,callback) {

                    console.log("pp")

                    if(item.isSchool){
                      
                      School.findById(item["who"]).then((data1)=>{
                        let index = finalData.indexOf(item);
                       finalData[index]["who"] = data1;
                        callback();
                      })
                    } else {
                      User.findById(item["who"]).then((data)=>{
                        let index = finalData.indexOf(item);
                        finalData[index]["who"] = data;
                        callback();
                      })
                    }
            
                }, function( err) {
                  console.log("ff")
                    //recording logs
                    var obj = new MasterRouter();
                    var resTemp = {
                      ...responseStatus.SUCCESS,
                      data: finalData,
                      totalPages: totalPages
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs ends

                    res.status(200).json({
                      ...responseStatus.SUCCESS,
                      data: finalData,
                      totalPages: totalPages
                    });
                  });
                  } else {
                    var resTemp1 = {
                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                      message: NO_RECORDS_FOUND
                    };
                    var obj = new MasterRouter();
                    obj.makeLogs(req, resTemp1);
                    obj = null;
                    res.status(200).json({
                      ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                      message: NO_RECORDS_FOUND
                    });
                  }
                })
                .catch(error => {
                  var resTemp1 = {
                    ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                    message: UNKNOW_ERROR + error["message"]
                  };
                  var obj = new MasterRouter();
                  obj.makeLogs(req, resTemp1);
                  obj = null;
                  res
                    .status(500)
                    .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
                });
            } else {
              Tax.findOne()
                .sort("createdDate")
                .limit(1)
                .then(data => {
                  console.log(data, "data2");
                  if (data) {
                    const rideRate = new RideRate({
                      price: DefaultBillingRate.DEFAULT,
                      isSchool: false,
                      isGeneric: true,
                      taxId: data._id
                    });
                    rideRate.save().then(data => {
                      RideRate.find()
                        .populate({
                          path: "taxId",
                          populate: {
                            path: "taxId",
                            model: "Tax"
                          }
                        })
                        .then(result => {
                          //recording logs
                          var obj = new MasterRouter();
                          var resTemp = {
                            ...responseStatus.SUCCESS,
                            data: result
                          };
                          obj.makeLogs(req, resTemp);
                          obj = null;
                          //recording logs ends
                          res
                            .status(200)
                            .json({ ...responseStatus.SUCCESS, data: result });
                        })
                        .catch(error => {
                          var resTemp1 = {
                            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                            message: UNKNOW_ERROR + error["message"]
                          };
                          var obj = new MasterRouter();
                          obj.makeLogs(req, resTemp1);
                          obj = null;
                          res.status(500).json({
                            ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                            message: UNKNOW_ERROR
                          });
                        });
                    });
                  } else {
                    //recording logs
                    var obj = new MasterRouter();
                    var resTemp = {
                      ...responseStatus.SUCCESS,
                      message: "Please create a tax first"
                    };
                    obj.makeLogs(req, resTemp);
                    obj = null;
                    //recording logs ends
                    res.status(200).json({
                      ...responseStatus.SUCCESS,
                      message: "Please create a tax first"
                    });
                  }
                })
                .catch(error => {
                  var resTemp1 = {
                    ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
                    message: UNKNOW_ERROR + error["messsage"]
                  };
                  var obj = new MasterRouter();
                  obj.makeLogs(req, resTemp1);
                  obj = null;
                  res
                    .status(500)
                    .json({ ...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST, message: UNKNOW_ERROR });
                });
            }
          });
          
        }
     
  }

  public async addRideRate(req: Request, res: Response): void {
    const { who, price, taxId, isSchool, isGeneric } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          const rideRate = new RideRate({
            who,
            price,
            isSchool,
            isGeneric,
            taxId,
            createdBy:userDetails._id
          });

          rideRate
            .save()
            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              const status = res.statusCode;
              res.status(500).json({ status, error });
            });
        }
      
  }

  public async updateRideRate(req: Request, res: Response): void {
    const {
      who,
      price,
      taxId,
      isSchool,
      isGeneric,
      rideId,
      isArchived = false
    } = req.body;
    const { token } = req.body;

    let obj = new MasterRouter();
    let checkTokenResult = await obj.checkToken(token);
    let userDetails = await UserDetails.getUserDetails(token);

      if (!checkTokenResult) {
        //recording logs
          var resTemp1 = {
            ...responseStatus.FAILURE,
            errorCode:ErrorCodes.INVALID_TOKEN,
            message: INVALID_REQUEST
          };
          obj.makeLogs(req, resTemp1);
          obj = null;
          //recording logs ends
          res
            .status(200)
            .json({ ...responseStatus.FAILURE,errorCode:ErrorCodes.INVALID_TOKEN,message:INVALID_REQUEST});
        } else {
          RideRate.findOneAndUpdate(
            { _id: rideId },
            {
              price,
              taxId,
              isArchived,
              updatedBy:userDetails._id,
              updatedDate:Date.now()
            }
          )

            .then(data => {
              const status = res.statusCode;
              //recording logs
              var obj = new MasterRouter();
              var resTemp = {
                status,
                message: MASTER_DATA_ADDED_SUCCESS_MESSAGE
              };
              obj.makeLogs(req, resTemp);
              obj = null;
              //recording logs ends
              res
                .status(200)
                .json({ status, message: MASTER_DATA_ADDED_SUCCESS_MESSAGE });
            })
            .catch(error => {
              const status = res.statusCode;
              //recording logs
       var obj = new MasterRouter();
       var resTemp = {...responseStatus.FAILURE, errorCode:ErrorCodes.INVALID_REQUEST,
        message: UNKNOW_ERROR + error["message"]}
       obj.makeLogs(req, resTemp);
       obj = null;
       //recording logs end
              res.status(500).json({ status, error });
            });
        }
    
  }

  //token checking
  private checkToken(token){
    return new Promise(resolve=>{
   if((token != undefined || token != null) && token.length > 0  ){
     var query = {token,userType:UserTypes.PORTAL_USER,$or: [
        { userRole: UserRoles.SUPER_ADMIN },
        { userRole: UserRoles.SUB_ADMIN }
      ]};
    
      User.findOne(query).then(data => {
          if (!data || data == null) {
            //recording logs
        var obj = new MasterRouter();
        var resTemp = "checking token fails."
        obj.makeLogs(token, resTemp);
        obj = null;
        //recordins logs ends
            resolve(false);
          } else {
            //recording logs
        var obj = new MasterRouter();
        var resTemp = "checking token succeed."
        obj.makeLogs(token, resTemp);
        obj = null;
        //recordins logs ends
            resolve(true);
          }
        });
    } else {
       //recording logs
       var obj = new MasterRouter();
       var resTemp = "checking token fails."
       obj.makeLogs(token, resTemp);
       obj = null;
       //recordins logs ends
      resolve(false);
    }
  });
  }

  // set up our routes
  public routes() {
    this.router.post("/updateRideRate", this.updateRideRate);
    this.router.post("/rideRates", this.rideRates);
    this.router.post("/addRideRate", this.addRideRate);
    this.router.post("/addTestCenter", this.addTestCenter);
    this.router.post("/addVehicleType", this.addVehicleType);
    this.router.post("/updateVehicleType", this.updateVehicleType);
    this.router.post("/vehicleTypeById", this.vehicleTypeById);
    this.router.post("/addCurriculum", this.addCurriculum);
    this.router.post("/updateCurriculum", this.updateCurriculum);
    this.router.post("/curriculumById", this.curriculumById);
    this.router.post("/addPackage", this.addPackage);
    this.router.post("/updatePackage", this.updatePackage);
    this.router.post("/packageById", this.packageById);
    this.router.post("/addDocumentType", this.addDocumentType);
    this.router.post("/updateDocumentType", this.updateDocumentType);
    this.router.post("/documentTypeById", this.documentTypeById);
    this.router.post("/addSlot", this.addSlot);
    this.router.post("/updateSlot", this.updateSlot);
    this.router.post("/slotById", this.slotById);
    this.router.post("/addAttribute", this.addAttribute);

    this.router.post("/addCountries", this.addCountries);
    this.router.post("/updateCountries", this.updateCountries);
    this.router.post("/countriesById", this.countriesById);
    this.router.post("/addStates", this.addStates);
    this.router.post("/updateStates", this.updateStates);
    this.router.post("/stateById", this.stateById);
    this.router.post("/addCities", this.addCities);
    this.router.post("/updateCities", this.updateCities);
    this.router.post("/cityById", this.cityById);
    this.router.post("/testCenterList", this.testCenterList);
    this.router.post("/testCenterById", this.testCenterById);
    this.router.post("/updateTestCenter", this.updateTestCenter);
    this.router.post("/updateAttribute", this.updateAttribute);
    this.router.post("/attributeList", this.attributeList);
    this.router.post("/attributeById", this.attributeById);
    this.router.post("/packages", this.packages);
    this.router.post("/slots", this.slots);
    this.router.post("/documentTypes", this.documentTypes);

    this.router.post("/taxes", this.taxes);
    this.router.post("/addTax", this.addTax);
    this.router.post("/updateTax", this.updateTax);
    this.router.post("/taxById", this.taxById);

    this.router.post("/gearTypes", this.gearTypes);
    this.router.post("/addGearType", this.addGearType);
    this.router.post("/updateGearType", this.updateGearType);
    this.router.post("/gearTypeById", this.gearTypeById);
  }

  makeLogs(req: any, res: any) {
    console.log(res);

    var strRequest = "";
    if(req && req.body != undefined){
     strRequest = req.originalUrl + " \n Req body was: " + JSON.stringify(req.body);
    } else{
      strRequest = req
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

    var fileName = "MasterRouter" + d + "-" + (m + 1) + "-" + y + ".txt";

    var logStream = fs.createWriteStream("logs/" + fileName, {
      flags: "a"
    });
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write(message + "\n");
    logStream.end("this is the end line \n");
  }
}

const masterRouter = new MasterRouter();
masterRouter.routes();

export default masterRouter.router;
