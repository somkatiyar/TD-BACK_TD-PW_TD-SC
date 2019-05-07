import { model, Schema } from 'mongoose';

const SchoolNDriverInvoiceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fromDate: {
    type: Date,
    ref: Date.now
  }, 
  toDate: {
    type: Date,
    ref: Date.now
  },
  tax: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  paymentId: {
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

export default model('SchoolNDriverInvoice', SchoolNDriverInvoiceSchema);