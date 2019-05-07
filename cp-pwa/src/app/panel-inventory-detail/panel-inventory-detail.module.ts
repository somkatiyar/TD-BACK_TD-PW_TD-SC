import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PanelInventoryDetailPage } from './panel-inventory-detail.page';

const routes: Routes = [
  {
    path: '',
    component: PanelInventoryDetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PanelInventoryDetailPage]
})
export class PanelInventoryDetailPageModule {}
