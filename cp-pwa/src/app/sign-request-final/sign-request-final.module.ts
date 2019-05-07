import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SignRequestFinalPage } from './sign-request-final.page';

const routes: Routes = [
  {
    path: '',
    component: SignRequestFinalPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SignRequestFinalPage]
})
export class SignRequestFinalPageModule {}
