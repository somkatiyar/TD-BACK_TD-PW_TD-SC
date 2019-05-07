import { NotificationTypes } from "./../constants/NotificationTypes";
import * as AWS from "aws-sdk";
import { Promise } from "mongoose";
import { GmailCredentials} from "../constants/GmailCredentials"
import { responseStatus } from "../constants/responseStatus";
import axios from "axios";
import * as request from "request";
import * as FormData from "form-data";
import { BaseURL } from "../constants/BaseURL";
import PushInfo from "../models/PushInfo";
import NotiSmsLogs from "../models/NotifSmsLogs";
import EmailSendHtml from "./EmailSendHtml"
// import EmailTemplate from "email-templates";
import * as fs from "fs";
const nodemailer = require('nodemailer')
var SERVER_KEY = "AIzaSyBPyLHTtUqpYflLx1Lj9VpNzEK0kYg9AGk";

export default class Utils {
  static sendSNS(mobile: string, OTP: string) {
    return new Promise(resolve => {
      // const OTP = "123456" || Math.floor(100000 + Math.random() * 900000);
       const OTP = Math.floor(100000 + Math.random() * 900000);
      // Comment while in production
     // resolve({ ...responseStatus.SUCCESS, OTP: OTP });
      // console.log(OTP);
      // Uncomment while in production
          AWS.config.update ({ "accessKeyId": "AKIAJJ2DDNR3PFUT6XKA", "secretAccessKey": "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", "region": "us-west-2" });

          let data = {
              attributes:{
                  'DefaultSMSType' : 'Transactional'
              }
          };

          var setSMSTypePromise = new AWS.SNS({apiVersion: '2010-03-31'}).setSMSAttributes(data).promise();

          setSMSTypePromise.then((data) => {
              console.log(data);
              if(data['ResponseMetadata'] && data['ResponseMetadata']['RequestId']){
                  // Create publish parameters
                  var params = {
                      Message: 'Your OTP is '+ OTP,
                      PhoneNumber: mobile,
                  };

                  // Create promise and SNS service object
                  var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

                  // Handle promise's fulfilled/rejected states
                  publishTextPromise.then((res) => {
                      console.log("MessageID is " + res.MessageId);
                      resolve({...responseStatus.SUCCESS, OTP: OTP});
                  }).catch((err) => {
                      console.error(err, err.stack);
                      resolve({...responseStatus.FAILURE});
                  });
              }else{
                  resolve({...responseStatus.FAILURE});
              }
          }).catch((err) => {
              console.error(err, err.stack);
              resolve({...responseStatus.FAILURE});
          });
    });
  }

  static sendSES(to: string, message: string, subject: string) {
    return new Promise(resolve => {
      let sub = subject ? subject : "TEST EMAIL FROM AWS SES";
      // Uncomment while in production
      AWS.config.update({
        accessKeyId: "AKIAJJ2DDNR3PFUT6XKA",
        secretAccessKey: "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",
        region: "us-west-2"
      });

      // Create sendEmail params
      var params = {
        Destination: {
          /* required */
          CcAddresses: [
            /* more items */
          ],
          ToAddresses: [
            to
            //"som.katiyar@trignodev.com"
            /* more items */
          ]
        },
        Message: {
          /* required */
          Body: {
            /* required */
            Html: {
              Charset: "UTF-8",
              Data: message
            }
          },
          Subject: {
            Charset: "UTF-8",
            Data: sub
          }
        },
        Source: "noreply@lurnr.co", /* required */
        
      };

      // Body: { /* required */
      //     Html: {
      //         Charset: "UTF-8",
      //         Data: message
      //     },
      //     Text: {
      //         Charset: "UTF-8",
      //         Data: "TEXT_FORMAT_BODY"
      //     }
      // },

      // Create the promise and SES service object
      var sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
        .sendEmail(params)
        .promise();

      // Handle promise's fulfilled/rejected states

      sendPromise
        .then(data => {
          let logs = new NotiSmsLogs({
            req:JSON.stringify(params),
            res:JSON.stringify(data),
            title:"Send email"
          });
          logs.save().then(()=>{});
          console.log(data.MessageId);
          resolve({ ...responseStatus.SUCCESS });
        })
        .catch(err => {
          let logs = new NotiSmsLogs({
            req:JSON.stringify(params),
            res:JSON.stringify(err.message),
            title:"Send email error"
          });
          logs.save().then(()=>{});
          console.error(err, err.stack);
          resolve({ ...responseStatus.FAILURE });
        });
    });
  }







