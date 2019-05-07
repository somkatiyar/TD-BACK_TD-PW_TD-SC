import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-get-my-old-post',
  templateUrl: './get-my-old-post.page.html',
  styleUrls: ['./get-my-old-post.page.scss'],
})
export class GetMyOldPostPage implements OnInit {

  constructor(private dataService: DataService, private router: Router, private route: ActivatedRoute) { }
  myOldPostList: any;
  finalObject: any;
  loginDetail: any;
  ngOnInit() {
    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    console.log(this.loginDetail)

    this.route.queryParams.subscribe(params => {
      if (params && params.transactionData) {
        this.finalObject = JSON.parse(params.transactionData);
        console.log(this.finalObject,'ll')
        this.getMyOldPost();
      }
    });


  }

  getMyOldPost() {
    const request = `/GetMyOldPost?TransactionType=${this.finalObject[0]['Transaction_Code']}&ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {

      if (result != null) {
        this.myOldPostList = result;
      }

    });
  }


  goToFinalSignPage(item) {
 
    const navigationExtras: NavigationExtras = {
      queryParams: {
        transactionData: JSON.stringify(this.finalObject),
        item:JSON.stringify(item)
        
      }
    };
      this.router.navigate(['sign-request-final'], navigationExtras);
  
  }

}
