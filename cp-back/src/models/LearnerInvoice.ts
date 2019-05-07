import { model, Schema } from 'mongoose';

const LearnerInvoiceSchema: Schema = new Schema({
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  learnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
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


export default model('LearnerInvoice', LearnerInvoiceSchema);