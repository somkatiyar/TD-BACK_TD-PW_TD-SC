import { VarService } from './../../service/var.service';
import { Component, OnInit, ElementRef, Inject, NgZone, OnDestroy } from '@angular/core';
import { DataService } from '../../service/service';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { MapsAPILoader } from '@agm/core';

import { Observable, Subject } from 'rxjs';
import { WebSocketSubject } from "rxjs/observable/dom/WebSocketSubject";
import { webSocket } from 'rxjs/webSocket';
import { retry, } from 'rxjs/operators';
import * as Rx from 'rxjs/Rx';

import { ConnectionService } from 'ng-connection-service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-driver-management',
  templateUrl: './driver-management.component.html',
  styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent implements OnInit {
  private socket;

  messages: Subject<any>;

  driverData: any = [];
  p: number = 1;
  mapView: boolean = false;
  normalView: boolean = true;
 
  lat: number =  28.5355 ;
  lng: number = 77.3910
  title: any = "no title";
  schoolId: any;
  imgUrl: any;

  grid: boolean = true;

  markers: any = [];
  status = 'ONLINE';
  isConnected = true;
  
   styles = [
    {
        "featureType": "administrative",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#444444"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#378b90"
            }
        ]
    },
    {
        "featureType": "administrative.neighborhood",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#31b9c1"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#f2f2f2"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "saturation": -100
            },
            {
                "lightness": 45
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#46bcec"
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#31b9c1"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#31b9c1"
            }
        ]
    }
];


  constructor(private element: ElementRef,
    private serviceCtrl: DataService,
    private router: Router,
    private translateService: TranslateService,
    private connectionService: ConnectionService,
    private varCtrl: VarService,
  
    @Inject('picUrl') public picUrl: string,
    ) {
      this.varCtrl.isSideBar = true;
      this.varCtrl.isHeader = true;
      this.varCtrl.isTitle = true;
      
      this.connectionCheck();
    
      // var host = "ws://lurnr-api2.trignodev.net/" + localStorage.getItem('schoolUserId');
    // var host = "ws://192.168.16.4:8081/" + localStorage.getItem('schoolUserId');
    var host = "ws://122.160.147.18:9002/" + localStorage.getItem('schoolUserId');
    // var host = "ws://api.lurnr.co:9002/" + localStorage.getItem('schoolUserId');
    // var host = "ws://builds.trignodev.net:9011/" + localStorage.getItem('schoolUserId');
    // https://builds.trignodev.net:9011/   //ws
    console.log(host,'host')

    this.socket = new WebSocketSubject(host);
    
   
  
    console.log(this.socket)

    this.socket = new WebSocket(host);

    this.socket.onmessage = (e) => {
      if(e && e.data){
        let cl = JSON.parse(e.data);
        if(cl && cl.data){
          let colleagueLocations = cl.data;
          console.log("colleagueLocations",colleagueLocations);
          
          for(let i=0; i<colleagueLocations.length; i++){
            this.markers.push({
              lat:colleagueLocations[i]['lat'],
              lng:colleagueLocations[i]['long'],
              firstName:(colleagueLocations[i]['user'] && colleagueLocations[i]['user']['firstName'] ? colleagueLocations[i]['user']['firstName'] : ""),
              lastName:(colleagueLocations[i]['user'] && colleagueLocations[i]['user']['lastName'] ? colleagueLocations[i]['user']['lastName'] : ""),
              title:(colleagueLocations[i]['user'] && colleagueLocations[i]['user']['email'] ? colleagueLocations[i]['user']['email'] : "")
            });
            if(i == colleagueLocations.length-1){
              
            }
          }

         
          console.log("marker value",this.markers);
        }
    
      }
    };

    
   
    this.socket.onopen = (e) => {
      // console.log(e, 'socket open :')
      setInterval(()=>{
        let message = {
          'to':localStorage.getItem('schoolUserId'),
          'from':'',
          'data':{
            'dataType': 'GET_MY_COLLEAGUE_LOCATION'
          }
        }
        console.log(message,'socket data')
        this.socket.send(JSON.stringify(message));
        console.log(e.data,"sent...");
      },5000);
    };

    this.socket.onclose = (e) => {

      console.log(e, 'socket close :')
    };

    this.socket.onerror = (e) => {

      console.log(e, 'socket error :')
    };


  }

  isVerified(item) {

    if (item.isArchived == true) {
      return "Enable";
    }
    return "Disable";
  }

  setClass(item) {

    if (item.isArchived == true) {
      return "enableBtn";
    }
    return "disableBtn";
  }


  disableItem(name, item) {
    let body ={};

  console.log(item._id,'kk')
    body = { driverId: item._id, token: localStorage.getItem('userToken'),
    schoolId:localStorage.getItem('schoolId')}

    this.serviceCtrl
      .disableSchoolDriver(body)
      .subscribe(res => {
        if (res["status"]) {
          if (name == "aprove") {
            item.documents[0].isVerified = "1";
            item.documents[1].isVerified = "1";
          } else {
            if (item.isArchived) {
              item.isArchived = false;
            } else {
              item.isArchived = true;
            }
          }
         this.serviceCtrl.success(res['message'])

        } else {
          console.log("user inserted");

        }
      }, err => {
      });
  }



  connectionCheck() {

    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = "ONLINE";
        this.router.navigate(['driver-management']);
  
      }
      else {
        this.status = "OFFLINE";
        this.router.navigate(['badconnection']);
  
      }
    })
  }


  ngOnDestroy() {
   
  }
  ngOnInit() {

    this.translateService.get('header.driverManagement').subscribe(
      value => {
        this.varCtrl.title = value;
      }
    )
    

    this.mapLoad();
    this.serviceCtrl.drivers({ 
     token: localStorage.getItem('userToken'),
     schoolId: localStorage.getItem('schoolId'),
     type: "SCHOOL"
     })
      .subscribe((data) => {
        if (data["status"]) {
          this.driverData = data['data'];
      
 
        } else {
          this.serviceCtrl.error(data['message']);
        }
      });


  }




  clickedMarker(label: string, index: number) {
    // alert("dshnjcfky");
  }


  viewChangNormal() {
    this.mapView = false;
    this.normalView = true;
  }

  viewChangmap() {
    this.mapView = true;
    this.normalView = false;
  }

  errorHandler(e) {
    console.log(e);
    e.target.src = 'assets/images/userPlaceholder.png';
  }



  goToUpdatePage(id) {
    this.router.navigate(['/edit-driver', id]);
  }

  gotoAddDriver() {
    this.router.navigate(['/add-driver']);
  }

  mapLoad() {}

}
interface marker {

  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
  title: string;
  firstName : string;
  lastName : string;
}

