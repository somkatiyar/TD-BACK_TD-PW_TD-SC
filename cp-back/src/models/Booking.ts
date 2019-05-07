import { model, Schema } from 'mongoose';

const BookingSchema: Schema = new Schema({
  orderId:{
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  packageId:{
    type: Schema.Types.ObjectId,
    ref: 'Package',
  },
  driverId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  learnerId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  pickUpAddressId:{
    type: Schema.Types.ObjectId,
    ref: 'Address',
  },
  lessonStartDate:{
    type: Date,
    default: ''
  },
  lessonEndDate:{
    type: Date,
    default: ''
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false,
    required: true
  },
  hasError:{
    type:String,
    default:null
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  didFeedBack:{
    type:Boolean,
    default:false
  }
});

export default model('Booking', BookingSchema);