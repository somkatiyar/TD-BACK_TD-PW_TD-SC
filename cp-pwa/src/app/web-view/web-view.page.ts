import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { InAppBrowser, InAppBrowserEvent} from '@ionic-native/in-app-browser/ngx';

declare var cordova;


@Component({
  selector: 'app-web-view',
  templateUrl: './web-view.page.html',
  styleUrls: ['./web-view.page.scss'],
})

export class WebViewPage implements OnInit {

  options = {
    email: 'test@email.com',
    item_id: 1234,
    reference: 1234,
    item_descr: 'description',
    item_quant: 1,
    item_valor: 50 * 100
  };



  browser: any;
  script: any;
  ref: any;
  constructor(private sanitize: DomSanitizer, private iab: InAppBrowser
  ) {
    this.initWebView()

  }

  ngOnInit() {

  }

  initWebView() {


 

  this.script = 'var form = document.createElement("form");';
  this.script += 'var url = "https://testurl.com";';
  this.script += 'form.method="post"';
  this.script += 'form.setAttribute("action",url);';
  for (var data in this.options) {
    this.script += 'var hiddenField = document.createElement("input");';
    this.script += 'hiddenField.setAttribute("type", "hidden");';
    this.script += 'hiddenField.setAttribute("name","' + data +'");';
    this.script += 'hiddenField.setAttribute("value","' + this.options[data] + '");';
    this.script += 'form.appendChild(hiddenField);';
  }
  this.script += 'document.body.appendChild(form)';
  this.script += 'form.submit();';
debugger
  const browser = this.iab.create('https://ionicframework.com/','_self');
  browser.on('loadstop').subscribe((data)=> {
    console.log(data)
  })
}




 loadStopCallBack() {

  if (this.ref != undefined) {


    this.ref.executeScript({ code: this.script
      });



      this.ref.show();
  }

}


 
}

