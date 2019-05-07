import { model, Schema } from 'mongoose';

const OrderSchema: Schema = new Schema({
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
  slotId:{
    type: Schema.Types.ObjectId,
    ref: 'Slot',
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
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentStatus:{
    type: String,
    default: 'PENDING'
  },
  paymentType:{
    type: String,
    default: ''
  },
  paymentId:{
    type: String,
    default: ''
  },
  transactionId:{
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
  }
});

export default model('Order', OrderSchema);