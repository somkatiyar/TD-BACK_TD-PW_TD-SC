import { UserRoles } from '../constants/UserRoles';
import { UserTypes } from '../constants/UserTypes';
import { model, Schema } from 'mongoose';

const PushInfoSchema: Schema = new Schema({
  deviceId:{
    type: String,
    required: true
    
  },
  userId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  pushToken:{
    type: String,
    default: '',
  },
  os:{
    type: String,
    default: '',
  },
  userType:{
    type: UserTypes,
    default: ''
  },
  userRole:{
    type: UserRoles,
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

export default model('PushInfo', PushInfoSchema);