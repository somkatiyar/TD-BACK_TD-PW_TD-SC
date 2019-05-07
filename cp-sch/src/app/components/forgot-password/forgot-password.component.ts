import { VarService } from './../../service/var.service';
import { Component, OnInit, ElementRef, Inject } from '@angular/core';
import { DataService } from '../../service/service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http } from '@angular/http';
// import { FormGroup, Validators, FormControl } from '@angular/forms';

import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ConnectionService } from 'ng-connection-service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  newPassword: any;
  confirmPassword: any;
  token: any;
  email: any;

  myForm: any;
  
 
  params: any ={} ;

  status = 'ONLINE';
  isConnected = true;

  constructor(private serviceCtrl: DataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: Http,
    private element: ElementRef,
    private connectionService: ConnectionService,
    private formBuilder: FormBuilder,
    public varCtrl: VarService,
    @Inject('baseURL') private baseURL: string,
    @Inject('picUrl') private picUrl: string) {

      this.varCtrl.isSideBar = false;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = false;

    this.connectionCheck();
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.token= params.token;
      this.email =params.email;
    });

  }


  connectionCheck() {

    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = "ONLINE";
        this.router.navigate(['forgot']);
  
      }
      else {
        this.status = "OFFLINE";
        this.router.navigate(['badconnection']);
  
      }
    })
  }

  ngOnInit() {

    

  }


  
  

  updatePassword() {
    console.log(localStorage.getItem('userToken'));
    console.log(this.token);
    console.log(this.email);
    console.log(this.newPassword)

    if(this.newPassword == this.confirmPassword){
      var body ={token:this.token,email: this.email,newPassword:this.newPassword}
      console.log(body,'body')

      this.serviceCtrl.updatePassword(body).subscribe((data) => {

        if (data["status"]) {
          console.log(data['data']);
          this.serviceCtrl.success("Password updated successfully!");
          this.router.navigate(['login'])
        } else {
          this.serviceCtrl.error(data['message']);
        }
      });
    }else{
      this.serviceCtrl.error("Confirm password did not matched!");
    }
    
  }
}
