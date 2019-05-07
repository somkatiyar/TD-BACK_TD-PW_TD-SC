import { LatLongTypes } from './../constants/LatLongTypes';
import { model, Schema } from 'mongoose';

const VehicleDataSchema: Schema = new Schema({
  car:{
    type: Schema.Types.ObjectId,
    ref: 'CarInfo',
  },
  speed:{
    type: String,
    default: ''
  },
  rpm:{
    type: String,
    default: ''
  },
  temp:{
    type: String,
    default: ''
  },
  timeStamp:{
    type: Date,
    default: Date.now()
  },
  lat:{
    type: String,
    default: ''
  },
  long:{
    type: String,
    default: ''
  },
  accuracy:{
    type: String,
    default: ''
  },
  direction:{
    type: String,
    default: ''
  },
  rideBooking:{
    type: Schema.Types.ObjectId,
    ref: 'RideBooking',
    required: false
  },
  dataType:{
    type: LatLongTypes,
    default: LatLongTypes.MOBILE
  },
  user:{
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  }
});

export default model('VehicleData', VehicleDataSchema);