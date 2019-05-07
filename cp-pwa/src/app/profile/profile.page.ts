import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';
import { ModalController } from '@ionic/angular';
import { ChangePasswordPage } from '../change-password/change-password.page';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  loginDetail: any;
  profileData: any;
  constructor(private dataService: DataService,private myModel: ModalController,) { }

  ngOnInit() {
    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    console.log(this.loginDetail)
    this.getPrfofileDetail();
  }

  getPrfofileDetail() {
    const request = `/DashboardCustomerProfile?ClientEmail=${this.loginDetail.EMailAddress}&ClientID=${this.loginDetail.CustomerID}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {
 
      if (result != null) {
        this.profileData = result;
        localStorage.setItem('profileDetail', JSON.stringify(result));
      }

    });
  }

  async changePasswordModel() {
    const modal = await this.myModel.create({
      component: ChangePasswordPage,
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

  }

}
