import { model, Schema } from 'mongoose';

const SlotSchema: Schema = new Schema({
  name:{
    type: String,
    default: ''
  },
  description:{
    type: String,
    default: ''
  },
  fromTime:{
    type: String,
    default: ''
  },
  toTime:{
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

export default model('Slot', SlotSchema);