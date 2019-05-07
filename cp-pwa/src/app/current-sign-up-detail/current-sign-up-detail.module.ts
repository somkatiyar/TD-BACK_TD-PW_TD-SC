import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CurrentSignUpDetailPage } from './current-sign-up-detail.page';

const routes: Routes = [
  {
    path: '',
    component: CurrentSignUpDetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CurrentSignUpDetailPage]
})
export class CurrentSignUpDetailPageModule {}
