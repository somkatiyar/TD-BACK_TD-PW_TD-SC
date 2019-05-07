import { model, Schema } from 'mongoose';

const CarInfoSchema: Schema = new Schema({
  userId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  registrationNumber:{
    type: String,
    default: ''
  },
  chassisNumber: {
    type: String,
    default: ''
  },
  vehicleTypeId: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: ''
  },
  isAutomatic: {
    type: Boolean,
    default: false,
    required: true
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
    required: false
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  gearType:{
    type: Schema.Types.ObjectId,
    ref: 'GearType'
  }
});

export default model('CarInfo', CarInfoSchema);