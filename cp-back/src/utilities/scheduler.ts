import { NotificationTypes } from "./../constants/NotificationTypes";
import RideBookingTransferRequest from "../models/RideBookingTransferRequest";
import { RideBookingTransferRequestStatus } from "../constants/RideBookingTransferRequestStatus";
import Utils from "./utils";
import RideBooking from "../models/RideBooking";
import PushInfo from "../models/PushInfo";
import DriverRating from "../models/DriverRating";
import Attribute from "../masters/Attribute";
import RatingAverage from "../models/RatingAverage";
import SchedulerAndWsLogs from "../models/SchedulerAndWsLogs";
import { json } from "body-parser";
import { CronJob } from "cron";

export default class Scheduler {
  static checkForLearnerBookings() {
    let from = new Date();

    let to = new Date();
    to.setMinutes(to.getMinutes() + 10);
    // if(now.getTime() - previous.getTime() >= 20*60*1000){
    // }
    // console.log(from, to)

    RideBooking.aggregate([
      {
        $match: {
          startDateTime: { $gt: from, $lt: to },
          isPushSent: { $eq: false }
        }
      },
      {
        $lookup: {
          from: "bookings",
          localField: "bookingId",
          foreignField: "_id",
          as: "booking"
        }
      }
    ])
      .then(res => {
        if (res && res.length) {
          //console.log(JSON.stringify(res));

          let users = [];
          let bookingIds = [];
          res.forEach((element, i) => {
            bookingIds.push(element._id);
            users.push(element["booking"][0]["learnerId"]);
            console.log("i am user", users);
            if (i == res.length - 1) {
              PushInfo.find({ userId: { $in: users } }).then(resp => {
                if (resp && resp.length > 0) {
                  let to = [];
                  let title = "Ride Alert!";
                  let message = "Get ready! Your ride on the way to you.";
                  for (let l = 0; l < resp.length; l++) {
                    to.push(resp[l]["pushToken"]);
                  }

                  let params = {
                    type: NotificationTypes.LEARNER_BOOKING_TIME
                  };
                  console.log("i m push token", to);
                  Utils.sendPushNotification(to, message, title, params)
                    .then(notificationData => {
                      //console.log(notificationData);
                      var logs = new SchedulerAndWsLogs({
                        to:to,
                        message:message,
                        title:title,
                        params:JSON.stringify(params),
                        from: "checkForLearnerBookings",
                        res:JSON.stringify(notificationData)
                      });
                      logs.save().then(()=>{})
                      var criteria = {
                        _id: { $in: bookingIds }
                      };
                      RideBooking.updateMany(
                        criteria,
                        { isPushSent: true },
                        function(err, res) {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log("dd");
                          }
                        }
                      );
                    })
                    .catch(err => {
                      console.log("notif err", err);
                      var logs = new SchedulerAndWsLogs({
                        to:to,
                        message:message,
                        title:title,
                        params:JSON.stringify(params),
                        from: "checkForLearnerBookings",
                        res:JSON.stringify(err)
                      });
                      logs.save().then(()=>{})
                    });
                }
              });
            }
          });
        } else {
          console.log("No data exists !");
        }
      })
      .catch(err => {
        var logs = new SchedulerAndWsLogs({
          to:to,
          message:"",
          title:"",
          params:"",
          from: "checkForLearnerBookings",
          res:"Failed execute cron checkForLearnerBookings !" + JSON.stringify(err)
        });
        logs.save().then(()=>{})
        console.log("Failed execute cron checkForLearnerBookings !");
      });
  }

  static checkForTransferRequest() {
    let from = new Date();
    let to = new Date();
    to.setMinutes(to.getMinutes() - 10);

    //find({status: RideBookingTransferRequestStatus.IN_PROGRESS,to:{$ne: "ALL"}})

    RideBookingTransferRequest.aggregate([
      {
        $match: {
          createdDate: { $lt: to },
          status: RideBookingTransferRequestStatus.IN_PROGRESS,
          to: { $ne: "ALL" }
        }
      }
    ])
      .then(res => {
        if (res && res.length) {
          let rbtr = [];
          res.forEach((element, i) => {
            rbtr.push(element._id);

            RideBookingTransferRequest.updateOne(
              { _id: element._id },
              { topic: element["city"] }
            ).then(x => {});
            let to = element["city"];

            let title = element["title"];
            let message = element["message"];
            let params = {
              rideBookingTransferRequestId: element._id,
              bookingId: element["rideBookingId"],
              type: NotificationTypes.TRANSFER_BOOKING_ALL
            };
            console.log("transfering",to);
            // Utils.sendPushNotification(to, message, title, params).then((notificationData)=>{});
            // if(i == res.length-1){
            //     RideBookingTransferRequest.updateMany({_id:{$in:rbtr}}, {to:'ALL'});
            // }
            Utils.sendPushToTopicAndroid(to, message, title, params).then(
              notificationData => {
                var logs = new SchedulerAndWsLogs({
                  to:to,
                  message:message,
                  title:title,
                  params:JSON.stringify(params),
                  from: "checkForTransferRequest",
                  res:JSON.stringify(notificationData)
                });
                logs.save().then(()=>{})
              }

            );
            Utils.sendPushToTopiciOS(to, message, title, params).then(
              notificationData => {
                var logs = new SchedulerAndWsLogs({
                  to:to,
                  message:message,
                  title:title,
                  params:JSON.stringify(params),
                  from: "checkForTransferRequest",
                  res:JSON.stringify(notificationData)
                });
                logs.save().then(()=>{})

              }
            );
            if (i == res.length - 1) {
              RideBookingTransferRequest.updateMany(
                { _id: { $in: rbtr } },
                { to: "ALL" }
              ).then(x => {});
            }
          });
        } else {
          console.log(
            "No " + RideBookingTransferRequestStatus.IN_PROGRESS + " exists !"
          );
        }
      })
      .catch(err => {
        var logs = new SchedulerAndWsLogs({
          to:to,
          message:"",
          title:"",
          params:"",
          from: "checkForTransferRequest",
          res:"Failed execute cron checkForTransferRequest !"+JSON.stringify(err)
        });
        logs.save().then(()=>{})
        console.log(err);
        console.log("Failed execute cron checkForTransferRequest !");
      });
  }
  static checkForRidesNotTaken() {
    let currentDateTime = new Date();
    // RideBooking.find({startDateTime:{$lt:currentDateTime}} && {status:"NOT_ACTIVE"})
    // .then(result=>{
    //  if(result){
    //     RideBooking.update({},
    //         {
    //         status
    //         }
    //         ).then(data=>{
    //             console.log("Status Updated ");
    //         })
    //  } else{
    //     console.log("No data exists !");
    //  }
    RideBooking.update(
      { startDateTime: { $lt: currentDateTime }, status: "NOT_ACTIVE" },
      { status: "NOT_TAKEN" },
      { multi: true }
    ).then(result => {
      console.log("Status Updated ");
    });
  }
  static updateDriverAverageRating() {
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
      //console.log(data);

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
        //console.log(data);

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
              // console.log(cnt);
              if (cnt > 0) {
                //   console.log(current + ' comes --> ' + cnt + ' times<br>');
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
              // console.log(current);
              cnt++;
            }
          }
          temp[index]["att"] = x;

          if (cnt > 0) {
            // console.log(current + ' comes --> ' + cnt + ' times');
            var q = { att: "", count: 0, avg: 0 };
            q.att = current;
            q.count = cnt;
            var val = (cnt / d.count) * 100;
            var finalRate = (5 * val) / 100;
            q.avg = finalRate;
            x.push(q);
          }
        });
        // console.log(temp);
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
      });
    });
  }
}
