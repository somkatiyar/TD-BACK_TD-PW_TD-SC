import { UNKNOW_ERROR, INVALID_REQUEST, INFORMATION_UPDATED_SUCCESS } from './../constants/Messages';
import { Promise } from 'mongoose';
import { responseStatus } from '../constants/responseStatus';
import VehicleData from '../models/VehicleData';
import { LatLongTypes } from '../constants/LatLongTypes';
import SchoolToUser from '../models/SchoolToUser';
import User from '../models/User';
import SchedulerAndWsLogs from "../models/SchedulerAndWsLogs";

export default class Wsutil {

    static insertLocation(data) {
        return new Promise((resolve)=>{
            let vehicleData = new VehicleData(data);
            vehicleData.save().then(res=>{
                var logs = new SchedulerAndWsLogs({
                    to:"",
                    message:"",
                    title:"",
                    params:JSON.stringify(data),
                    from: "insertLocation WS",
                    res:JSON.stringify(res)
                  });
                  logs.save().then(()=>{})
              resolve({...responseStatus.SUCCESS});
            })
            .catch(err=>{
                var logs = new SchedulerAndWsLogs({
                    to:"",
                    message:"",
                    title:"error",
                    params:JSON.stringify(data),
                    from: "insertLocation WS",
                    res:JSON.stringify(err)
                  });
                  logs.save().then(()=>{})
              resolve({...responseStatus.FAILURE});
            });
        });
    }

    static colleagueLocation(userId) {
        return new Promise((resolve)=>{
            // User.findOne({_id: userId}).then(result=>{
            //     if(result && result._id){
                    SchoolToUser.findOne({user:userId}).then(resp=>{
                        SchoolToUser.find({school:resp['school']}).then(records=>{
                        let users = [];
                        console.log(records);
                        if(records && records.length){
                            for(let i=0; i < records.length; i++){
                                users.push(records[i]['user'])
                                if(i == records.length-1){
                                    VehicleData.find({user: { $in: users }, dataType: LatLongTypes.MOBILE}).populate("user").then(data=>{
                                        console.log("user", data);
                                        let vData: any = data;
                                        if(vData && vData.length){
                                            User.find({_id:{$in: users}}).then(respo=>{
                                                let uData: any = respo;
                                                for(let i=0; i<vData.length; i++){
                                                    let index = uData.findIndex(u => u._id == vData[i]['user']);
                                                    if(index > -1){
                                                        vData[i]['user'] = uData[index];
                                                    }else{
                                                        vData[i]['user'] = [];
                                                    }
                                                    if(i == vData.length-1){
                                                        var logs = new SchedulerAndWsLogs({
                                                            to:"",
                                                            message:"",
                                                            title:"",
                                                            params:JSON.stringify(data),
                                                            from: "colleagueLocation WS",
                                                            res:JSON.stringify(data)
                                                          });
                                                          logs.save().then(()=>{})
                                                        resolve({...responseStatus.SUCCESS, data: data});
                                                    }
                                                }
                                            })
                                            .catch(err=>{
                                                console.log(err);
                                                var logs = new SchedulerAndWsLogs({
                                                    to:"",
                                                    message:"",
                                                    title:"error",
                                                    params:JSON.stringify(data),
                                                    from: "colleagueLocation WS",
                                                    res:JSON.stringify(err)
                                                  });
                                                  logs.save().then(()=>{})
                                                resolve({...responseStatus.FAILURE, message:UNKNOW_ERROR+" 4"});
                                            })
                                        }else{
                                            var logs = new SchedulerAndWsLogs({
                                                to:"",
                                                message:"",
                                                title:"error",
                                                params:JSON.stringify(data),
                                                from: "colleagueLocation WS",
                                                res:INVALID_REQUEST
                                              });
                                              logs.save().then(()=>{})
                                            resolve({...responseStatus.FAILURE, message: INVALID_REQUEST});
                                        }
                                    })
                                    .catch(err=>{
                                        console.log(err);
                                        var logs = new SchedulerAndWsLogs({
                                            to:"",
                                            message:"",
                                            title:"error",
                                            params:"",
                                            from: "colleagueLocation WS",
                                            res:JSON.stringify(err)
                                          });
                                          logs.save().then(()=>{})
                                        resolve({...responseStatus.FAILURE, message:UNKNOW_ERROR+" 3"});
                                    })
                                }
                            }
                        }else{
                            var logs = new SchedulerAndWsLogs({
                                to:"",
                                message:"",
                                title:"error",
                                params:"",
                                from: "colleagueLocation WS",
                                res:INVALID_REQUEST
                              });
                              logs.save().then(()=>{})
                            resolve({...responseStatus.FAILURE, message: INVALID_REQUEST});
                        }
                       
                        })
                        .catch(err=>{
                            var logs = new SchedulerAndWsLogs({
                                to:"",
                                message:"",
                                title:"error",
                                params:"",
                                from: "colleagueLocation WS",
                                res:JSON.stringify(err)
                              });
                              logs.save().then(()=>{})
                            resolve({ ...responseStatus.FAILURE, message: UNKNOW_ERROR+" 2" });
                        });
                    })
                    .catch(err=>{
                        console.log(err);
                        var logs = new SchedulerAndWsLogs({
                            to:"",
                            message:"",
                            title:"error",
                            params:"",
                            from: "colleagueLocation WS",
                            res:JSON.stringify(err)
                          });
                          logs.save().then(()=>{})
                        resolve({ ...responseStatus.FAILURE, message: UNKNOW_ERROR+" 1" });
                    });
            //     }  
            // })
            // .catch(err=>{
            //     resolve({ ...responseStatus.FAILURE, data: [] });
            // });  
        });
    }

    
    
