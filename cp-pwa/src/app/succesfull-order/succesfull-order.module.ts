import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SuccesfullOrderPage } from './succesfull-order.page';

const routes: Routes = [
  {
    path: '',
    component: SuccesfullOrderPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SuccesfullOrderPage]
})
export class SuccesfullOrderPageModule {}
