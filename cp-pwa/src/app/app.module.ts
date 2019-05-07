import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { DataService } from './service/data.service';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HttpClientModule } from "@angular/common/http";
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { PopupModelPage } from './popup-model/popup-model.page';
import { ChangePasswordPage } from './change-password/change-password.page';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

const picUrl = "http://192.168.16.4:50263/api/SugarMountain/";
const baseURL = "http://192.168.16.4:82/api/SugarMountain";
@NgModule({
  declarations: [AppComponent,PopupModelPage,ChangePasswordPage],
  entryComponents: [PopupModelPage,ChangePasswordPage],
  imports: [
  FormsModule,
    BrowserModule,
    ReactiveFormsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    DataService,
    InAppBrowser,
    { provide: "picUrl", useValue: picUrl },
    { provide: "baseURL", useValue: baseURL },
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
