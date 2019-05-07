import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-pending-orders',
  templateUrl: './pending-orders.page.html',
  styleUrls: ['./pending-orders.page.scss'],
})
export class PendingOrdersPage implements OnInit {


  loginDetail: any;
  pendingOrderList: any;
  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    this.getPendingOrders();
  }


  getPendingOrders() {
   
    const request = `/PendingOrders?ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {
 
      if (result != null) {
        this.pendingOrderList = result;
        console.log(this.pendingOrderList,'defgjgedfjg')
      }

    });
  }


}
