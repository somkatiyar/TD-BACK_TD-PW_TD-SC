import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { VarService } from './../../service/var.service';
import { DataService } from '../../service/service';

import { Chart } from 'chart.js';

import * as currentWeekNumber from 'current-week-number';
import { ConnectionService } from 'ng-connection-service';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {






  constructor(
  
    private serviceCtrl: DataService,
    private router: Router,
    private varCtrl: VarService,
    private translateService: TranslateService,
    private connectionService: ConnectionService,
  ) { 
    this.varCtrl.isSideBar = true;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = true;
    
    this.connectionCheck();
    this.currentWeek = currentWeekNumber();
    this.currentMonth = new Date().getMonth();
    this.earning(1, "WEEK", 4);
    this.lesson(1, "WEEK", 4);



  }


  ngOnInit() {

    this.translateService.get('header.dashboard').subscribe(
      value => {
        console.log(value, '120o')
        this.varCtrl.title = value;
      }
    )
  }


  chart = [];
  totalEarn: any;
  totalLesson: any;
  dataOne: any = [];


  weekData: any = [];

  graphData: any = [];
  labels: any = ['0w','1w','2w','3w'];


  graphDataLesson: any = [0,0,0,0];
  labelsLesson: any = [];
  currentWeek: any;
  currentMonth: any;
  status = 'ONLINE';
  isConnected = true;

    connectionCheck() {
  
      this.connectionService.monitor().subscribe(isConnected => {
        this.isConnected = isConnected;
        if (this.isConnected) {
          this.status = "ONLINE";
          this.router.navigate(['dashboard']);
    
        }
        else {
          this.status = "OFFLINE";
          this.router.navigate(['badconnection']);
    
        }
      })
    }


  earning(months, type, weeks?: number) {
    console.log(localStorage.getItem('userToken'));
    this.graphData = [];
    this.labels = [];
    let body = {
      "token": localStorage.getItem('userToken'),
      "months": months,
      "type": type
    };

    this.serviceCtrl.totalEarning(body)
      .subscribe(res => {
        console.log("sample data is", res);
        if (res && res.status) {
          // total earning by school till now.
          this.totalEarn = res.total;
          // in case of success create data for graph
          // when type = WEEK
          if (type == "WEEK") {
            weeks = weeks + 1;
            for (let i = 0; i < weeks; i++) {
              let currentWeek = this.currentWeek - i;

              let index = res['data'].findIndex(x => x._id.week == currentWeek);
              if (index > -1) {
                this.graphData.push(res['data'][index].total);
                this.labels.push(i + "w");
              } else {
                this.graphData.push(0);
                this.labels.push(i + "w");
              }
              if (i == weeks - 1) {
                this.renderGraph(this.graphData, this.labels,'canvas');
              }
            }
          } else {
            let currentMonth = this.currentMonth + 1;
            months = months + 1;
            for (let i = 0; i < months; i++) {
              let cMonth = currentMonth - i;
              let index = res['data'].findIndex(x => x._id.month == cMonth);
              console.log(index, cMonth)
              if (index > -1) {
                this.graphData.push(res['data'][index].total);
                this.labels.push(i + "m");
              } else {
                this.graphData.push(0);
                this.labels.push(i + "m");
              }
              if (i == months - 1) {
                this.renderGraph(this.graphData.reverse(), this.labels, 'canvas');
              }
            }
          }
        } else {
       
          this.renderGraph('',this.labels, 'canvas');
          // this.serviceCtrl.error("No Earning data available right now..");
        }



      },err=>{
        console.log(err);
      });
  }





  lesson(months, type, weeks?: number) {
    this.graphDataLesson = [];
    this.labelsLesson = [];
    let body = {
      "token": localStorage.getItem('userToken'),
      "months": months,
      "type": type
    };

    this.serviceCtrl.totalLesson(body)
      .subscribe(res => {
        console.log("sample data....", res);
        if (res && res.status) {
          console.log(res,'mwbsk')
          // total earning by school till now.
          this.totalLesson = res.total;
          // in case of success create data for graph
          // when type = WEEK
          if (type == "WEEK") {
  
            weeks = weeks + 1;
            for (let i = 0; i < weeks ; i++) {
              let currentWeek = this.currentWeek - i;

              let index = res['data'].findIndex(x => x._id.week == currentWeek);
              if (index > -1) {
                console.log(index,'index')
                this.graphDataLesson.push(res['data'][index].count);
                console.log(this.graphDataLesson,'lesson');
                this.labelsLesson.push(i + "w");
              } else {
                this.graphDataLesson.push(0);
                this.labelsLesson.push(i + "w");
              }
              if (i == weeks - 1) {
                this.renderGraph(this.graphDataLesson, this.labelsLesson , 'chartLesson');
              }
            }
          } else {
            let currentMonth = this.currentMonth + 1;
            months = months + 1;
            for (let i = 0; i < months; i++) {
              let cMonth = currentMonth - i;
              let index = res['data'].findIndex(x => x._id.month == cMonth);
              console.log(index, cMonth)
              if (index > -1) {
                this.graphDataLesson.push(res['data'][index].count);
                this.labelsLesson.push(i + "m");
              } else {
                this.graphDataLesson.push(0);
                this.labelsLesson.push(i + "m");
              }
              if (i == months - 1) {
                this.renderGraph(this.graphDataLesson.reverse(), this.labelsLesson, 'chartLesson');
              }
            }
          }
        } else {
          this.renderGraph(this.graphDataLesson,this.labels, 'chartLesson');
         this.serviceCtrl.error('No lesson data are available right now..');
        }



      })
  }

















  renderGraph(dataSource, labels, chartTpoic) {

    console.log(dataSource, labels);
    this.chart = new Chart(chartTpoic, {
      type: 'line',

      data: {
        labels: labels,
        datasets: [
          {
            label: "$100",
            data: dataSource,
            borderColor: "#ff0000",
            fill: false
          },


        ]
      },
      options: {
        legend: {
          display: false,
          cursor: "pointer",



        },
        scales: {
          xAxes: [{
            display: true
          }],
          yAxes: [{
            display: false
          }],
        },
        layout: {

        },
        tooltips: {
          callbacks: {
            title: function (tooltipItem, data) {
              return data['labels'][tooltipItem[0]['index']];
            },
            label: function (tooltipItem, data) {
              return data['datasets'][0]['data'][tooltipItem['index']];
            },
            afterLabel: function (tooltipItem, data) {
              var dataset = data['datasets'][0];
              // var percent = Math.round((dataset['data'][tooltipItem['index']] / dataset["_meta"][0]['total']) * 100)

            }
          },
          backgroundColor: '#FFF',
          titleFontSize: 16,
          titleFontColor: '#0066ff',
          bodyFontColor: '#000',
          bodyFontSize: 14,
          displayColors: false


        },
        title: {
          display: true,

        }
      }
    });

  }



}
