import { model, Schema } from 'mongoose';

const RideBookingTransferRequestSchema: Schema = new Schema({
  rideBookingId:{
    type: Schema.Types.ObjectId,
    ref: 'RideBooking',
  },
  status:{
    type: String,
    default: '',
  },
  to:{
    type: String,
    default: '',
  },
  title:{
    type: String,
    default: '',
  },
  message:{
    type: String,
    default: '',
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isArchived: {
    type: Boolean,
    default: false,
    required: true
  },
  topic:{
    type:String,
    default:""
  },
  city:{
    type:String,
    default:""
  }

});

export default model('RideBookingTransferRequest', RideBookingTransferRequestSchema);