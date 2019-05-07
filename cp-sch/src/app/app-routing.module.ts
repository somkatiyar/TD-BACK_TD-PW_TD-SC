import { PaypalComponent } from './components/paypal/paypal.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { EditDriverComponent } from './components/edit-driver/edit-driver.component';
import { AddDriverComponent } from './components/add-driver/add-driver.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RegisterComponent } from './components/register/register.component';
import { PaymentHistoryComponent } from './components/payment-history/payment-history.component';
import { DriverManagementComponent } from './components/driver-management/driver-management.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';


import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { DemoComponent } from './components/demo/demo.component';
import { HeaderComponent } from './header/header.component';
import { AuthGaurdService } from './service/auth-gaurd.service'; 
import { BadConnectionComponent } from './components/bad-connection/bad-connection.component';
// import { BadConnectionComponent } from './components/bad-connection/bad-connection.component';
const routes: Routes = [
  // canActivate: [AuthGuard]
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent ,canActivate : [AuthGaurdService] },
  { path: 'profile', component: ProfileComponent ,canActivate : [AuthGaurdService] },
  { path: 'add-driver', component: AddDriverComponent,canActivate : [AuthGaurdService]  },
  { path: 'edit-driver/:id', component: EditDriverComponent,canActivate : [AuthGaurdService]  },
  { path: 'edit-driver', component: EditDriverComponent ,canActivate : [AuthGaurdService] },
  { path: 'driver-management', component: DriverManagementComponent,canActivate : [AuthGaurdService]  },
  { path: 'appointment', component: AppointmentComponent ,canActivate : [AuthGaurdService] },
  { path: 'forgot', component: ForgotPasswordComponent},
  { path: 'paypal', component: PaypalComponent },
  { path: 'payment-history', component: PaymentHistoryComponent ,canActivate : [AuthGaurdService] },
  { path: 'header', component: HeaderComponent ,canActivate : [AuthGaurdService] },
  { path: 'demo', component: DemoComponent ,canActivate : [AuthGaurdService] },
  { path: 'badconnection', component: BadConnectionComponent ,canActivate : [AuthGaurdService] },

];

@NgModule({
  imports: [ CommonModule, RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
  declarations: []
})
export class AppRoutingModule { }
