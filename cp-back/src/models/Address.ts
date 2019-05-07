import { UserRoles } from './../constants/UserRoles';
import { AddressTypes } from './../constants/AddressTypes';
import { model, Schema } from 'mongoose';

const AddressSchema: Schema = new Schema({
  name:{
    type: String,
    default: ''
  },
  addressLineOne:{
    type: String,
    default: ''
  },
  addressLineTwo:{
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pincode:{
    type: String,
    default: ''
  },
  country:{
    type: String,
    default: ''
  },
  lat:{
    type: String,
    default: ''
  },
  long:{
    type: String,
    default: ''
  },
  addressType:{
    type: AddressTypes,
    default: AddressTypes.PRIMARY
  },
  addressOf:{
    type: UserRoles,
    default: UserRoles.APP_USER
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

export default model('Address', AddressSchema);