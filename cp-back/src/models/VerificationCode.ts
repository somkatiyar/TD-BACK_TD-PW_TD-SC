import { DBConstant } from './../constants/DBConstant';
import { model, Schema } from 'mongoose';
import * as mongoose from 'mongoose';
import * as autoIncrement from 'mongoose-auto-increment';

var connection = mongoose.createConnection(DBConstant.MONGO_URI,{ useNewUrlParser: true });
autoIncrement.initialize(connection);

const VerificationCodeSchema: Schema = new Schema({
  mobileNumber:{
    type: String,
    default: ''
  },
  email:{
    type: String,
    default: ''
  },
  otp:{
    type: String,
    default: ''
  },
  token:{
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

export default model('VerificationCode', VerificationCodeSchema);