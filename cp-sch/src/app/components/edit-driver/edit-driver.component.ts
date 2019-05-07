import { VarService } from './../../service/var.service';
import { Component, OnInit, ElementRef, Inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup} from "@angular/forms";
import { DataService } from '../../service/service';
import { Router, ActivatedRoute } from '@angular/router';
import { MapsAPILoader } from '@agm/core';
import { ConnectionService } from 'ng-connection-service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-driver',
  templateUrl: './edit-driver.component.html',
  styleUrls: ['./edit-driver.component.css']
})
export class EditDriverComponent implements OnInit {
  
  confirmPassword : any;
  documents: any[] = [];
  dlName: any;
  bedgeName: any;
  badgeData: any = [];
  licenseData: any = [];
  isDl: boolean = false;
  isBadge: boolean = false;
  badgeUpload: any;
  licenseUpload: any;

  driverId: any;
  singleDriverData =[];


  countryCode : any;
  stateValue : any;
  cityValue : any;
  firstName: any;
  lastName: any;
  email: any;
  mobileNumber: any;
  password: any;
  adiOrPdiBadgeNumber: any;
  drivingLicense: any;
  profilePictureUrl: any;
  details: any = {};

  //address variable
  name: any;
  addressLineOne: any;
  addressLineTwo: any;
  city: any ='';
  state: any ='';
  pincode: any;
  country: any= '';
  addressId: any;


  buddyName: any;
  //car variable
  registrationNumber: any;
  chassisNumber: any;
  color: any;
  vehicleTypeId: any ='';
  isAutomatic: any= '';
  carInfoId: any;



  files: Array<File> = [];

  file: File;

  fileCount = 0;
  image: any;
  
  isProfile: boolean = false;

  vTypes: any = [];

  companions: any = [];
  searchText: any;
  buddyData: any = {};
  final: any = [];
  imageBuddy: any;
  lat: any;
  long: any;
  contryValue: any;

  documentTypes: any = [];

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
  gearTypes : any = [];
  gearTypeList : any = [];
  fileData: any =[];
  statevalue: any;
  countryValue: any;
  campanionData: any;

  flag: boolean =true;
  status = 'ONLINE';
  isConnected = true;
  dlUrl : any;
  badgeUrl : any;
  docDetail : any = [];
  profileStatus : boolean = false;
  docStatus : boolean = false;
  constructor(private element: ElementRef,
    private serviceCtrl: DataService,
    private router: Router,
    private translateService:TranslateService,
    private activatedRoute: ActivatedRoute,
    private connectionService: ConnectionService,
    public varCtrl: VarService,
    @Inject('picUrl') public picUrl: string) {
       this.varCtrl.isSideBar = true;
      this.varCtrl.isHeader = true;
      this.varCtrl.isTitle = true;
  

    this.driverId = this.activatedRoute.snapshot.params['id'];
    
    this.connectionCheck();
  
  }
  connectionCheck() {
 
    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = "ONLINE";
        this.router.navigate(['edit-driver']);
  
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

    this.translateService.get('header.updateDriver').subscribe(
      value => {
        this.varCtrl.title = value;
      }
    )


    let countries = localStorage.getItem('schoolCountry');
    console.log(countries,'vvv')
    this.countries= JSON.parse(countries);
    this.country = this.countries[0].name
      this.countryCode = this.countries[0].countryCode;
      this.countryValue = this.countries[0].value;
  
  
  
  
    let states = localStorage.getItem('schoolState');
    this.states= JSON.parse(states);
    this.state = this.states[0].name
    this.stateValue = this.states[0].value;
  
  
    let cities = localStorage.getItem('schoolCity');
    this.cities= JSON.parse(cities);
    this.city = this.cities[0].name;
    this.cityValue = this.cities[0].value;
   
   
   
   
    this.vehicleTypes();

    let gearType = localStorage.getItem('gearTypes');
    this.gearTypes = JSON.parse(gearType);
    this.gearTypeList = this.gearTypes;
    console.log(this.gearTypeList,'list')
 

    this.serviceCtrl.driverById({ driverId: this.driverId,
       token: localStorage.getItem('userToken') })

      .subscribe((data) => {


        if (data["status"]) {

          this.singleDriverData.push( data['data']);


          this.companions = data['data'].companions ? data['data'].companions : "";


          // this.buddyName = data['data'].companions[0].firstName;

          this.firstName = data['data'] ? data['data'].firstName : "";
          this.lastName = data['data'] ? data['data'].lastName : "";
          this.mobileNumber = data['data'] ? data['data'].mobileNumber : "";
          this.password = data['data'] ? data['data'].password : "";
          this.confirmPassword = data['data'] ? data['data'].password : "";
          this.email = data['data'] ? data['data'].email : "";
          this.adiOrPdiBadgeNumber = data['data'] ? data['data'].adiOrPdiBadgeNumber : "";
          this.drivingLicense =data['data'] ? data['data'].drivingLicense : "";
          this.profilePictureUrl = data['data'] ? data['data'].profilePictureUrl : "";


          this.addressId = data['data'].addresses ? data['data'].addresses[0]._id : "";

          this.name = data['data'].addresses ? data['data'].addresses[0].name : "";;
          this.addressLineOne = data['data'].addresses ? data['data'].addresses[0].addressLineOne : "";;
          this.addressLineTwo = data['data'].addresses ? data['data'].addresses[0].addressLineTwo : "";;
          // this.city = data['data'].addresses ? data['data'].addresses[0].city : "";;
  
          // this.state = data['data'].addresses ? data['data'].addresses[0].state : "";;
    
          this.pincode = data['data'].addresses ? data['data'].addresses[0].pincode : "";;
          // this.country = data['data'].addresses ? data['data'].addresses[0].country : "";;

          this.carInfoId = data['data'] ? data['data'].carInfo._id : "";
   
          this.registrationNumber = data['data'] ? data['data'].carInfo.registrationNumber : "";
          this.chassisNumber = data['data'] ? data['data'].carInfo.chassisNumber : "";
          this.vehicleTypeId = data['data'] ? data['data'].carInfo.vehicleTypeId : "";
          this.isAutomatic = data['data'] ? data['data'].carInfo.gearType  : "";
    
          this.color = data['data'] ? data['data'].carInfo.color : "";

          this.profilePictureUrl = (data['data'].profilePictureUrl ? data['data'].profilePictureUrl: "")


          let x = data['data']['documents'];

        if(data && data['data'] && data['data']['documents'] && data['data']['documents'].length){
          let documents = data['data']['documents'];
          for(let i=0; i < documents.length; i++){
            let docData = "";
       

              this.toDataUrl(this.picUrl+documents[i]['value'],(myBase64: any) => {
              // console.log(myBase64,'database64'); // myBase64 is the base64 string
              docData = myBase64;
              docData = myBase64.split(',')[1];
       
              this.documents.push({ 
                "data": docData, 
                "documentType": documents[i]['documentType']['name'], 
                "resourceType": "IMAGE", 
                "view": this.picUrl+documents[i]['value']
              });
             
            });
          
          
         
          }
        }
          
       
        } else {
          this.serviceCtrl.error("data not found");
        }
      });
  }


