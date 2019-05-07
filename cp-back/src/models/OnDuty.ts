import { model, Schema } from 'mongoose';

const OnDutySchema: Schema = new Schema({
  driverId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive:{
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

export default model('OnDuty', OnDutySchema);