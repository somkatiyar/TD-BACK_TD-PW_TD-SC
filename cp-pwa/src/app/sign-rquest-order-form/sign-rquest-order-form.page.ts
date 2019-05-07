import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { DataService } from '../service/data.service';
import { NavController } from '@ionic/angular';


@Component({
  selector: 'app-sign-rquest-order-form',
  templateUrl: './sign-rquest-order-form.page.html',
  styleUrls: ['./sign-rquest-order-form.page.scss'],
})
export class SignRquestOrderFormPage implements OnInit {
  innerList = false;

  public insideView = [
    { val: 'With Rider(Post Up with Rider) ', id: 'Rider', isChecked: false },
    { val: 'With BB (Post Up with Brochure Box)', id: 'BB', isChecked: false },
    { val: 'With PL (Post Up with Post Light)', id: 'PL', isChecked: false }
  ];


  item: any;
  loginDetail: any;
  radioItemList: any = [];

  finalObject: any;

  list: any;
  constructor(private router: Router,
    private dataService: DataService,
    public navCtrl: NavController) { }

  ngOnInit() {

    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    this.getTransctionCode();
  }


  getTransctionCode() {
    const request = `/GetTransactionCodes?ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {

      if (result != null) {
        console.log(result);
        this.list = result;
        this.radioItemList = result.filter(item => item.ID == 1 || item.ID == 2 || item.ID == 4 || item.ID == 5 || item.ID == 6 || item.ID == 7 || item.ID == 9);

      }

    });
  }

  radioChecked(value) {

    if (value.Transaction_Code == 'Up') {
      this.innerList = true;

      this.finalObject = this.radioItemList.filter(item => item.Transaction_Code == 'Up');


    } else if (value.Transaction_Code == 'Down') {
      this.innerList = false;
      this.finalObject = this.radioItemList.filter(item => item.Transaction_Code == 'Down');
    } else if (value.Transaction_Code == 'Fix') {
      this.innerList = false;
      this.finalObject = this.radioItemList.filter(item => item.Transaction_Code == 'Fix');
    } else if (value.Transaction_Code == 'Move') {
      this.innerList = false;
      this.finalObject = this.radioItemList.filter(item => item.Transaction_Code == 'Move');
    } else if (value.Transaction_Code == 'Rein') {
      this.innerList = false;
      this.finalObject = this.radioItemList.filter(item => item.Transaction_Code == 'Rein');
    } else if (value.Transaction_Code == 'Add') {
      this.innerList = false;
      this.finalObject = this.radioItemList.filter(item => item.Transaction_Code == 'Add');
    } else if (value.Transaction_Code == 'SC') {
      this.innerList = false;
      this.finalObject = this.radioItemList.filter(item => item.Transaction_Code == 'SC');
    }

  }

  goToOrderForm() {


    console.log(this.finalObject[0].Transaction_Code);

    if (this.finalObject && this.finalObject[0].ID == '2' || this.finalObject[0].ID=='4' || 
    this.finalObject[0].ID=='5' || this.finalObject[0].ID=='6' || this.finalObject[0].ID=='7'
    || this.finalObject[0].ID=='9') {
      const navigationExtras: NavigationExtras = {
        queryParams: {
          transactionData: JSON.stringify(this.finalObject)
        }
      };
      this.router.navigate(['get-my-old-post'], navigationExtras);
    } else {
      const navigationExtras: NavigationExtras = {
        queryParams: {
          transactionData: JSON.stringify(this.finalObject)
        }
      };
      this.router.navigate(['order-form'], navigationExtras);
    }




  }

  selectBox( item) {
    console.log(item)
    item.isChecked = !item.isChecked;

    let codes = 'Up';
    let codes1 = 'UP';
    this.insideView.filter(item => item.isChecked).forEach(element => {

      codes += '+' + element.id;
      codes1 += '+' + element.id;
    });
   

    const id = this.list.filter(item => item.Transaction_Code == codes || item.Transaction_Code == codes1);


    this.finalObject = id;


  }



}