      static addMobileLocation(data) {
        return new Promise((resolve)=>{
            const { lat, long, user, dataType } = data;
            console.log(user,"llopl");
            VehicleData.findOne({user, dataType: LatLongTypes.MOBILE}).then(result=>{
                if(result && result._id){
                  VehicleData.findOneAndUpdate({ _id: result._id }, {lat, long}).then(resp=>{
                    var logs = new SchedulerAndWsLogs({
                        to:"",
                        message:"",
                        title:"",
                        params:JSON.stringify(data),
                        from: "addMobileLocation WS",
                        res:JSON.stringify(resp)
                      });
                      logs.save().then(()=>{}).catch((err)=>{console.log(err)});
                    resolve({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS });
                  })
                  .catch(err=>{
                    var logs = new SchedulerAndWsLogs({
                        to:"",
                        message:"",
                        title:"error",
                        params:JSON.stringify(data),
                        from: "addMobileLocation WS",
                        res:JSON.stringify(err)
                      });
                      logs.save().then(()=>{}).catch((err)=>{console.log(err)});
                    resolve({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
                  });
                }else{
                  let vehicleData = new VehicleData({
                    lat, long, user, dataType
                  });
                  vehicleData.save().then(data1=>{
                    var logs = new SchedulerAndWsLogs({
                        to:"",
                        message:"",
                        title:"",
                        params:JSON.stringify(data),
                        from: "addMobileLocation WS",
                        res:JSON.stringify(data1)
                      });
                      logs.save().then(()=>{}).catch((err)=>{console.log(err)});
                    resolve({ ...responseStatus.SUCCESS, message: INFORMATION_UPDATED_SUCCESS });
                  })
                  .catch(err=>{
                    var logs = new SchedulerAndWsLogs({
                        to:"",
                        message:"",
                        title:"error",
                        params:JSON.stringify(data),
                        from: "addMobileLocation WS",
                        res:JSON.stringify(err)
                      });
                      logs.save().then(()=>{}).catch((err)=>{console.log(err)});
                    resolve({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
                  });
                }
            })
            .catch(err=>{
                var logs = new SchedulerAndWsLogs({
                    to:"",
                    message:"",
                    title:"error",
                    params:JSON.stringify(data),
                    from: "addMobileLocation WS",
                    res:JSON.stringify(err)
                  });
                  logs.save().then(()=>{}).catch((err)=>{console.log(err)});
                resolve({ ...responseStatus.FAILURE, message: UNKNOW_ERROR });
            })
        });
    }

}