import { Component, OnInit, Inject } from '@angular/core';
import { DataService } from '../../service/service';
import { Router, ActivatedRoute } from '@angular/router';
import { ConnectionService } from 'ng-connection-service';
import { Http } from '@angular/http';
import { VarService } from '../../service/var.service';

@Component({
  selector: 'app-bad-connection',
  templateUrl: './bad-connection.component.html',
  styleUrls: ['./bad-connection.component.css']
})
export class BadConnectionComponent implements OnInit {
  public lottieConfig: Object;
  private anim: any;
  private animationSpeed: number = 1;

  constructor(

    private myservice: DataService,
    private router: Router,

    @Inject('picUrl') private picUrl: string,
    private connectionService: ConnectionService,

    private http: Http,
    public varCtrl: VarService
  ) {
    this.varCtrl.isSideBar = false;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = true;
    this.varCtrl.title = "Lurnr";



    this.lottieConfig = {
      path: 'assets/json/lottie.json',
      renderer: 'canvas',
      autoplay: true,
      loop: true
    };

  }

  ngOnInit() {
  }



  handleAnimation(anim: any) {
    this.anim = anim;
  }

  stop() {
    this.anim.stop();
  }

  play() {
    this.anim.play();
  }

  pause() {
    this.anim.pause();
  }

  setSpeed(speed: number) {
    this.animationSpeed = speed;
    this.anim.setSpeed(speed);
  }






}
