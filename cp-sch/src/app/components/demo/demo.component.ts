import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent implements OnInit {


arr: any = [1,2,3,4,5,6,7,8,9];

  constructor() { }

  ngOnInit() {
  }

}