  errorHandler(e){
    console.log("event error img", e);
    e.target.src = "assets/images/userPlaceholder.png";
  }

  errorHandlerDoc(e){
    console.log("event error img", e);
    e.target.src = "assets/images/docImage.jpeg";
  }

  removeDocument(docType){
    let index = this.documents.findIndex(el=>el.documentType == docType);
    if(index > -1){
      this.documents.splice(index,1);
    }
    console.log('doc after remove',this.documents)
  }




  toDataUrl(url, callback) {
    
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      var reader : any;
         reader = new FileReader();
        reader.onloadend = function() {
          reader.result.split
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

      numberOnly(event): boolean {

        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
          return false;
        }
        return true;
    
      }
    
      findState() {
        this.stateList = this.states.filter(x=> x.parent == this.country);
      }
    
      findCity() {
        this.cityList = this.cities.filter(x=> x.parent == this.state);
      }

 

  vehicleTypes() {

    this.serviceCtrl.vehicleTypes({}).subscribe((data) => {

      if (data["status"]) {
        for (var i = 0; i < data['data'].length; i++) {
          this.vTypes.push(data['data'][i].name);
        }

      } else {

      }

    });
  }





  uploadFile() {
    let formData = new FormData();
    formData.append('id', this.driverId);
    formData.append('fileType', "DRIVER_DOCS");
    let files = {
    data: this.documents
    }
    console.log(this.documents,'doc in')
    formData.append("files", JSON.stringify(files));

    this.serviceCtrl.upload(formData).subscribe((data) => {
    
      if (data["status"]) {
   
      }
    });

  }




  addDocument(event, docType) {
    var reader : any;
     reader = new FileReader();
    reader.onload = (e => {
      var data = reader.result.split(',')[1];
      console.log(data,'from add docs')
      let index = this.documents.findIndex(el=> el.documentType == docType);
      if(index > -1){
        this.documents[index]['data'] = data;
        this.documents[index]['name'] = event.target.files[0].name;
        this.documents[index]['view'] = reader.result;
        console.log(this.documents);
      }else{
    

        this.documents.push({
          "data": data,
          "documentType": docType,
          "fileType": "DRIVER_DOCS",
          "resourceType": "IMAGE",
          "name": event.target.files[0].name,
          "view": reader.result
        });
        console.log(this.documents);
      }
    });
    reader.readAsDataURL(event.target.files[0]);
  }

  uploadProfile() {

   
    let formData = new FormData();
    formData.append('id', this.driverId);
    formData.append('fileType', "PROFILE_PICTURE");
    let files = {
      data: this.fileData
    }
    formData.append("files", JSON.stringify(files));

    this.serviceCtrl.upload(formData).subscribe((data) => {
      if (data["status"] || !data['status']) {
      
      
      }
    });

  }







  changeListner(event, docType) {
    
    this.isProfile = true;
    this.flag=false;
    var reader = new FileReader();
  
    reader.onload = (e => {
      var src : any;
       src = reader.result;
      this.image = src;
      var data = src.split(',')[1];
      this.fileData.push({
        "data": [{
          "data": data, "documentType": "",
          "fileType": "PROFILE_PICTURE",
          "resourceType": "IMAGE"
        }]
      })
    });

    
    reader.readAsDataURL(event.target.files[0]);
  }
  onSubmit() {


  
    console.log("DRIVING_LICENSE",this.documents.findIndex(el=>el.documentType == 'DRIVING_LICENSE'));
    console.log("BADGE_NUMBER",this.documents.findIndex(el=>el.documentType == 'BADGE_NUMBER'));
  
    // let isProfile = (( this.fileData && this.fileData.length && this.fileData.findIndex(el=>el.documentType == 'PROFILE_PICTURE') > -1 ) ? true : false);
    let isDocDriverLicence = (( this.documents && this.documents.length && this.documents.findIndex(el=>el.documentType == 'DRIVING_LICENSE') > -1 ) ? true : false);
    let isDocBadgeNumber = (( this.documents && this.documents.length && this.documents.findIndex(el=>el.documentType == 'BADGE_NUMBER') > -1 ) ? true : false);
    let isBuddies = (( this.companions && this.companions.length) ? true : false);
  
    if(!this.profilePictureUrl){
      this.translateService.get('toaster.chooseProfile').subscribe(
        value => {
          this.serviceCtrl.success(value)
         
        }
      )
    }else if(!isDocBadgeNumber){
      this.translateService.get('toaster.uploadBadge').subscribe(
        value => {
          this.serviceCtrl.success(value)
         
        }
      )
    }else if(!isDocDriverLicence){
      this.translateService.get('toaster.uploadDriving').subscribe(
        value => {
          this.serviceCtrl.success(value)
         
        }
      )
    }else{
      this.driverUpdate();
    }

            

    }











  driverUpdate() {

 
    this.details = {
      token: localStorage.getItem('userToken'),
      schoolId: localStorage.getItem('schoolId'),
      driverId: this.driverId,
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

    this.details['address'] = {
      addressId: this.addressId,
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
      countryCode : this.countryCode
    },
    this.details['companions'] = this.companions
 


    this.details['carInfo'] = {
      carInfoId: this.carInfoId,
      registrationNumber: this.registrationNumber,
      chassisNumber: this.chassisNumber,
      vehicleTypeId: this.vehicleTypeId,
      color: this.color,
      gearType: this.isAutomatic


    }

    if (this.isProfile) {
      this.details['files'] = {
        data: this.fileData[0]["data"]
      }
    } else {
      this.details['files'] = {
        data: new Array()
      }
    }


    this.serviceCtrl.driverUpdate(this.details).subscribe((data) => {

      if (data["status"]) {

        this.serviceCtrl.success(data['message'])
        // this.loader.show();
        // setTimeout(() => {

        //   this.router.navigate(['driver-management']);

        // }, 25000);
      } else {
        this.serviceCtrl.error('information not updated')
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




  searchCompanions(txt) {

    this.serviceCtrl.companions({ searchText: txt }).subscribe((data) => {

      if (data["status"]) {
        this.final = data['data']
 
      } else {

      }

    });
  }

  addBuddies(id) {

    if (this.companions.length < 5) {
      this.buddyData = this.final.find(item => item._id === id);
 
      if (this.companions.find(item => item._id === id)) {
        this.translateService.get('toaster.buddyAlReadyAdded').subscribe(
          value => {
            this.serviceCtrl.success(value)
           
          }
        )
      }
      else {
        this.companions.push(this.buddyData);
        this.translateService.get('toaster.addbuddy').subscribe(
          value => {
            this.serviceCtrl.success(value)
           
          }
        )
      
      }

    } else {
      this.translateService.get('toaster.buddyLimit').subscribe(
        value => {
          this.serviceCtrl.success(value)
         
        }
      )
    }
  
  
  }

  removeBuddies(id) {
   let index = this.companions.findIndex(x => x._id == id);
   if(index > -1) {
    this.companions.splice(index, 1);
  
   }
   this.translateService.get('toaster.buddyRemove').subscribe(
    value => {
      this.serviceCtrl.success(value)
     
    }
  )
  }
}
