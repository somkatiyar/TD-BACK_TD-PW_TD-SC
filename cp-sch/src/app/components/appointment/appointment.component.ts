import { VarService } from './../../service/var.service';

import { Component, OnInit, ElementRef, Inject, NgZone ,AfterViewInit} from '@angular/core';
import { DataService } from '../../service/service';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { MapsAPILoader, MarkerManager } from '@agm/core';
import { ConnectionService } from 'ng-connection-service';

import { AgmMap } from '@agm/core';
import { AgmSnazzyInfoWindow } from '@agm/snazzy-info-window';
import { ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css']
})



export class AppointmentComponent implements OnInit {

  driverData = [];
  selectedDriver: any = "";
  selectedDate: any =  new Date();
  allData: any;
  rideBookingData: any;

  schollID: any;
  cityName: string;
  stateName: string;
  addName: string;
  // address: any = "lucknow";
  fullAddress: string;
  status = 'ONLINE';
  isConnected = true;
  noData: any;
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





  constructor(
    private myservice: DataService,
    private router: Router,
    private translateService: TranslateService,
    private connectionService: ConnectionService,
 
    public varCtrl: VarService
  ) {
    this.varCtrl.isSideBar = true;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = true;
   
    this.connectionCheck();



    
   }


   ngOnInit() {

    this.translateService.get('header.apointment').subscribe(
        value => {
          this.varCtrl.title = value;
        }
      )

    this.getDriver();


  }




  connectionCheck() {

    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = "ONLINE";
        this.router.navigate(['appointment']);
  
      }
      else {
        this.status = "OFFLINE";
        this.router.navigate(['badconnection']);
  
      }
    })
  }
  getDriver() {

    this.myservice.drivers({ token: localStorage.getItem('userToken'),
     schoolId: localStorage.getItem('schoolId'),type: "SCHOOL"})
      .subscribe((data) => {

        if (data["status"]) {
          this.allData = data['data'];
          console.log(data);


          // this.myservice.success("Driver data search successfuly");
          for (var i = 0; i < data['data'].length; i++) {
            this.driverData.push(data['data'][i].userDetail[0]);

          }
          console.log(this.driverData, 'the driver name is');


        } else {
          this.myservice.error(data['message']);
        }
      });
  }
  onChange() {
    this.selectedDate.setHours(0.00);
    let ed = new Date(this.selectedDate)
    console.log(ed,"date ");
    if (this.selectedDate && this.selectedDriver) {

      this.myservice.driverRideBookings({ token: localStorage.getItem('userToken'),
       driverId: this.selectedDriver, 
       startDateTime: this.selectedDate 
    })
        .subscribe((data) => {

          if (data["status"]) {
          
            this.rideBookingData = data['data'];
            this.noData = false;
            if (!data['data']) {
                this.noData = true;
              this.myservice.error(data['message']);
            }
          } 
        });

    }else {
        this.translateService.get('toaster.selectDriverAndDate').subscribe(
            value => {
              this.myservice.success(value)
  
            }
          )
      this.myservice.error("Please select driver and date!")
      this.noData = true;
    }
  }


  getFullAddress(pickUpAddress) {

    let fullAddress = "";
    if(pickUpAddress && pickUpAddress.city && pickUpAddress.city.length){
      fullAddress = pickUpAddress.city+" " ;

      
    }

    if(pickUpAddress && pickUpAddress.state && pickUpAddress.state.length){
      fullAddress = fullAddress+pickUpAddress.state+ "";
    }
    if(pickUpAddress && pickUpAddress.country.name && pickUpAddress.country.length){
      fullAddress = fullAddress+pickUpAddress.country;
    }
    return fullAddress ? fullAddress: 'NA';

  }


  getNumber(val){
    return Number(val);
  }









}
