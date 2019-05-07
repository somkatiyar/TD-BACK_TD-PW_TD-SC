import { DBConstant } from './constants/DBConstant';
import * as express from 'express';
import * as mongoose from 'mongoose';

class Wsserver {
  // set app to be of type express.Application
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
  }

  // application config
  public config(): void {
    mongoose.Promise = global.Promise;
    mongoose.connect(DBConstant.MONGO_URI || process.env.MONGODB_URI, { useNewUrlParser: true });
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
  }
}

// export
export default new Wsserver().app;