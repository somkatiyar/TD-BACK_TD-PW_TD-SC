import { VarService } from './../../service/var.service';
import { Component, OnInit, ElementRef, Inject } from '@angular/core';
import { DataService } from '../../service/service';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Params } from '@angular/router';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';

declare let paypal: any;
@Component({
  selector: 'app-paypal',
  templateUrl: './paypal.component.html',
  styleUrls: ['./paypal.component.css']
})
export class PaypalComponent implements OnInit {
  token: any;
  orderId: any;
  params: any;
  paymentData: any = [];
  name: any;
  numberOfDay: any;
  numberOfLesson: any;
  price: any;
  tax: any;
  totalAmount: number = 0;
  details;
  finalAmount: any;
  showPaypal: boolean = true;

  constructor(private serviceCtrl: DataService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: Http,
    private element: ElementRef,
    private loader : Ng4LoadingSpinnerService,
    public varCtrl: VarService,
    @Inject('baseURL') private baseURL: string,
    @Inject('picUrl') private picUrl: string) {
    
    
    this.varCtrl.isSideBar = false;
    this.varCtrl.isHeader = true;
    this.varCtrl.isTitle = false;

  
   
  }

  ngOnInit() {
    
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.token = params.token;
      this.orderId = params.orderId;
      console.log(this.token,this.orderId,'bshshs');
      this.params = params;
      console.log(this.params);
      this.serviceCtrl.orderById(this.params).subscribe((data) => {

        if (data["status"]) {
          console.log(data['data']);
  
          this.name = data['data'].packageId.name;
          this.numberOfDay = data['data'].packageId.numberOfDay;
          this.numberOfLesson = data['data'].packageId.numberOfLesson;
          this.price = Number(data['data'].packageId.price)|| 0;
          let taxVal = Number(data['data'].packageId.tax) || 0;
          this.tax = Number(this.price*(taxVal/100))
        
          this.totalAmount = Number(this.price + this.tax);
          console.log(this.totalAmount,'total amount' );
          this.finalAmount = Number(this.totalAmount).toFixed(2);
          console.log('price',this.price,'tax',this.tax,this.finalAmount,'final amount' );
       
          // this.myservice.success("successfully ");
  
        } else {
          // this.myservice.error("Error");
        }
      });
    });
    
    var url = window.location.href;
    if(url.indexOf('success') > -1){
      this.showPaypal = false;
      
    }
    paypal.Button.render({
       env: 'sandbox', 
     // env:'production',
      // Or 'production'
      // Set up the payment:
      // 1. Add a payment callback

      // client: {
      //   sandbox: 'AbIIRArVxQZBOTbdTjMvfHd6X4Q9qx9zdo40ZjGAQ1l17CaixqCwjV-heA6EB3gQCBYjREBkeihHFxwF',
      //   production: 'demo_production_client_id'
      // },
      payment: (data, actions) => {
        // 2. Make a request to your server
        console.log("payment", data);
        return actions.request.post(this.baseURL + 'learner/createPayment', {
          amount: this.finalAmount

        })
          .then( (res)=> {
            console.log(res);

            // 3. Return res.id from the response
            return res.paymentID.id;
          });
      },
      // Execute the payment:
      // 1. Add an onAuthorize callback
      onAuthorize: (result, actions) => {
        // 2. Make a request to your server
        return actions.request.post(this.baseURL + 'learner/executePayment', {
        
          paymentID: result.paymentID,
          payerID: result.payerID,
          amount: this.finalAmount,

          // orderId: "5bab2efc6face714ddce14df",
          // token: "49da6a87c0a52dfde9d9ddbbee193865"
        })
          .then( (res)=> {


            this.details = {
              token: this.token,
              paymentType: "ONLINE",
              orderId: this.orderId,
              paymentStatus: "COMPLETED",
              paymentId: res.paymentID.id,
              transactionId: ""
            }


            this.serviceCtrl.paymentStatus(this.details).subscribe((result) => {

              if(result['status'] ==1) {
            
              console.log(result,'result');
              this.loader.show();
              setTimeout(() => {
               // this.showPaypal = false;
                var url = window.location.href;    
              if (url.indexOf('?') > -1){
                url += '&success=true'
              }else{
                url += '?success=true'
              }
             // alert(url);
              window.location.href = url;
              }, 6000);
        
            } else {
              this.serviceCtrl.error("Some error occured while booking your lesson, Please contact to admin..!")
            }
              
            });
              // 3. Show the buyer a confirmation message.
              console.log(res,'response today');
          });
      }
    }, '#paypal-button');

  }


 
}
