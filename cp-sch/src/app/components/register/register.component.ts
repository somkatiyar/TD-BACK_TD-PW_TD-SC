import { VarService } from './../../service/var.service';
import { Component, OnInit, ViewChild, ElementRef, NgZone, } from '@angular/core';
import { DataService } from '../../service/service';
import { Route, Router, ActivatedRoute } from '@angular/router';


import { ConnectionService } from 'ng-connection-service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {



  //connection variable


  password: any;
  email: any;
  mobileNumber: any;
  facebookLink: any;
  InstagramLink: any;
  googleLink: any;
  twitterLink: any;


  //Address field
  name: any;
  addressLineOne: any;
  addressLineTwo: any;
  city: any= '';
  state: any ='';
  pincode: any;
  country: any ='';
  lat: any;
  long: any;
  addressOf: any;
  details: any = {
  };

  // Bank Detail
  bankName: any;
  accountNumber: any;
  IFSCCode: any;
  branchName: any;
  countryCode : any;


  userData = [];

  countries: any = [

  ]

  states: any = [

  ]

  cities: any = [

  ]

  countryList: any = [

  ]

  stateList: any = [

  ]

  cityList: any = [

  ]

  search: any;
  myForm: any;  
  countryValue: any;
  statevalue: any;
  status = 'ONLINE';
  isConnected = true;
  confirmPassword : any;
  show: any;
  public e: any;
  constructor(
    private serviceCtrl: DataService,
    private router: Router,
    private varCtrl: VarService,
    private connectionService: ConnectionService,

  ) {
    this.varCtrl.isSideBar = false;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = false;

      this.connectionCheck();
       

  }

  goBack() {
    window.history.go();
  }

  showHidePass() {

    this.show = !this.show;
  }
  connectionCheck() {

    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = "ONLINE";
        this.router.navigate(['signup']);
  
      }
      else {
        this.status = "OFFLINE";
        this.router.navigate(['badconnection']);
  
      }
    })
  }

  ngOnInit() {
    
    this.getContries();
    this.getStates();
    this.getCities();
   
    // let countries = localStorage.getItem('countries');
    // this.countries = JSON.parse(countries);
    // this.countryList = this.countries;
    // let states = localStorage.getItem('states');
    // this.states = JSON.parse(states);
    // let cities = localStorage.getItem('cities');
    // this.cities = JSON.parse(cities);
   
  }

  omit_special_char(event)
  {   
     var k;  
     k = event.charCode;  //         k = event.keyCode;  (Both can be used)
     return((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57)); 
  }
  

  numberOnly(event): boolean {
    console.log(event);
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
          return false;
        }
        return true;
    
  }
  findState() {
  
    this.state = "";
    let x = this.countryList.filter(ob => ob.value == this.country)
    console.log(x,'x value')
    this.countryCode = x[0].countryCode;
    console.log(this.countryCode,'this.countries')


    this.stateList = this.states.filter(x => x.parent== this.country);
 
 
  }

  findCity() {
    this.city = "";
    this.cityList = this.cities.filter(x => x.parent == this.state);
 
  }


  getStates() {

    this.serviceCtrl.states().subscribe((data) => {
      if (data["status"]) {
        let temp = [];
        temp = data['data'];

        let x = temp.filter(ob=>ob.isArchived == false)
        temp = x;
        this.states = temp;
        // localStorage.setItem('states', JSON.stringify(data['data']));
      }
    });

  }

  getCities() {

    this.serviceCtrl.cities().subscribe((data) => {
      if (data["status"]) {
        let temp = [];
        temp = data['data'];

        let x = temp.filter(ob=>ob.isArchived == false)
        temp = x;
        this.cities = temp;
        // localStorage.setItem('cities',JSON.stringify(data['data']));
      }
    });

  }



  getContries() {

    this.serviceCtrl.countries().subscribe((data) => {
      if (data["status"]) {
        let temp = [];
        temp = data['data'];

        let x = temp.filter(ob=>ob.isArchived == false)
        temp = x;
        this.countryList = temp;
        // localStorage.setItem('countries', JSON.stringify(data['data']));
      }
    });

  }
 
  



  charOnly(event): boolean {
    console.log(event);
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
          return true;
        }
        return false;
    
  }

  onSubmit() {

    this.details['user'] = {
      userType: "PORTAL_USER",
      userRole: "SCHOOL_USER",
      email: this.email,
      mobileNumber: this.mobileNumber,
      password: this.password,
      facebookLink: "",
      InstagramLink: "",
      googleLink: "",
      twitterLink: ""
    }
    this.details['address'] = {
      addressOf: "SCHOOL_USER",
      name: this.name,
      addressLineOne: this.addressLineOne,
      addressLineTwo: this.addressLineTwo,
      city: this.city,
      state: this.state,
      pincode: this.pincode,
      country: this.country,
      lat: this.lat,
      long: this.long,
      countryCode:this.countryCode

    }

    // this.details['bankDetail'] = {
    //   bankName: this.bankName,
    //   accountNumber: this.accountNumber,
    //   IFSCCode: this.IFSCCode,
    //   branchName: this.branchName
    // }
    this.serviceCtrl.signup(this.details).subscribe((data) => {


      if (data["status"]) {
        this.userData = data["data"];
        console.log(data);
        this.serviceCtrl.success(data['message']);
        setTimeout(()=>{
          this.router.navigate(['login'])
        }, 1000);
        this.router.navigate(['login'])

      } else {
        this.serviceCtrl.error(data['message']);
      }
    });
  }

}
