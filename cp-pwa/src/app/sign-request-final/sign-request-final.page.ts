import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-sign-request-final',
  templateUrl: './sign-request-final.page.html',
  styleUrls: ['./sign-request-final.page.scss'],
})
export class SignRequestFinalPage implements OnInit {
  loginDetail: any;
  profileDetail: any;
  item: any;
  oldPostFullDetail: any;
  transactionData: any;
  btnTitle: any = "Next"
  isReadonly: boolean = false;
  constructor(private route: ActivatedRoute,
  private router: Router,
  private dataService: DataService) { }

  ngOnInit() {
    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    this.profileDetail = JSON.parse(localStorage.getItem('profileDetail'));
    console.log(this.loginDetail,'login')
    console.log(this.profileDetail,'profile')
    this.route.queryParams.subscribe(params => {
      if (params && params.transactionData && params.item) {
        this.transactionData = JSON.parse(params.transactionData);
        this.item = JSON.parse(params.item);
        this.getOldPostFullDetail();
      }
      if ( params && params.orderFormData  && params.transactiondata) {
       this.oldPostFullDetail = JSON.parse(params.orderFormData);
       this.transactionData = JSON.parse(params.transactiondata);
       console.log(this.oldPostFullDetail,'formdata')
       console.log(this.transactionData ,'transaction')
      }
      
    });

 

  }


  getOldPostFullDetail() {
    const request = `/GetOldPostFullDetails?LocationID=${this.item.LocationID}&ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {

      if (result != null) {
        this.oldPostFullDetail = result;
        console.log(this.oldPostFullDetail,'reeeee')
      }

    });
  }







  formCheckForSubmit() {

    if(this.btnTitle == "Next") {
      console.log(this.btnTitle)
      this.isReadonly = true;
      this.btnTitle = "Submit";
      
    } else {
      this.isReadonly = true; 
      this.submitOrderForm();
    }
  }

  enableField() {
    this.isReadonly = false;
    this.btnTitle = "Next";
  }


  submitOrderForm() {
  let finalRequestjson =  {
      "CustomerID":this.loginDetail.CustomerID,
      "CompanyID":this.loginDetail.CompanyID,
      "TransactionCode":this.transactionData[0].ID,
      "OfficeName":this.profileDetail.OfficeName,
      "SiteNumber":this.oldPostFullDetail[0].HOName,
      "SiteStreet":this.oldPostFullDetail[0].SiteStreet,
      "SiteCity":this.oldPostFullDetail[0].SiteCity,
      "SiteState":this.oldPostFullDetail[0].SiteState,
      "SitePostalCode":"",
      "ColorAndStyle":this.oldPostFullDetail[0].ColorAndStyle,
      "HOName":this.oldPostFullDetail[0].ColorAndStyle,
      "RiderInformation":this.oldPostFullDetail[0].RiderInformation,
      "RiderInformation2":this.oldPostFullDetail[0].RiderInformation2,
      "RiderInformation3":this.oldPostFullDetail[0].RiderInformation3,
      "SignPhoneNumber":this.profileDetail.PhoneNumber,
      "Directions":"",
      "SpecialDirections":"",
      "SignGoesWhere":"",
      "MapCordinates":"",
      "OtherUtilities":"",
      "GetOrderImages":this.oldPostFullDetail[0].GetOrderImages,
      "TransactionType":this.transactionData[0].Transaction_Code,
      "panelID":"1875",
      "PersonName":this.profileDetail.Contact,
      "EmailID":this.profileDetail.EMailAddress,
      "SendCopy1":"",
      "SendCopy2":"",
      "SendCopy3":"",
      "LocationID":"0",
      "Action":"Up",
    }



    this.dataService.insertOredrForm(finalRequestjson).subscribe(result =>{
  
      if(result!=null) {
        const navigationExtras: NavigationExtras = {
          queryParams: {
            transactionId: JSON.stringify(result)
          }
        };
        this.router.navigate(['succesfull-order'], navigationExtras);

      }

    })
  
  }
  




}
