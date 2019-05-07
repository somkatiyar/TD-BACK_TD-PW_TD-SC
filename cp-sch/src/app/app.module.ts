import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';



import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DriverManagementComponent } from './components/driver-management/driver-management.component';
import { PaymentHistoryComponent } from './components/payment-history/payment-history.component';
import { DemoComponent } from './components/demo/demo.component';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { VarService } from './service/var.service';
import { DataService } from './service/service';


import { SidebarModule } from 'ng-sidebar';
import { RegisterComponent } from './components/register/register.component';
import { AgmCoreModule } from '@agm/core';
import { NgxPaginationModule} from 'ngx-pagination';
import { ProfileComponent } from './components/profile/profile.component';
import { AddDriverComponent } from './components/add-driver/add-driver.component';
import { EditDriverComponent } from './components/edit-driver/edit-driver.component';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { BsDatepickerModule } from 'ngx-bootstrap';
import { Ng5SliderModule } from 'ng5-slider';
import { DatePipe } from '@angular/common';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { PaypalComponent } from './components/paypal/paypal.component';
import { AgmSnazzyInfoWindowModule } from '@agm/snazzy-info-window';
import { BadConnectionComponent } from './components/bad-connection/bad-connection.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ConfirmEqualValidatorDirective } from './components/confirm-equal-validator';
import { LottieAnimationViewModule } from 'ng-lottie';

// import { BadConnectionComponent } from './components/bad-connection/bad-connection.component';


// final prod
const baseURL ='https://lurnr-api1.trignodev.net/api/v1/'
const picUrl ='https://lurnr-api1.trignodev.net/public/'



// new production
// const baseURL ='https://builds.trignodev.net:9010/api/v1/'
// const picUrl ='https://builds.trignodev.net:9010/public/' 



// const picUrl = 'http://192.168.16.9:3000/public/';
// const baseURL = 'http://192.168.16.9:3000/api/v1/';

// production url
// const baseURL = 'https://api.lurnr.co/api/v1/'
// const picUrl = 'https://api.lurnr.co/public' 

// const picUrl = 'http://122.160.147.18:9001/public/';
// const baseURL = 'http://122.160.147.18:9001/api/v1/';

import {HttpClient, HttpClientModule} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    LoginComponent,
    DashboardComponent,
 
    DriverManagementComponent,
 
    PaymentHistoryComponent,

    DemoComponent,

    RegisterComponent,
    ProfileComponent,
    AddDriverComponent,
    EditDriverComponent,
    AppointmentComponent,
    ForgotPasswordComponent,
    PaypalComponent,
    BadConnectionComponent,
    LoadingComponent,
    ConfirmEqualValidatorDirective
  ],
  
  
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    Ng5SliderModule,
    HttpModule,
    SidebarModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    BsDatepickerModule.forRoot(),
    Ng4LoadingSpinnerModule,
    LottieAnimationViewModule.forRoot(),
    NgxPaginationModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyC7c71fViNSKkLI2YOj0k8oxZEDvUYbzOY',
      libraries: ['places']
    }),
    AgmSnazzyInfoWindowModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [DataService,VarService,DatePipe,
    { provide: 'picUrl', useValue: picUrl },
    { provide: 'baseURL', useValue: baseURL },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
