import { Ports } from './constants/Ports';
import * as debug from 'debug';
import * as http from 'http';
import * as https from 'https';
import * as WebSocket from 'ws';
import Wsutil from './utilities/wsutil';
import { LatLongTypes } from './constants/LatLongTypes';
import * as fs from "fs";

const clients = {};

import Wsserver from './wsserver';

debug('ts-express:server');

const port = normalizePort(process.env.PORT || Ports.WEBSOCKET_PORT);
Wsserver.set('port', port);

console.log(`Server listening on port ${port}`);
//  var privateKey = fs.readFileSync('./ssl-cert/key.pem', 'utf8');
//  var certificate = fs.readFileSync('./ssl-cert/server.crt', 'utf8');




 //var credentials = { key: privateKey, cert: certificate, passphrase: "1234" };
const server = http.createServer(Wsserver);
const wss = new WebSocket.Server({ server });

/*** Web socket connection implementation start ***/
wss.on('connection', function connection(ws, req) {

  console.log("client",req.url);
  let requestedClient = req.url.split('/');
  console.log(requestedClient[1])
  let nc = requestedClient[1];
  clients[nc] = ws;

  clients[nc].isAlive = true;

  clients[nc].on('pong', () => {
    clients[nc].isAlive = true;
  });
  
  ws.on('message', (message) => {
    console.log('received: %s', message);
    let im = JSON.parse(message);
    let c = im['to'];
    if(clients[c] && im['data'] && im['data']['dataType'] == LatLongTypes.CAR_MOVEMENT){
      Wsutil.insertLocation(im['data']);
      im['type'] = 'MY_INSTRUCTOR_LOCATION';
      clients[c].send(im);
    }

    if(clients[c] && im['data'] && im['data']['dataType'] == 'GET_MY_COLLEAGUE_LOCATION'){
      Wsutil.colleagueLocation(im['to']).then(data=>{
        // console.log(clients[c]);
       
        data['type'] = 'MY_COLLEAGUE_LOCATION';
        console.log("GET_MY_COLLEAGUE_LOCATION",data,im['to']);
        clients[c].send(JSON.stringify(data));
      });
    }

    if(clients[c] && im['data'] && im['data']['dataType'] == LatLongTypes.MOBILE){
      console.log("get",c);
      Wsutil.addMobileLocation(im['data']).then(data=>{
        // console.log(clients[c]);
        console.log(data);
        clients[c].send(JSON.stringify(data));
      });
    }
  });

  // setInterval(()=>{
  //   for (let key in clients) {
  //     if (clients.hasOwnProperty(key)) {
  //         console.log(key + " -> " + clients[key]);
  //         if (!clients[key].isAlive){
  //           delete clients[key]; 
  //           return clients[key].terminate();
  //         } 
          
  //         clients[key].isAlive = false;
  //         ws.ping(null, false);
  //     }
  //   }
  // },10000);


});

/*** Web socket connection implementation end ***/


server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: number | string): number | string | boolean {
  const port: number = typeof val === 'string' ? parseInt(val, 10) : val;
  if (isNaN(port)) {
    return val;
  } else if (port >= 0) {
    return port;
  } else {
    return false;
  }
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}
























































// import { LatLongTypes } from './constants/LatLongTypes';
// import WebSocket = require('ws');
// import * as http from 'http';
// import * as https from 'https';
// import Wsutil from './utilities/wsutil';

// const clients = {};

// const wss = new WebSocket.Server({ port: 8081 });

// wss.on('connection', function connection(ws, req) {

//   console.log("client",req.url);
//   let requestedClient = req.url.split('/');
//   console.log(requestedClient[1])
//   let nc = requestedClient[1];
//   clients[nc] = ws;
//   // if(! clients[nc]){
   
//   // }
  
//   ws.on('message', (message) => {
//     console.log('received: %s', message);
//     let im = JSON.parse(message);
//     let c = im['to'];
//     if(clients[c] && im['data'] && im['data']['dataType'] == LatLongTypes.CAR_MOVEMENT){
//       Wsutil.insertLocation(im['data']);
//       im['type'] = 'MY_INSTRUCTOR_LOCATION';
//       clients[c].send(im);
//     }

//     if(clients[c] && im['data'] && im['data']['dataType'] == LatLongTypes.MOBILE){
//       console.log("in....",c);
//       Wsutil.colleagueLocation(im['to']).then(data=>{
//         console.log(clients[c]);
//         clients[c].send(JSON.stringify(data));
//       })
//       .catch(err=>{
//         console.log(clients[c]);
//         clients[c].send("texthbjxbjbx");
//       });
      
//     }
//   });
  
//   setInterval(()=>{   
//     console.log('socket is live');
//     // ws.send('socket is live');
//   },10000);

// });

/********************** New Code *********************************/

// import * as express from 'express';
// import * as http from 'http';
// import * as WebSocket from 'ws';
// import Wsutil from './utilities/wsutil';
// import { LatLongTypes } from './constants/LatLongTypes';

// const clients = {};

// const app = express();

// //initialize a simple http server
// const server = http.createServer(app);

// //initialize the WebSocket server instance
// const wss = new WebSocket.Server({ server });

// wss.on('connection', function connection(ws, req) {

//   console.log("client",req.url);
//   let requestedClient = req.url.split('/');
//   console.log(requestedClient[1])
//   let nc = requestedClient[1];
//   clients[nc] = ws;
//   // if(! clients[nc]){
   
//   // }
  
//   ws.on('message', (message) => {
//     console.log('received: %s', message);
//     let im = JSON.parse(message);
//     let c = im['to'];
//     if(clients[c] && im['data'] && im['data']['dataType'] == LatLongTypes.CAR_MOVEMENT){
//       Wsutil.insertLocation(im['data']);
//       im['type'] = 'MY_INSTRUCTOR_LOCATION';
//       clients[c].send(im);
//     }

//     if(clients[c] && im['data'] && im['data']['dataType'] == LatLongTypes.MOBILE){
//       console.log("in....",c);
//       Wsutil.colleagueLocation(im['to']).then(data=>{
//         console.log(clients[c]);
//         clients[c].send(JSON.stringify(data));
//       })
//       .catch(err=>{
//         console.log(clients[c]);
//         clients[c].send("texthbjxbjbx");
//       });
      
//     }
//   });
  
//   setInterval(()=>{   
//     console.log('socket is live');
//     // ws.send('socket is live');
//   },10000);

// });

// //start our server
// server.listen(8081, () => {
//     console.log(`Server started on port ${server.address().port} :)`);
// });
