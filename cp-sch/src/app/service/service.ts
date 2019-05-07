

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import 'rxjs/Rx';



import { Injectable, Inject } from '@angular/core';
import { Http, Headers,RequestOptions } from '@angular/http';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

import { Observable, throwError } from 'rxjs';
import { VarService } from './var.service';
import {timeout} from 'rxjs/operators/timeout'; 
import { Router } from '@angular/router';




declare var toastr;

@Injectable({
  providedIn: 'root'
})

export class DataService {

  constructor(private http: Http,
    private ctrl : VarService,
    private router:Router,
     @Inject('baseURL') private baseURL: string,
     @Inject('picUrl') private picUrl: string) {
   
    
  }

  success(title:string, message?:string) {
      toastr.success(title,message);
  }

  error(title:string, message?:string) {
    toastr.error(title,message);
}
warning(title:string, message?:string) {
  toastr.error(title,message);
}


checkErrorCode() {
     
  localStorage.removeItem('userToken');
  localStorage.removeItem('schoolId');
  localStorage.removeItem('schoolUserId');
  localStorage.removeItem('states');
  localStorage.removeItem('cities');
  localStorage.removeItem('countries');

}



  login(value): Observable<any>{
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL+'school/login',value)
   
    .map(response => response.json())  
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }


  signup(value): Observable<any>{
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL+'school/create',value)
    .map(response => response.json())
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }  

  profile(value): Observable<any>{
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL+'school/profile',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })

    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  } 
  
  // updateProfile(value): Observable<any>{

  //   return this.http.post(this.baseURL+'school/driverCreate',value).map(response => response.json())
  //   .catch((err: Response | any) => {
  //     return Observable.throw(err.statusText);
  //   })
  // }


  driverCreate(value): Observable<any>{
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL+'common/driverCreateNew',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
       this.ctrl.isLoading = false;
      
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }



  upload(body){
    console.log('formdata value',body.getAll('id','fileType','file'));
    const headers: Headers = new Headers();
    console.log("the service data are",body);
    return this.http.post(this.baseURL + 'common/resourceUpload',body).map(response => response.json())
      .catch((err: Response | any) => {
       
        console.log(Response,'response from service')
        return Observable.throw(err.statusText);
      })
  }




  drivers(body): Observable<any> {

    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/drivers',body, )
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
      .catch((err: Response | any) => {
        return Observable.throw(err.statusText);
      })
  }


  vehicleTypes(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'common/vehicleTypes',value)
    .map(response => response.json())
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  companions(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'common/companions',value)
    .map(response => response.json())
   .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }
  


  driverById(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/driverById',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }


  driverUpdate(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'common/driverUpdate',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  orderById(value) {
    this.ctrl.isLoading = true;
  
    return this.http.post(this.baseURL + 'learner/orderById',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  forgotPassword(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/forgotPasswordSendLink',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }
  
  driverRideBookings(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/driverRideBookings',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  updatePassword(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/updatePassword',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  schoolUpdate(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/update',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }


  paymentHistory(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/paymentHistory',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    })
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  invoiceDetailById(value){
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'admin/invoiceDetailById',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  totalEarning(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/totalEarning',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }


  totalLesson(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'school/totalLesson',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }


  cities() {
    this.ctrl.isLoading = true;
    let request = {
    };
    return this.http.post(this.baseURL + 'common/cities',request)
    .map(response => response.json())
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  states() {
    this.ctrl.isLoading = true;
    let request = {
    };
    return this.http.post(this.baseURL + 'common/states',request)
    .map(response => response.json())
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  countries() {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'common/countries',{})
    .map(response => response.json())
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }
  getGearType() {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL + 'common/gearTypes',{})
    .map(response => response.json())
    .finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  
  }

  paymentStatus(value) {

    return this.http.post(this.baseURL +'common/paymentStatus',value).map(response => response.json())
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  disableSchoolDriver(value) {
    this.ctrl.isLoading = true;
    return this.http.post(this.baseURL +'school/enableDisableDriver',value)
    .map(response => response.json())
    .do((response: Response | any)=>{
      if(response['status']==0 && response['errorCode']==1) {
        this.error(response['message'])
        this.checkErrorCode();
        this.router.navigateByUrl('/login');
      }
    }).finally(()=>{
      this.ctrl.isLoading = false;
    })
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  colleagueLocationData(value) {

    return this.http.post(this.baseURL + 'driver/colleagueLocationData',value).map(response => response.json())
    .catch((err: Response | any) => {
      return Observable.throw(err.statusText);
    })
  }

  }

  
  


  

