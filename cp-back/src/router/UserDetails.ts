import * as mongoose from "mongoose";
import User from "../models/User";
import { Promise, Mongoose } from "mongoose";
import { static } from "express";

export default class UserDetails {
   
    constructor() {}

    public static getUserDetails(token,cc=""){
        return new Promise((resolve,reject)=>{
            if(token == null){
                resolve(null);
            } else if(cc != ""){
                User.findOne({mobileNumber:token,countryCode:cc}).then((data)=>{
                    resolve(data);
                });
            }else{
            User.findOne({token:token}).then((data)=>{
                if(data == null){
                    User.findById(token).then((data)=>{
                        resolve(data);

                    }).catch(()=>{
                        resolve();
                    })
                } else {
                  resolve(data);
                }
            }).catch(()=>{
                console.log("data");
                resolve("null")
            })
        }
        })
    }

}
  
