import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SignRquestOrderFormPage } from './sign-rquest-order-form.page';

const routes: Routes = [
  {
    path: '',
    component: SignRquestOrderFormPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SignRquestOrderFormPage]
})
export class SignRquestOrderFormPageModule {}
