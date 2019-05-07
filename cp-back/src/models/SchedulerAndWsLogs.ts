import { model, Schema } from 'mongoose';

const SchedulerAndWsSchema: Schema = new Schema({
  to:{
      type:[String]
  },
  message:{
    type:String
  },
  title:{
    type:String
  },
  params:{
    type:String
  },
  res:{
      type:String
  },
  from:{
      type:String
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  }
  
});

export default model('SchedulerAndWsLogs', SchedulerAndWsSchema);