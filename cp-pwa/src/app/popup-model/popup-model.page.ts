import { Component, OnInit } from '@angular/core';
import { ModalController, NavController, NavParams, } from '@ionic/angular';
import { ViewController } from '@ionic/core';



@Component({
  selector: 'app-popup-model',
  templateUrl: './popup-model.page.html',
  styleUrls: ['./popup-model.page.scss'],
})
export class PopupModelPage implements OnInit {

  states: any = [
    {
      name:'CT  '
    },
    {
      name: 'MA',
    
    },
    {
      name: ' RI'
    
    }

  ]

  constructor(public myModel: ModalController,
    ) { }

  ngOnInit() {
  }





  onModelDismiss(form) {
   let data =  this.myModel.dismiss({
   data:form

   });

}
}
