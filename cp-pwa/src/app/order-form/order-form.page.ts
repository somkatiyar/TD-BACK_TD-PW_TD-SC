import { Component, OnInit, Input } from '@angular/core';
import { ModalController, NavController, AlertController } from '@ionic/angular';
import { PopupModelPage } from '../popup-model/popup-model.page';
import { DataService } from '../service/data.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.page.html',
  styleUrls: ['./order-form.page.scss'],
})
export class OrderFormPage implements OnInit {
  @Input() value: number;
  address: any;
  loginDetail: any;
  panelList: any;
  profileDetail: any;
  transactiondata: any;
  formAddress: any;

  underGoesitemValue: any;
  riderTextBox = false;
  isDisableNextbtn: boolean = true;

  public underGoesItems: any =  [
    {id : 'none', val: 'None', isChecked: true },
    {id : 'sprinkler_system', val: 'Sprinkler System', isChecked: false },
    {id : 'dog_fence', val: 'Dog Fence', isChecked: false }
  ];


  constructor(private myModel: ModalController,
              private dataService: DataService,
              private route: ActivatedRoute,
               public alertController: AlertController,
               public router: Router
  ) {
    this.route.queryParams.subscribe(params => {
      if (params && params.transactionData) {
        this.transactiondata = JSON.parse(params.transactionData);
        console.log(this.transactiondata, 'transcode')
        if (this.transactiondata[0].ID == 11) {

          this.riderTextBox = true;
        }


      }
    });
  }



  ngOnInit() {

    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));

    this.profileDetail = JSON.parse(localStorage.getItem('profileDetail'));
    console.log(this.profileDetail, this.loginDetail, 'aaa');
    this.getPanel();
  }

  async openAddressModel() {
    const modal = await this.myModel.create({
      component: PopupModelPage,
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    this.formAddress = data.data['value'];

    console.log(data.data['value'], 'address data');

    if (data.data.dirty) {

      this.address = 'House Number:' + data.data['value'].houseNumber + ',' +
      'Street Number:' + data.data['value'].streetNumber + ',' +
      'City:' + data.data['value'].city + ',' +
      'State:' + data.data['value'].state

console.log(this.address)
    } else {
      this.address = '';
    }

  }



  getPanel() {
    const request = `/GetPaneltInventoryByCustomer?ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {
      if (result != null) {

        console.log(result);
        this.panelList = result;


      }

    });
  }


  selectUnderGroundObject(item) {

 
    if (item.id == 'none') {
      this.underGoesItems.filter(e => e.id != 'none').forEach(element => {
        element.isChecked = false;

      });

    }
    if (item.id != 'none') {
      this.openAlert();
      this.underGoesItems.filter(e => e.id == 'none').forEach(element => {
        element.isChecked = false;

      });
    }

     let str = ""
     let count =0;
      this.underGoesItems.filter(e => e.isChecked).forEach(element => {
       if(count >0) {
        str += "," + element.val ;
       } else {
        str += element.id ;
       }
    
       this.underGoesitemValue = str;
        count++;


      });

    


  }

  termAndCondiationCheck(event) {
    
      if (event.detail.checked) {
        this.isDisableNextbtn = false;
        console.log(this.isDisableNextbtn)
      } else {
        this.isDisableNextbtn = true;
        console.log(this.isDisableNextbtn)
      }

  }


  async openAlert() {
    const alert = await this.alertController.create({
      message: 'Underground objects require that the location be marked by a Sugar Mountain flag.',
      buttons: ['OK'],
      cssClass: 'danger',
    });
    await alert.present();
  }

  submit(form) {

    console.log(this.underGoesItems,'undergoes')
  let  requestJson = [{

    
	'HOName': this.formAddress.houseNumber,
	'SiteStreet': this.formAddress.streetNumber,
	'SiteCity': this.formAddress.city,
	'SiteState': this.formAddress.state,
  'uderGroundObject':this.underGoesitemValue,
	'ColorAndStyle': this.formAddress.color,
	'RiderInformation': form.value.RiderInformation,
	'RiderInformation2': form.value.RiderInformation1,
	'RiderInformation3': form.value.RiderInformation2,

	'Directions': form.value.direction,

	'EmailOrderImages': form.value.getOrderPicture,

  'Panel': form.value.panel,


   }];

   const navigationExtras: NavigationExtras = {
    queryParams: {
      orderFormData: JSON.stringify(requestJson),
      transactiondata: JSON.stringify(this.transactiondata)
    }
    
  };
  this.router.navigate(['sign-request-final'], navigationExtras);


  }


}

