import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VarService {

  public isHeader:boolean = false;
  public isSideBar: boolean = false;
  public _opened: boolean = false;
  public isTitle: boolean = false;
  public title: string = "";
  
  public isLoading: boolean = false;

  constructor() {
    console.log(this.title,'title from service')
   }
}
