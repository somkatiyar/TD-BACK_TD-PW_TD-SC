import { VarService } from './../../service/var.service';
import { Component, OnInit, ElementRef, Inject, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm } from "@angular/forms";
import { DataService } from '../../service/service';
import { Router, ActivatedRoute } from '@angular/router';
import { MapsAPILoader } from '@agm/core';
import { ConnectionService } from 'ng-connection-service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-driver',
  templateUrl: './add-driver.component.html',
  styleUrls: ['./add-driver.component.css']
})
export class AddDriverComponent implements OnInit {
  @ViewChild('f') public myForm: NgForm;
  // validation flag

  badgevalid: boolean = false;
  licenseValid: boolean = false;
  buddyValid: boolean = false;


  schoolId: any;
  documentTypes: any = [];
  driverId: any;
  fileType: any;

  countryCode: any;

  firstName: any;
  lastName: any;
  email: any;
  mobileNumber: any;
  password: any;
  adiOrPdiBadgeNumber: any;
  drivingLicense: any;
  details: any = {};

  //address variable
  name: any;
  addressLineOne: any;
  addressLineTwo: any;
  city: any = '';
  state: any = '';
  pincode: any;
  country: any = '';
  lat: any;
  long: any;


  //car variable
  registrationNumber: any;
  chassisNumber: any;
  color: any;
  vehicleTypeId: any = "";
  isAutomatic: any = "";


  files: Array<File> = [];

  file: File;

  fileCount = 0; docType
  image: any;

  isProfile: boolean = false;

  vTypes: any = [];

  companions: any = [];
  searchText: any;
  buddyData: any = {};
  final: any = [];
  imageBuddy: any;

  fileData: any = [];

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
  gearTypes: any = [];
  gearTypeList: any = [];
  countryValue: any;
  stateValue: any;
  cityValue: any;
  registerForm: FormGroup;
  submitted = false;
  status = 'ONLINE';
  isConnected = true;
  dlName: any;
  bedgeName: any;

  badgeData: any;
  licenseData: any;

  isDl: boolean = false;
  isBadge: boolean = false;
  badgeUpload: any;
  licenseUpload: any;

  confirmPassword: any;
  documents: any[] = [];

  profileStatus: boolean = false;
  docstatus: boolean = false;
  constructor(private element: ElementRef,
    private serviceCtrl: DataService,
    private router: Router,
    private translateService: TranslateService,
    private loader: Ng4LoadingSpinnerService,
    private connectionService: ConnectionService,
    public varCtrl: VarService,
    @Inject('picUrl') public picUrl: string) {

    this.varCtrl.isSideBar = true;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = true;


  }
  connectionCheck() {

    this.connectionService.monitor().subscribe(isConnected => {

      this.isConnected = isConnected;

      if (this.isConnected) {
        this.status = "ONLINE";

        this.router.navigate(['add-driver']);

      }
      else {
        this.status = "OFFLINE";

        this.router.navigate(['badconnection']);

      }
    })
  }

  goBack() {

    window.history.back();
  }


  ngOnInit() {

    this.translateService.get('header.addDriver').subscribe(
      value => {
        console.log(value, '120o')
        this.varCtrl.title = value;
      }
    )


    let countries = localStorage.getItem('schoolCountry')
    console.log(localStorage.getItem('schoolCountry'), 'kkk')
    this.countries = JSON.parse(countries);
    console.log(this.countries, 'jjjjgj')
    this.country = this.countries[0].name
    this.countryCode = this.countries[0].countryCode;
    this.countryValue = this.countries[0].value;




    let states = localStorage.getItem('schoolState');
    this.states = JSON.parse(states);
    this.state = this.states[0].name
    this.stateValue = this.states[0].value;


    let cities = localStorage.getItem('schoolCity');
    this.cities = JSON.parse(cities);
    this.city = this.cities[0].name;
    this.cityValue = this.cities[0].value;





    this.loader.hide();
    this.connectionCheck();
    this.vehicleTypes();

    let gearType = localStorage.getItem('gearTypes');
    this.gearTypes = JSON.parse(gearType);
    this.gearTypeList = this.gearTypes;
    console.log(this.gearTypeList, 'geartype list')



  }


