import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from "rxjs";

import { map } from "rxjs/operators";
import { RequestOptions } from '@angular/http';
// import {Headers } from '@angular/http';
import { utf8Encode } from '@angular/compiler/src/util';

@Injectable({
  providedIn: 'root'
})
export class DataService {


  constructor(private http: HttpClient,

    @Inject('baseURL') private baseURL: string,

    @Inject('picUrl') private picUrl: string,
  ) { }



  getCall(endpoint): Observable<any> {

  let request =    `${this.baseURL}${endpoint}`;

    return this.http.get(request).pipe(map(results => results));
  }


  insertOredrForm(value): Observable<any>{
    console.log(value,'from service')

    return this.http.post(this.baseURL+'/RequestOrderFormInsert', value).
    pipe(map(results => results))


  }

  // payement(value): Observable<any>{
  //   console.log(value)
  //   return this.http.post('https://simplecheckout.authorize.net/payment/CatalogPayment.aspx', value).
  //   pipe(map(results => results))

  // }



}