import { Component, OnInit,ViewEncapsulation  } from '@angular/core';
import { VarService } from '../service/var.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  // encapsulation: ViewEncapsulation.None,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {


  constructor(
    public varCtrl: VarService,
    public router: Router,
    public translate: TranslateService,
  ) {    
       translate.addLangs(['en', 'fr']);
       translate.setDefaultLang('en');

  const browserLang = translate.getBrowserLang();
  translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
 
}


  ngOnInit() {
  }
  
  private _toggleSidebar() {
    this.varCtrl._opened = !this.varCtrl._opened;
  
    console.log("_opened", this.varCtrl._opened);
  }

}