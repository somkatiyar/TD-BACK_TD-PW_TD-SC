import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-panel-inventory-detail',
  templateUrl: './panel-inventory-detail.page.html',
  styleUrls: ['./panel-inventory-detail.page.scss'],
})
export class PanelInventoryDetailPage implements OnInit {


  loginDetail: any;
  panelInventoryList: any;
  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    this.getPanelInventoryDetail();
  }



  getPanelInventoryDetail() {
   
    const request = `/GetPaneltInventoryByCustomer?ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {
 
      if (result != null) {
        this.panelInventoryList = result;
        console.log(this.panelInventoryList,'defgjgedfjg')
      }

    });
  }

}
