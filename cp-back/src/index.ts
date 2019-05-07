import { Ports } from "./constants/Ports";
import * as debug from "debug";
import * as http from "http";

import Server from "./server";
import { CronJob, CronTime } from "cron";
import Scheduler from "./utilities/scheduler";

debug("ts-express:server");

const port = normalizePort(process.env.PORT || Ports.API_PORT);
Server.set("port", port);

console.log(`Server listening on port ${port}`);

const server = http.createServer(Server);
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val: number | string): number | string | boolean {
  const port: number = typeof val === "string" ? parseInt(val, 10) : val;
  if (isNaN(port)) {
    return val;
  } else if (port >= 0) {
    return port;
  } else {
    return false;
  }
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);

  console.log("Before job instantiation");
  const job = new CronJob("0 */1 * * * *", () => {
    Scheduler.checkForTransferRequest();
    Scheduler.checkForLearnerBookings();
  });

  console.log("After job instantiation");
  job.start();

  const job_sec = new CronJob("0 0 0 * * *", () => {
    Scheduler.checkForRidesNotTaken();
    Scheduler.updateDriverAverageRating();
  });
  job_sec.start();
}
