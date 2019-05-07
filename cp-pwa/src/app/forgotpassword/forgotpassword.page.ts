import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.page.html',
  styleUrls: ['./forgotpassword.page.scss'],
})
export class ForgotpasswordPage implements OnInit {

  constructor(private dataservice: DataService) { }

  ngOnInit() {
  }


  forgotPassword(form) {
    let request = `/sendForgotpasswordEmail?email=${form.value.email}`;
    this.dataservice.getCall(request).subscribe(result =>{
      console.log(result)
    })

  }

  goBack() {
    window.history.back();
  }
}
