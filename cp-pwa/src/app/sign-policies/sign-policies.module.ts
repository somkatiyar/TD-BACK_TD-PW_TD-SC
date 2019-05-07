import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SignPoliciesPage } from './sign-policies.page';

const routes: Routes = [
  {
    path: '',
    component: SignPoliciesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SignPoliciesPage]
})
export class SignPoliciesPageModule {}
