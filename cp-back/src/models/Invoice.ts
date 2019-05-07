import { InvoiceStatus } from './../constants/InvoiceStatus';
import { model, Schema } from 'mongoose';

const InvoiceSchema: Schema = new Schema({
  invoiceGeneratedId:{
    type: String,
    default: ''
  },
  paymentID:{
    type: String,
    default: ''
  },
  driverId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  amount:{
    type: Number,
    default: 0
  },
  description:{
    type: String,
    default: ''
  },
  tax:{
    type: Number,
    default: 0
  },
  status:{
    type: InvoiceStatus,
    default: InvoiceStatus.NOT_PAID
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

export default model('Invoice', InvoiceSchema);



