import { DataService } from './../../service/service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Http } from '@angular/http';
import { VarService } from '../../service/var.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Router } from '@angular/router';
import { ConnectionService } from 'ng-connection-service';
import { TranslateService } from '@ngx-translate/core';
declare var $: any;
declare var bodymovin : any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  @ViewChild('close') modalClose: ElementRef;

  details: any = {
    email: "",
    password: ""
  };
  userData: any = [];
  myForm: any;
  email: any;
  status = 'ONLINE';
  isConnected = true;


  constructor(private serviceCtrl: DataService,
    private router: Router,
    private connectionService: ConnectionService,
    private varCtrl: VarService,
    private translateService: TranslateService
   
  ) {

    this.varCtrl.isSideBar = false;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = false;
    this.checkConnection();
  }

  ngViewDidLoad() {

  }

  ngOnInit() {


    this.getContries();
    this.getStates();
    this.getCities();
     this.getGearType()
  
    this.myForm = new FormGroup({

      email: new FormControl("",Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ]) ),
      password: new FormControl("",Validators.compose([
        Validators.required,
      ])),
    })

  }















  show : any;
  showHidePass() {

    this.show = !this.show;
  }

  getStates() {

    this.serviceCtrl.states().subscribe((data) => {
      if (data["status"]) {
        localStorage.setItem('states', JSON.stringify(data['data']));
      }
    });

  }

  getCities() {

    this.serviceCtrl.cities().subscribe((data) => {
      if (data["status"]) {
        localStorage.setItem('cities',JSON.stringify(data['data']));
      }
    });

  }



  getContries() {

    this.serviceCtrl.countries().subscribe((data) => {
      if (data["status"]) {
        localStorage.setItem('countries', JSON.stringify(data['data']));
      }
    });

  }
  getGearType() {
    this.serviceCtrl.getGearType().subscribe((data) => {
      if (data["status"]) {
        localStorage.setItem('gearTypes', JSON.stringify(data['data']));
      }
    });
  }
  
login() {

  this.serviceCtrl.login(this.details).subscribe((data) => {


    if ( data["status"] ) {
      this.userData = data["data"];

      localStorage.setItem('userToken',data['data']['userDetail']['token']);
      localStorage.setItem('schoolId',data['data']['schoolDetail']['_id']);
      localStorage.setItem('schoolUserId',data['data']['userDetail']['_id']);
      localStorage.removeItem("schoolCountry");
      localStorage.setItem('schoolCountry',this.userData['userDetail']['addresses'][0]['country']);
      localStorage.setItem('schoolState',this.userData['userDetail']['addresses'][0]['state']);
      localStorage.setItem('schoolCity',this.userData['userDetail']['addresses'][0]['city']);
     
      this.translateService.get('toaster.loginsuccess').subscribe(
        value => {
          this.serviceCtrl.success(value)

        }
      )
   
      this.closeModal();
      setTimeout(()=>{
        this.router.navigateByUrl('/dashboard');
      }, 1000);
    } else {
      this.serviceCtrl.error(data['message']);
    }
  });
}

closeModal(){
  let el: HTMLElement = this.modalClose.nativeElement as HTMLElement;
  el.click();
}

forgotPassword() {
  this.serviceCtrl.forgotPassword({email:this.email}).subscribe((data) => {
    console.log(data);
    if ( data["status"] ) {
      $('#forgot').modal('toggle');
      this.serviceCtrl.success(data['message']);
    } else {
      this.serviceCtrl.error(data['message']);
    }
  });
}

closeLoginModal(){
  $('#loginModal').modal('toggle');
  this.router.navigateByUrl('/signup');
}

checkConnection() {
  this.connectionService.monitor().subscribe(isConnected => {
    this.isConnected = isConnected;
    if (this.isConnected) {
      this.status = "ONLINE";
      this.router.navigate(['login']);

    }else {
      this.status = "OFFLINE";
      this.router.navigateByUrl('/badconnection');
    }
  })
}

forgotModal(){
  setTimeout(()=>{
    $('#forgot').modal('toggle');
  },1000);
}




}



