import { model, Schema } from 'mongoose';

const NotifSmsSchema: Schema = new Schema({
  req:{
      type:String
  },
  res:{
      type:String
  },
  title:{
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

export default model('NotifSmsLogs', NotifSmsSchema);