// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthGaurdService {

//   constructor() { }
// }


import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGaurdService implements CanActivate {

  constructor(private router: Router){}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot):  boolean {


      if (localStorage.getItem('userToken') != null)
 
      return true;
      this.router.navigate(['login']);
      localStorage.removeItem('userToken');
      localStorage.removeItem('schoolId');
      localStorage.removeItem('schoolUserId');
      return false;
      
  }
}
