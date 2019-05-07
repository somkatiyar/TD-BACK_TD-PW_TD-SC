import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { GetMyOldPostPage } from './get-my-old-post.page';

const routes: Routes = [
  {
    path: '',
    component: GetMyOldPostPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [GetMyOldPostPage]
})
export class GetMyOldPostPageModule {}
