import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit{

  value= 1;
  public appPages = [
    {
      title: 'Profile',
      url: '/profile',
      icon: 'contact'
    },

    {
      title: 'Sign Request Order Form',
      url: '/sign-rquest-order-form'
    },
    {
      title: 'Current Sign Up',
      url: '/current-sign-up-detail'
    },
    {
      title: 'Panel Inventory',
      url: '/panel-inventory-detail'
    },
    {
      title: 'Pending Orders',
      url: '/pending-order'
    },
    {
      title: 'Sign Policies',
      url: '/sign-policies'
    }
  ];
ngOnInit() {

  if(!JSON.parse(localStorage.getItem('loginDetail'))) {

    this.router.navigateByUrl('login');
  }

}
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router
  ) {
    this.initializeApp();
  }

  async initializeApp() {

    await this.platform.ready();
    this.statusBar.styleDefault();
    this.splashScreen.hide();

 

  }
}
