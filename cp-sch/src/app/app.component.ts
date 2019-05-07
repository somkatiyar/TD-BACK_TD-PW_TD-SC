import { Component } from '@angular/core';
import { VarService } from './service/var.service';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(public varCtrl: VarService,updates: SwUpdate){
    updates.available.subscribe(event => {

      //this.update = true;
      updates.activateUpdate().then(() => document.location.reload());

    })
  }
}








 

