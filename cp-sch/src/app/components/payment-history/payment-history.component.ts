import { ConnectionService } from 'ng-connection-service';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from './../../service/service';
import { VarService } from './../../service/var.service';
import { Component, OnInit } from '@angular/core';
import { Options } from 'ng5-slider';
import { DatePipe } from '@angular/common';

import 'jspdf-autotable';
import { TranslateService } from '@ngx-translate/core';

declare var jsPDF: any;

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.css']
})
export class PaymentHistoryComponent implements OnInit {

  minValue: number = 0;
  maxValue: number = 10000;
  options: Options = {
    floor: 0,
    ceil: 10000,
    step: 5,  
  
    
  }

  fromDate: any = "";
  toDate: any = "";
  value: number = 0;
  historyData: any;
  result: any = [];
  rangedata: any;
  public url: string;
  resultent: boolean = false;
  status = 'ONLINE';
  isConnected = true;

  statusInvoice : any;
  taxInvoice : any
  amountInvoice : any;
  dateInvoice : any;
  singleInvoiceData = [];


  organisation : any;
  invoice: any;
  rides: any[];
  invoiceDetails: any;
  invoiceId: any;

  constructor(
    public varCtrl: VarService,
    private serviceCtrl: DataService,
    private router: Router,
    private translateService: TranslateService,
    private connectionService: ConnectionService,

  ) { 
    this.varCtrl.isSideBar = true;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = true;
    this.varCtrl.title = "Payment History";
    this.connectionCheck();
  }

  ngOnInit() {

    this.translateService.get('header.paymentHistory').subscribe(
      value => {
        this.varCtrl.title = value;
      }
    )
    // this.fromDate.setMonth(this.fromDate.getMonth() - 1);
    this.paymentHistory();
  }

  connectionCheck() {
 
    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = "ONLINE";
        this.router.navigate(['payment-history']);
  
      }
      else {
        this.status = "OFFLINE";
        this.router.navigate(['badconnection']);
  
      }
    })
  }

  paymentHistory() {
    this.serviceCtrl.paymentHistory({ token: localStorage.getItem('userToken'), 
    schoolId:localStorage.getItem('schoolId')  })
    .subscribe((data) => {
      if (data["status"] && data['data'].length >0) {
        this.historyData = data['data'];
        this.result = data['data'];
        this.serviceCtrl.error("Payment history found..!");
     
      } else {
        this.serviceCtrl.error("No Payment history found..!");
      }
    });

  }

  getInvoiceDetailById(invoiceId){
    this.invoiceId = invoiceId;
  
    this.serviceCtrl.invoiceDetailById({ invoiceId: invoiceId }).subscribe((data) => {
      console.log("Data Invoice Detail By Id", data);
      if (data["status"]) {
        this.invoiceDetails = data['data']['rides'];
        this.organisation =  data['data']['organisation'];
        this.invoice =  data['data']['invoice'];
        this.getReceipt();
      } else {
        this.serviceCtrl.error(data['message']);
      }
    });
  }


  onChange() {
    this.resultent = true;
    let ed = new Date(this.toDate).setHours(23.59)
    let sd = new Date(this.fromDate).setHours(0.00)

if(this.historyData) {
    this.result = this.historyData.filter(d => {
      var time = new Date(d.createdDate).getTime();
      return (sd <= time && time <= ed);
    });
  }else {
    this.serviceCtrl.error("No Payment History..!")
  }



  }


  getOnlyDate(date){
    let d = new Date(date);
    var monthNames = [
      "January", "February", "March",
      "April", "May", "June", "July",
      "August", "September", "October",
      "November", "December"
    ];
  
    var day = d.getDate();
    var monthIndex = d.getMonth();
    var year = d.getFullYear();

    var hours = d.getHours();
    var minutes = ""+d.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    let h = hours < 10 ? "0"+hours : ""+hours;
    minutes = minutes < ""+10 ? '0'+minutes : ""+minutes;
  
    return day + ' ' + monthNames[monthIndex] + ' ' + year;
  }

  getReceipt(){
    console.log("Invoice Details -1",this.organisation);
    console.log("Invoice Details -2" ,this.invoice);
    console.log("Invoice Details -3", this.invoiceDetails);
    var doc = new jsPDF('p','mm','a4');  
    
    doc.setFontSize(14);    
    doc.text(this.organisation.name+" INVOICE", 15, 15);
    doc.setFontSize(10);    
    doc.text("Address: "+this.organisation.address, 15, 20);
    doc.text("Contact Number: "+this.organisation.contactNumber, 15, 25);
    doc.text("Email: "+this.organisation.email, 15, 30);

    doc.setFontSize(11);    
    doc.text("Invoice Date : "+this.getOnlyDate(new Date(this.invoice.createdDate)), 15, 40);
    doc.text("Invoice ID : "+this.invoiceId.toUpperCase(), 15, 45);

    doc.setFontSize(12);
    var columns = ["#","Ride Date","Booking ID","Driver"];

    var rows = [];
    
    for(let i=0; i < this.invoiceDetails.length; i++){
      let data = [];
      data.push(i+1);
      data.push(this.getOnlyDate(this.invoiceDetails[i].startDateTime));
      data.push(this.invoiceDetails[i].bookingId);
      data.push(this.invoiceDetails[i].driverId.email);
      console.log(this.invoiceDetails[i]);
      rows.push(data);
    }

    doc.autoTable(columns, rows, {
      theme: 'striped',
      startY: 60
    });

    let finalY = doc.autoTable.previous.finalY; // The y position on the page
    doc.setFontSize(11);
    doc.text("--------------------------------------------------------------------------------------------------------------", 15, finalY+5);
    doc.text("Tax Amount($) : "+this.invoice.tax, 15, finalY+10);
    doc.text("Total Amount($) : "+this.invoice.amount, 75, finalY+10);
    doc.text("--------------------------------------------------------------------------------------------------------------", 15, finalY+15);

    finalY = finalY + 10 + 20;

    doc.setFontSize(12);
    doc.text("Invoice Status : "+(this.invoice.status == "NOT_PAID" ? "Unpaid" : "Paid"), 15, finalY);

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');

  }


  public download(downloadUrl: string): void {
    window.open(downloadUrl, '_blank');
  }



  setRange() {
    if(this.result && this.toDate && this.fromDate) {
      console.log(this.result,'result not range')
    this.resultent = false;
    this.rangedata = this.result.filter(obj => obj.amount >= this.minValue && obj.amount <= this.maxValue)
    console.log(this.minValue, this.maxValue, 'gagag');
    console.log(this.rangedata, 'gagag');
    } else {
      // this.myservice.error("Please select from and To date..");
    }
  }

}
