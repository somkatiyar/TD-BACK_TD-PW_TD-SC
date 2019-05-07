import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-current-sign-up-detail',
  templateUrl: './current-sign-up-detail.page.html',
  styleUrls: ['./current-sign-up-detail.page.scss'],
})
export class CurrentSignUpDetailPage implements OnInit {
  loginDetail: any;
  currentSignUpList: any;
  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    this.currentSignUp();
  }



  currentSignUp() {
   
    const request = `/MyPosts?ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {
 
      if (result != null) {
        this.currentSignUpList = result;
        console.log(this.currentSignUpList,'defgjgedfjg')
      }

    });
  }

}
