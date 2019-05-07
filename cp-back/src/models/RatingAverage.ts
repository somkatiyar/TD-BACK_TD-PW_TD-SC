import { model, Schema } from 'mongoose';

const RatingAverageSchema: Schema = new Schema({
 
  att:[{
    type: Schema.Types.Array,
    ref: 'Attribute',
  }],
 
  driverId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  driverCount:{
      type:String,
      default: null
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  // count:{
  //   type: String,
  //   default: null
  // },
  driverAverage:{
    type: String,
    default: null
  }
});

export default model('RatingAverage', RatingAverageSchema);