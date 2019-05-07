import { TaxFor } from './../constants/TaxFor';
import { model, Schema } from 'mongoose';

const TaxSchema: Schema = new Schema({
  countryCode:{
    type: Number,
    default: 0
  },
  description:{
    type: String,
    default: ''
  },
  taxFor:{
    type: TaxFor,
    default: TaxFor.DRIVER_N_SCHOOL
  },
  taxPercentage:{
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

export default model('Tax', TaxSchema);