import { model, Schema } from 'mongoose';

const BookedTestCenterLocationHistorySchema: Schema = new Schema({
  bookedTestCenter:{
    type: Schema.Types.ObjectId,
    ref: 'BookedTestCenter',
  },
  learnerId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  lat:{
    type: Number,
    default: 0,
  },
  long:{
    type: Number,
    default: 0,
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

export default model('BookedTestCenterLocationHistory', BookedTestCenterLocationHistorySchema);