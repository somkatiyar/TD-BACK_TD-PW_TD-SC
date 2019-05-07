import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../service/data.service';


@Component({
  selector: 'app-succesfull-order',
  templateUrl: './succesfull-order.page.html',
  styleUrls: ['./succesfull-order.page.scss'],
})
export class SuccesfullOrderPage implements OnInit {
  url: any;
  transactionID: any;
  loginDetail: any;
  paymentDetail: any;
  constructor(private route: ActivatedRoute,
     private dataService: DataService,
     ) { 
    this.route.queryParams.subscribe(params => {
      if (params && params.transactionId) {
        this.transactionID = JSON.parse(params.transactionId);
        console.log(this.transactionID)
      }
   
    });
  }

  ngOnInit() {
    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    this.getPaymentDetail();
  }


  getPaymentDetail() {
    const request = `/PaymentDetails?TransactionID=${this.transactionID}&CustomerID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {

      if (result != null) {
        this.paymentDetail = result;
        console.log(this.paymentDetail,'reeeee')
      }

    });
  }


  // payment() {
  // let  request = {
  //   "LinkId" : "11e92aae-f49f-4111-99a0-617af20062d1",
  //  "url_finish" :"http://sugmt.com/Customers/OrderPaid"
  //   }

  //   this.dataService.payement(request).subscribe(result => {

  //     if (result != null) {
  //       this.paymentDetail = result;
  //       console.log(this.paymentDetail,'reeeee')
  //     }

  //   });

  // }

}
