import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../service/data.service';
import { ToastController} from '@ionic/angular';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  myForm: any;
  constructor(private datservice: DataService,
    private router: Router,   private loader: LoadingController,
    private toastCtrl: ToastController) {
 
     }



  ngOnInit() {
 
  }



  login(form) {
    console.log(form)
    let request = `/Login?Email=${form.value.Email}&Password=${form.value.Password}&Role=${'Customer'}`
    this.datservice.getCall(request).subscribe(result => {
      if (result != null) {
        this.loginSuccessToast();
        localStorage.setItem('loginDetail', JSON.stringify(result));

        setTimeout(()=>{
          this.router.navigateByUrl('home');
        }, 2500);
       
      } else {
        this.loginFailToast();
      }

    }, err => {
      console.log(err)
    });
    


  }


  async loginFailToast() {
    const toast = await this.toastCtrl.create({
      header: 'Login Fail',
      color:'danger',
      message: 'Please Provide Valid Crediantial.!',
      duration: 3000,
      position: 'top',
    });
    toast.present();
  }




  async loginSuccessToast() {
    const toast = await this.toastCtrl.create({
   color:'success',
      header: 'Login Success',
      message: 'Login SuccessFfully..!',
      duration: 2000,
      position: 'top',
    });
    toast.present();
  }


  goToForgotPassword() {
    this.router.navigateByUrl('forgot-password')
  }


  rememberMe(form) {
  }



}