  public static emailSend(locals) {
   
    console.log('i m in email template')
    return new Promise((reject,resolve)=>{

   
       var htmlRender =  EmailSendHtml.emailTemplateString(locals)
      

        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: GmailCredentials.USERNAME,
            pass: GmailCredentials.PASSWORD
          }
        });
        
        var mailOptions = {
          from: 'lurnr.co@gmail.com',
          // to: 'kabir@appysource.com,manish@appysource.com',
          to: 'rupel.sengar@trignodev.com,som.katiyar@trignodev.com',
          subject: locals.subject,
          html:htmlRender
          
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            let logs = new NotiSmsLogs({
              req:JSON.stringify(locals),
              res:JSON.stringify(error),
              title:"Send email error"
            });
            logs.save().then(()=>{});
            console.error(error,'som3');
          } else {
            console.log('Email sent: ' + info.response);
            let logs = new NotiSmsLogs({
              req:JSON.stringify(locals),
              res:JSON.stringify(info.response),
              title:"Send email"
            });
            logs.save().then(()=>{

            }).catch((err)=>{
              console.log(err)
            });
          
          }
        });


    }).catch((err)=>{
      let logs = new NotiSmsLogs({
        req:JSON.stringify(locals),
        res:JSON.stringify(err),
        title:"Send email error"
      });
      logs.save().then(()=>{

      }).catch((err)=>{
        console.error(err);
      });
     
      
    })

}














  static sendPushToTopiciOS(
    city: any,
    message: string,
    title: string,
    params?: any
  ) {
    console.log(city, message, title);

    return new Promise((resolve, reject) => {
      let config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Key=" + SERVER_KEY
        }
      };


      //iOS Notif
      let iosBody = {
        to: "/topics/driver-" + city + "-ios",
        data: {
          title: title,
          message: message,
          payload: params
        },
        notification: {
          body: message,
          title: title
        }
      };

      if (params["type"] == NotificationTypes.TRANSFER_BOOKING) {
        iosBody.data["actions"] = [
          {
            title: "ACCEPT",
            action: "ACCEPT"
          },
          {
            title: "REJECT",
            action: "REJECT"
          }
        ];
      }
      axios
        .post("https://fcm.googleapis.com/fcm/send", iosBody, config)
        .then(response => {
          console.log("i am push response ", response);
          let logs = new NotiSmsLogs({
            req:JSON.stringify(params),
            res:JSON.stringify(response["data"]),
            title:"Push to topic ios"
          });
          logs.save().then(()=>{});
          resolve({ ...responseStatus.SUCCESS, data: response["body"] });
        })
        .catch(error => {
          let logs = new NotiSmsLogs({
            req:JSON.stringify(params),
            res:JSON.stringify(error),
            title:"Push to topic ios"
          });
          logs.save().then(()=>{});
          resolve({ ...responseStatus.FAILURE });
        });
    });
  }

  static sendPushToTopicAndroid(
    city: any,
    message: string,
    title: string,
    params?: any
  ) {
    console.log(city, message, title);

    return new Promise((resolve, reject) => {
      let config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Key=" + SERVER_KEY
        }
      };

      let androidBody = {
        to: "/topics/driver-" + city + "-android",
        data: {
          title: title,
          message: message,
          payload: params
        }
      };

      if (params["type"] == NotificationTypes.TRANSFER_BOOKING) {
        androidBody.data["actions"] = [
          {
            title: "ACCEPT",
            action: "ACCEPT"
          },
          {
            title: "REJECT",
            action: "REJECT"
          }
        ];
      }

      axios
        .post("https://fcm.googleapis.com/fcm/send", androidBody, config)
        .then(response => {
          console.log("i am push response ", response);
          let logs = new NotiSmsLogs({
            req:JSON.stringify(params),
            res:JSON.stringify(response["data"]),
            title:"Push to topic android"
          });
          logs.save().then(()=>{});
          resolve({ ...responseStatus.SUCCESS, data: response["body"] });
        })
        .catch(error => {
          let logs = new NotiSmsLogs({
            req:JSON.stringify(params),
            res:JSON.stringify(error),
            title:"Push to topic android"
          });
          logs.save().then(()=>{});
          resolve({ ...responseStatus.FAILURE });
        });

      
    });
  }

  static sendPushNotification(
    to: any,
    message: string,
    title: string,
    params?: any
  ) {
    // console.log("i am called");

    if (to.length <= 0) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      var iOS = [];
      var android = [];

    //  console.log("i m push 2", to);

      var async = require("async");
      async.parallel(
        {
          one: function(callback) {
            PushInfo.find({ pushToken: { $in: to } })
              .sort({ updatedDate: -1 })
              .then(data => {
                console.log("i am full data", data);
                data.forEach(dd => {
                  if (dd["os"].toUpperCase() === "ANDROID") {
                    android.push(dd["pushToken"]);
                  } else {
                    iOS.push(dd["pushToken"]);
                  }
                });

                callback(true);
              });
          }
        },
        function(err, results) {
          let uniqueArrayAndroid = android.filter(function(elem, pos) {
            return android.indexOf(elem) == pos;
          });

          let uniqueArrayIOS = iOS.filter(function(elem, pos) {
            return iOS.indexOf(elem) == pos;
          });

          android = uniqueArrayAndroid;
          iOS = uniqueArrayIOS;
         // console.log("i am push ids android", android);
         // console.log("i am push ids ios", iOS);

          let androidBody = {
            data: {
              title: title,
              message: message,
              //  "content_available":true,
              //  "force-start": true,
              //  "forceShow": true,
              payload: params
            },
            registration_ids: android
          };

          if (params["type"] == NotificationTypes.TRANSFER_BOOKING) {
            androidBody.data["actions"] = [
              {
                title: "ACCEPT",
                action: "ACCEPT"
              },
              {
                title: "REJECT",
                action: "REJECT"
              }
            ];
          }

          let config = {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Key=" + SERVER_KEY
            }
          };
          if (android.length > 0) {
            axios
              .post("https://fcm.googleapis.com/fcm/send", androidBody, config)
              .then(response => {
                console.log("i am push response android ", response["data"]);
               let logs = new NotiSmsLogs({
                req:JSON.stringify(params),
                res:JSON.stringify(response["data"]),
                title:"Android push"
              });
              logs.save().then(()=>{});
                resolve({ ...responseStatus.SUCCESS, data: response["body"] });
              })
              .catch(error => {
                console.log("android", error);
               let logs = new NotiSmsLogs({
                req:JSON.stringify(params),
                res:JSON.stringify(error),
                title:"Android push"
              });
              logs.save().then(()=>{});
                resolve({ ...responseStatus.FAILURE });
              });
          }

          //iOS Notif
          let iosBody = {
            data: {
              title: title,
              message: message,
              //  "content_available":true,
              //  "force-start": true,
              //  "forceShow": true,
              payload: params
            },
            notification: {
              body: message,
              title: title
            },
            registration_ids: iOS
          };

          if (params["type"] == NotificationTypes.TRANSFER_BOOKING) {
            iosBody.data["actions"] = [
              {
                title: "ACCEPT",
                action: "ACCEPT"
              },
              {
                title: "REJECT",
                action: "REJECT"
              }
            ];
          }

          let iosConfig = {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Key=" + SERVER_KEY
            }
          };
          if (iOS.length > 0) {
            axios
              .post("https://fcm.googleapis.com/fcm/send", iosBody, iosConfig)
              .then(response => {
                //console.log("i am push response ios ", response);
                let logs = new NotiSmsLogs({
                  req:JSON.stringify(params),
                  res:JSON.stringify(response["data"]),
                  title:"iOS push"
                });
                logs.save().then(()=>{});
                resolve({ ...responseStatus.SUCCESS, data: response["body"] });
              })
              .catch(error => {
                let logs = new NotiSmsLogs({
                  req:JSON.stringify(params),
                  res:JSON.stringify(error),
                  title:"iOS push"
                });
                logs.save().then(()=>{});
                //console.log("ios", error);
                resolve({ ...responseStatus.FAILURE });
              });
          }
        }
      );
    });
  }

  static faceMatch(urlOne: string, urlTwo: string) {
    console.log("Match", urlOne, urlTwo);
    return new Promise(resolve => {
      //  var formData = new FormData();
      //  formData.append("url_first", fs.createReadStream("./uploads/15501497942270"));
      //  formData.append("url_second", fs.createReadStream("./uploads/15501497942270"));
      var body={
        "url_first":urlOne,
        "url_second":urlTwo
      }
      let config = {
          // headers:{
          //   'content-type': `multipart/form-data`,
          // }
      }
      
      axios.post(BaseURL.FACE_MATCH_URL+'identitymatchurl', body,config)
      .then(response => {
          console.log("i m res body",response['data']);
                      let data = response['data'];
                      console.log("i m data",data.FaceMatches.length);
                      let logs = new NotiSmsLogs({
                                req:request,
                                res:JSON.stringify(data) ,
                                title:"Face match"
                              });
                              logs.save().then(()=>{});
                              if (data && data.FaceMatches && data.FaceMatches.length > 0) {
                                
                                resolve({ ...responseStatus.SUCCESS });
                              } else {
                                resolve({ ...responseStatus.FAILURE });
                              }
         // resolve({ ...responseStatus.SUCCESS, data: response['body'] })
      })
      .catch(error => {
          console.log(error);
          resolve({ ...responseStatus.FAILURE })
      });

      // let req = request.post(
      //   'http://192.168.16.4:5555/api/identitymatchurl',
        
      //   (err, response, body) => {
      //     if (err) {
      //       console.log("there was an error", err);
      //       let logs = new NotiSmsLogs({
      //         req:JSON.stringify(request),
      //         res:JSON.stringify(response) + JSON.stringify(err),
      //         title:"Face match error portion"
      //       });
      //       logs.save().then(()=>{});

      //       resolve({ ...responseStatus.FAILURE });
      //     }

      //     if (body) {
      //       let data = JSON.parse(body);
      //       // console.log("Match", data);
      //       let logs = new NotiSmsLogs({
      //         req:JSON.stringify(request),
      //         res:JSON.stringify(response) + JSON.stringify(body),
      //         title:"Face match"
      //       });
      //       logs.save().then(()=>{});
      //       if (data && data.FaceMatches && data.FaceMatches.length) {
              
      //         resolve({ ...responseStatus.SUCCESS });
      //       } else {
      //         resolve({ ...responseStatus.FAILURE });
      //       }
      //     }
      //     // 3. Return the payment ID to the client
      //     // console.log(response);
      //     // resolve({ ...responseStatus.SUCCESS, data: response['body'] })
      //   }
      // );
      //let formData = req.form();

      // formData.append("url_first", urlOne);
      // formData.append("url_second", urlTwo);
    });
  }
}
