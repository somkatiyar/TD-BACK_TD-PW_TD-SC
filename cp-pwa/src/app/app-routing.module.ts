import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './home/home.module#HomePageModule'
  },
  {
    path: 'list',
    loadChildren: './list/list.module#ListPageModule'
  },
  { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
  { path: 'forgot-password', loadChildren: './forgotpassword/forgotpassword.module#ForgotpasswordPageModule' },
  { path: 'sign-rquest-order-form', loadChildren: './sign-rquest-order-form/sign-rquest-order-form.module#SignRquestOrderFormPageModule' },
  { path: 'profile', loadChildren: './profile/profile.module#ProfilePageModule' },
  { path: 'order-form', loadChildren: './order-form/order-form.module#OrderFormPageModule' },
  { path: 'popup-model', loadChildren: './popup-model/popup-model.module#PopupModelPageModule' },
  { path: 'sign-request-final', loadChildren: './sign-request-final/sign-request-final.module#SignRequestFinalPageModule' },
  { path: 'get-my-old-post', loadChildren: './get-my-old-post/get-my-old-post.module#GetMyOldPostPageModule' },
  { path: 'pending-order', loadChildren: './pending-orders/pending-orders.module#PendingOrdersPageModule' },
  { path: 'sign-policies', loadChildren: './sign-policies/sign-policies.module#SignPoliciesPageModule' },
  { path: 'panel-inventory-detail', loadChildren: './panel-inventory-detail/panel-inventory-detail.module#PanelInventoryDetailPageModule' },
  { path: 'current-sign-up-detail', loadChildren: './current-sign-up-detail/current-sign-up-detail.module#CurrentSignUpDetailPageModule' },
  { path: 'change-password', loadChildren: './change-password/change-password.module#ChangePasswordPageModule' },
  { path: 'succesfull-order', loadChildren: './succesfull-order/succesfull-order.module#SuccesfullOrderPageModule' },
  { path: 'web-view', loadChildren: './web-view/web-view.module#WebViewPageModule' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
