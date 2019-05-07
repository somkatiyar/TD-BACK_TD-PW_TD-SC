import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { DataService } from '../service/data.service';
import{ Validators, FormBuilder, FormGroup, FormControl }from'@angular/forms';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePasswordPage implements OnInit {
  loginDetail: any;


  constructor(public myModel: ModalController,
    public toastController: ToastController,
    private dataService: DataService) { }


    

  ngOnInit() {

    this.loginDetail = JSON.parse(localStorage.getItem('loginDetail'));

  }

  async toastMsg(value:string) {
    const toast = await this.toastController.create({
      message: value,
      duration: 2000,
      position: 'top',
    });
    toast.present();
  }





  changePassword(form) {
 console.log(form.value)
    const request = `/ChangePassword?CustomerId=${this.loginDetail.CustomerID}&Email=${this.loginDetail.EMailAddress}&CurrentPassword=${form.value.currentPass}&NewPassword=${form.value.newPass}&CompanyID=${this.loginDetail.CompanyID}`;
    this.dataService.getCall(request).subscribe(result => {
 
    if(form.value.newPass ===form.value.reTypeNewPass) {

      if (result != -1 ) {
      
        this.toastMsg('Password Changed Successfully..!');
       } else {
        this.toastMsg('Password doed not Changed..!');
       } 
    } else {
      this.toastMsg('Password and Re-Type Password doed not match..!');
    }
    
    
    

    });
  }

  onModelDismiss(form) {
    console.log(form.value,'popup')
   let data =  this.myModel.dismiss({
   data:form

   });

}

}
