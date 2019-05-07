import { model, Schema } from 'mongoose';

const BillingRateSchema: Schema = new Schema({
  userId:{
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rate:{
    type: Number,
    default: 0
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

export default model('BillingRate', BillingRateSchema);