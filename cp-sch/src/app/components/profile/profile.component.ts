import { VarService } from './../../service/var.service';
import { Component, OnInit, ElementRef, Inject } from '@angular/core';
import { DataService } from '../../service/service';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { ConnectionService } from 'ng-connection-service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  schoolId: any;
  schoolName: any;
  taxId: any;
  contactPersonEmail: any;
  contactPersonMobileNumber: any;
  contactPersonName: any;
  facebookLink: any;
  InstagramLink: any;
  googleLink: any;
  twitterLink: any;
  countryCode: any;

  profileData: any = [];

  email: any;
  mobileNumber: any;
  password: any;



  //Address field
  country: any = "";
  state: any = "";
  city: any = "";
  isAutomatic: any = "";
  vehicleTypeId: any = "";
  countries: any = [];
  states: any = [];
  cities: any = [];
  countryList: any = [];
  stateList: any = [];
  cityList: any = [];
  addressLineOne: any;
  addressLineTwo: any;


  pincode: any;

  lat: any;
  long: any;
  addressOf: any;
  addressId: any;
  details: any = {
  };

  // Bank Detail
  bankName: any;
  accountNumber: any;
  IFSCCode: any;
  branchName: any;
  bankDetailId: any;
  status = 'ONLINE';
  isConnected = true;
  //user var
  userId: any;
  confirmPassword: any;

  constructor(private translateService: TranslateService,
    private myservice: DataService,
    private router: Router,
    private connectionService: ConnectionService,
   
    @Inject('picUrl') public picUrl: string,
    public varCtrl: VarService,
    private http: Http) {
    this.connectionCheck();
    this.varCtrl.isSideBar = true;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = true;

  }

  connectionCheck() {

    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = "ONLINE";
        this.router.navigate(['profile']);

      }
      else {
        this.status = "OFFLINE";
        this.router.navigate(['badconnection']);

      }
    })
  }



  getStates() {

    this.myservice.states().subscribe((data) => {
      if (data["status"]) {
        let temp = [];
        temp = data['data'];

        let x = temp.filter(ob => ob.isArchived == false)
        temp = x;
        this.states = temp;
        // localStorage.setItem('states', JSON.stringify(data['data']));
      }
    });

  }

  getCities() {

    this.myservice.cities().subscribe((data) => {
      if (data["status"]) {
        let temp = [];
        temp = data['data'];

        let x = temp.filter(ob => ob.isArchived == false)
        temp = x;
        this.cities = temp;
        // localStorage.setItem('cities',JSON.stringify(data['data']));
      }
    });

  }

  omit_special_char(event)
  {   
     var k;  
     k = event.charCode;  //         k = event.keyCode;  (Both can be used)
     return((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57)); 
  }

  charOnly(event): boolean {
    console.log(event);
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
          return true;
        }
        return false;
    
  }


  getContries() {

    this.myservice.countries().subscribe((data) => {
      if (data["status"]) {
        let temp = [];
        temp = data['data'];

        let x = temp.filter(ob => ob.isArchived == false)
        temp = x;
        this.countryList = temp;
        // localStorage.setItem('countries', JSON.stringify(data['data']));
      }
    });

  }






  setUpFormForAddress() {
    this.stateList = this.states.filter(x => x.parent == this.country);
    let tempState = this.state;
    this.state = "";
    this.state = tempState;
    tempState = null;
    this.cityList = this.cities.filter(x => x.parent == this.state);
    let tempCity = this.city;
    this.city = "";
    this.city = tempCity;
    tempCity = null;
  }


  findState() {

    this.state = "";
    let x = this.countryList.filter(ob => ob.value == this.country)

    this.countryCode = x[0].countryCode;
    console.log(this.countryCode, 'this.countries')

    this.stateList = this.states.filter(x => x.parent == this.country);


  }

  findCity() {
    console.log(this.cities,'llll')
    this.city = "";
    this.cityList = this.cities.filter(x => x.parent == this.state);

  }


  ngOnInit() {
    this.translateService.get('header.profile').subscribe(
      value => {
        this.varCtrl.title = value;
      }
    )


    this.getCities();
    this.getContries();
    this.getStates();

    this.myservice.profile({ token: localStorage.getItem('userToken') }).subscribe((data) => {


      if (data["status"]) {

        this.profileData = data['data'];

        console.log(data);
        this.schoolId = data['data'] ? data['data'].school._id : "";
        this.schoolName = data['data'].school ? data['data'].school.schoolName : "";
        this.taxId = data['data'].school ? data['data'].school.taxId : "";
        this.contactPersonEmail = data['data'].school ? data['data'].school.contactPersonEmail : "";
        this.contactPersonMobileNumber = data['data'].school ? data['data'].school.contactPersonMobileNumber : "";
        this.contactPersonName = data['data'].school ? data['data'].school.contactPersonName : "";
        this.email = data['data'].user ? data['data'].user.email : "";
        this.mobileNumber = data['data'].user ? data['data'].user.mobileNumber : "";
        this.password = data['data'].user.password ? data['data'].user.password : "";
        this.confirmPassword = data['data'].user.password ? data['data'].user.password : "";
        this.facebookLink = data['data'].school ? data['data'].school.facebookLink : "";
        this.InstagramLink = data['data'].school.InstagramLink;
        this.googleLink = data['data'].school.googleLink;
        this.twitterLink = data['data'].school.twitterLink
        this.bankName = data['data'].school.bankDetail ? data['data'].school.bankDetail.bankName : "";
        this.accountNumber = data['data'].school.bankDetail ? data['data'].school.bankDetail.accountNumber : "";
        this.IFSCCode = data['data'].school.bankDetail ? data['data'].school.bankDetail.IFSCCode : "";
        this.branchName = data['data'].school.bankDetail ? data['data'].school.bankDetail.branchName : "";
        this.bankDetailId = data['data'].school.bankDetail ? data['data'].school.bankDetail._id : "";


        this.userId = (data['data'].user ? data['data'].user._id : "");

        this.country = (data['data'].user['addresses'][0].country ? data['data'].user['addresses'][0].country : "");

        this.addressId = (data['data'].user['addresses'][0]._id ? data['data'].user['addresses'][0]._id : "");




        this.state = (data['data'].user['addresses'][0].state ? data['data'].user['addresses'][0].state : "");

        this.city = (data['data'].user['addresses'][0].city ? data['data'].user['addresses'][0].city : ""),
          this.setUpFormForAddress();
        this.pincode = (data['data'].user['addresses'][0].pincode ? data['data'].user['addresses'][0].pincode : ""),
          this.addressLineOne = (data['data'].user['addresses'][0].addressLineOne ? data['data'].user['addresses'][0].addressLineOne : ""),
          this.addressLineTwo = (data['data'].user['addresses'][0].addressLineTwo ? data['data'].user['addresses'][0].addressLineTwo : "");

        
        // this.myservice.success("Profile Data");


      } else {
        this.myservice.error(data['message']);
      }
    });


  }

  onSubmit() {


    this.details['school'] = {
      schoolId: this.schoolId,
      schoolName: this.schoolName,
      taxId: this.taxId,
      contactPersonMobileNumber: this.contactPersonMobileNumber,
      contactPersonEmail: this.contactPersonEmail,
      contactPersonName: this.contactPersonName,
      facebookLink: "",
      InstagramLink: "",
      googleLink: "",
      twitterLink: ""

    }

    this.details['user'] = {
      token: localStorage.getItem('userToken'),

      email: this.email,
      mobileNumber: this.mobileNumber,
      password: this.password,

      userId: this.userId
    }
    this.details['address'] = {
      addressOf: "SCHOOL_USER",

      addressLineOne: this.addressLineOne,
      addressLineTwo: this.addressLineTwo,
      city: this.city,
      state: this.state,
      pincode: this.pincode,
      country: this.country,
      lat: "",
      long: "",
      addressId: this.addressId
    }

    this.details['bankDetail'] = {
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      IFSCCode: this.IFSCCode,
      branchName: this.branchName,
      bankDetailId: this.bankDetailId
    }
    this.myservice.schoolUpdate(this.details).subscribe((data) => {

      if (data["status"]) {

        this.myservice.success(data['message'])

        console.log('data after update', data);
      } else {
        this.myservice.error(data['message'])
      }

    });
  }


  numberOnly(event): boolean {
    console.log(event);
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }



}
