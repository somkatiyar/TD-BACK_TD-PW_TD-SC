import { model, Schema } from 'mongoose';

const TestCenterSchema: Schema = new Schema({
  name:{
    type: String,
    default: ''
  },
  contactNumber:{
  type:String,
  default:''
  },
  timing:{
    type:String,
    default:''
    },
    email:{
      type:String,
      default:''
      },
  description:{
    type: String,
    default: ''
  },
  testType:{
    type: String,
    default: ''
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  addressId:{
    type: Schema.Types.ObjectId,
    ref: 'Address',
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false,
    required: true
  }
});

export default model('TestCenter', TestCenterSchema);