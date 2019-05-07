import { TestStatus } from '../constants/TestStatus';
import { model, Schema } from 'mongoose';

const BookedTestCenterSchema: Schema = new Schema({
  testCenterId:{
    type: Schema.Types.ObjectId,
    ref: 'TestCenter',
  },
  learnerId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status:{
    type: TestStatus,
    default: TestStatus.PENDING
  },
  testDate:{
    type: Date,
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

export default model('BookTestCenter', BookedTestCenterSchema);