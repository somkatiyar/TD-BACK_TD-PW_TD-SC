import { model, Schema } from 'mongoose';

const RideBookingSchema: Schema = new Schema({
  bookingId:{
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },
  status:{
    type: String,
    default: '',
  },
  driverId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  slotId:{
    type: Schema.Types.ObjectId,
    ref: 'Slot',
  },
  pickUpAddress:{
    type: Schema.Types.ObjectId,
    ref: 'Address',
  },
  dropAddress:{
    type: Schema.Types.ObjectId,
    ref: 'Address',
  },
  startDateTime:{
    type: Date,
    default: ''
  },
  endDateTime:{
    type: Date,
    default: ''
  },
  invoiceId:{
    type: String,
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
  isPushSent:{
    type: Boolean,
    default: false
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  otp:{
    type:String
  }
});

export default model('RideBooking', RideBookingSchema);