  // uploadFile() {
  //   let formData = new FormData();
  //   formData.append('id', this.driverId);
  //   formData.append('fileType', "DRIVER_DOCS");

  //   let files = {
  //     data: this.documents
  //   }
  //   console.log(this.fileData,'mnb');
  //   console.log(this.files,'files')
  //   formData.append("files", JSON.stringify(files));
  //   this.serviceCtrl.upload(formData).subscribe((data) => {
  //     if (data["status"]) {


  //     }
  //   });

  // }

  // uploadProfile() {


  //   let formData = new FormData();
  //   formData.append('id', this.driverId);
  //   formData.append('fileType', "PROFILE_PICTURE");
  //   let files = {
  //     data: this.fileData
  //   }

  //   formData.append("files", JSON.stringify(files));

  //   this.serviceCtrl.upload(formData).subscribe((data) => {
  //     if (data["status"]) {


  //     }
  //   });

  // }
  omit_special_char(event) {
    var k;
    k = event.charCode;  //         k = event.keyCode;  (Both can be used)
    return ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
  }

  charOnly(event): boolean {
    console.log(event);
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return true;
    }
    return false;

  }


  addDocument(event, docType) {
    var reader: any;
    reader = new FileReader();
    reader.onload = (e => {
      var data = reader.result.split(',')[1];
      let index = this.documents.findIndex(el => el.documentType == docType);
      if (index > -1) {
        this.documents[index]['data'] = data;
        this.documents[index]['name'] = event.target.files[0].name;
        this.documents[index]['view'] = reader.result;
      } else {
        this.documents.push({
          "data": data,
          "documentType": docType,
          "resourceType": "IMAGE",
          "name": event.target.files[0].name,
          "view": reader.result
        });
      }
    });
    reader.readAsDataURL(event.target.files[0]);
  }

  removeDocument(docType) {
    let index = this.documents.findIndex(el => el.documentType == docType);
    if (index > -1) {
      this.documents.splice(index, 1);
    }
  }






  addProfilePicture(event, docType) {
    var reader = new FileReader();

    reader.onload = (e => {
      var src: any;
      src = reader.result;
      this.image = src;
      this.isProfile = true;
      var data = src.split(',')[1];
      // this.fileData.push({ "data": data, 
      // "documentType": docType, 
      // "resourceType": "IMAGE" });

      this.fileData.push({
        "data": [{
          "data": data, "documentType": "",
          "fileType": "PROFILE_PICTURE",
          "resourceType": "IMAGE"
        }]
      })
      console.log(this.fileData)
    });
    reader.readAsDataURL(event.target.files[0]);
  }




  onSubmit() {



    // let isProfile = (( this.fileData && this.fileData.length && this.fileData.findIndex(el=>el.documentType == 'PROFILE_PICTURE') > -1 ) ? true : false);
    let isDocDriverLicence = ((this.documents && this.documents.length && this.documents.findIndex(el => el.documentType == 'DRIVING_LICENSE') > -1) ? true : false);
    let isDocBadgeNumber = ((this.documents && this.documents.length && this.documents.findIndex(el => el.documentType == 'BADGE_NUMBER') > -1) ? true : false);
    // let isBuddies = (( this.companions && this.companions.length) ? true : false);

    if (!this.isProfile) {
      this.translateService.get('toaster.chooseProfile').subscribe(
        value => {
          this.serviceCtrl.success(value)

        }
      )
    } else if (!isDocBadgeNumber) {
      this.translateService.get('toaster.uploadBadge').subscribe(
        value => {
          this.serviceCtrl.success(value)

        }
      )
    } else if (!isDocDriverLicence) {
      this.translateService.get('toaster.uploadDriving').subscribe(
        value => {
          this.serviceCtrl.success(value)

        }
      )
    } else {
      this.driverCreate();
    }


  }

  resetForm() {

    this.myForm.resetForm({

      cityName: this.cities[0].name,
      stateName: this.states[0].name,
      countryName: this.countries[0].name,

    });

  }


  driverCreate() {

    console.log(this.schoolId);
    this.details = {
      token: localStorage.getItem('userToken'),
      schoolId: localStorage.getItem('schoolId'),
      firstName: this.firstName,

      lastName: this.lastName,
      email: this.email,
      password: this.password,
      adiOrPdiBadgeNumber: this.adiOrPdiBadgeNumber,

      userType: "DRIVER",
      userRole: "APP_USER",
      drivingLicense: this.drivingLicense,
      mobileNumber: this.mobileNumber,
    }
    this.details['companions'] =
      this.companions;

    this.details['address'] = {
      name: this.name,
      addressLineOne: this.addressLineOne,
      addressLineTwo: this.addressLineTwo,
      city: this.cityValue,
      state: this.stateValue,
      pincode: this.pincode,
      country: this.countryValue,
      lat: this.lat,
      long: this.long,
      addressOf: "APP_DRIVER",
      countryCode: this.countryCode
    }
    this.details['carInfo'] = {
      registrationNumber: this.registrationNumber,
      chassisNumber: this.chassisNumber,
      vehicleTypeId: this.vehicleTypeId,
      color: this.color,
      gearType: this.isAutomatic


    }


    var d = {
      "data": { "data": this.fileData[0]["data"][0]["data"] }, "documentType": "",
      "fileType": "PROFILE_PICTURE",
      "resourceType": "IMAGE"
    }
    this.details['files'] = {
      data: [d, this.documents[0], this.documents[1]]
    }

    this.serviceCtrl.driverCreate(this.details).subscribe((data) => {

      if (data["status"]) {
        console.log("user inserted");
        this.driverId = data['driverId']


        this.serviceCtrl.success(data['message']);
        this.resetForm();
        // this.myForm.resetForm();


        this.isAutomatic = "";
        this.vehicleTypeId = "";
        this.image = null;
        this.documents = [];
        this.companions = [];



      } else {
        this.serviceCtrl.error(data['message']);
      }

    });
  }


  vehicleTypes() {

    this.serviceCtrl.vehicleTypes({}).subscribe((data) => {

      if (data["status"]) {
        for (var i = 0; i < data['data'].length; i++) {
          this.vTypes.push(data['data'][i].name);
        }
        console.log(this.vTypes);
      } else {

      }

    });
  }



  searchCompanions(txt) {

    this.serviceCtrl.companions({ searchText: txt }).subscribe((data) => {

      if (data["status"]) {
        this.final = data['data']
        console.log(this.final, 'campanion data');
      } else {

      }

    });
  }

  addBuddies(id) {

    if (this.companions.length < 5) {
      this.buddyData = this.final.find(item => item._id === id);
      console.log(this.buddyData)
      if (this.companions.find(item => item._id === id)) {

        this.translateService.get('toaster.buddyAlReadyAdded').subscribe(
          value => {
            this.serviceCtrl.success(value)

          }
        )

        this.buddyValid = true;
      }
      else {
        this.companions.push(this.buddyData);

        this.buddyValid = true;

        this.translateService.get('toaster.addbuddy').subscribe(
          value => {
            this.serviceCtrl.success(value)

          }
        )
      }

    } else {
      this.buddyValid = true;
      this.translateService.get('toaster.buddyLimit').subscribe(
        value => {
          this.serviceCtrl.success(value)

        }
      )

    }
  }

  errorHandler(e) {
    console.log(e);
    e.target.src = 'assets/images/userPlaceholder.png';
  }
  errorHandlerDoc(e) {
    console.log(e);
    e.target.src = 'assets/images/docImage.jpeg';
  }



  removeBuddies(id) {


    let item = this.final.find(item => item._id === id);
    let x = this.companions.indexOf(item);
    if (x > -1) {
      this.badgevalid = false;
      this.companions.splice(x, 1);

    }


    this.translateService.get('toaster.buddyRemove').subscribe(
      value => {
        this.serviceCtrl.success(value)

      }
    )

  }




  removeDrivingLicense() {
    if (this.licenseData && this.licenseData.length > 0) {
      this.licenseData.splice(0, 1);
      this.licenseValid = false;
    }

    this.serviceCtrl.success('License File Removed Successfully')
    console.log(this.licenseData, 'licenseData');

  }
  removeBadge() {
    if (this.badgeData && this.badgeData.length > 0) {
      this.badgeData.splice(0, 1);
      this.badgevalid = false;
    }
    this.serviceCtrl.success('Badge File Removed Successfully')
    console.log(this.badgeData, 'badgedata');
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
