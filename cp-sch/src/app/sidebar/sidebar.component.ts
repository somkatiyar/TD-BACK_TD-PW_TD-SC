import { Router } from '@angular/router';
import { VarService } from './../service/var.service';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  tabActive: number;
  r: any;
  constructor(
    public varCtrl: VarService,
    public router: Router,
    public translate: TranslateService,
  ) {    
   }
 
  ngOnInit() {
  }

  clearUserType() {
    if(localStorage.getItem('userType')!=null) {
      localStorage.removeItem('userType')
    }
  }

  // logout(){
  //   this.varCtrl._opened = !this.varCtrl._opened;

  //   localStorage.removeItem('userToken');
  //   localStorage.removeItem('schoolId');
  //   localStorage.removeItem('schoolUserId');
  //   localStorage.removeItem('states');
  //   localStorage.removeItem('cities');
  //   localStorage.removeItem('countries');
  //   setTimeout(()=>{
  //     this.router.navigateByUrl('/login');
  //   },1000);
  // }





  logout(){
    this.translate.get('sidebar.logOutConfermation').subscribe(
      value => {
       
      this.r =  window.confirm(value)
      }
    )
    if(this.r == true) {
     
      localStorage.removeItem('userToken');
      localStorage.removeItem('schoolId');
      localStorage.removeItem('schoolUserId');
      localStorage.removeItem('states');
      localStorage.removeItem('cities');
      localStorage.removeItem('countries');
      this.varCtrl._opened = !this.varCtrl._opened;
      setTimeout(()=>{
        this.router.navigate(['login'])
      },1000);
    
    } else {
   return;
    }

  }





}
