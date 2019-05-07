import { model, Schema } from 'mongoose';
import { UserTypes } from './../constants/UserTypes';
import { UserRoles } from './../constants/UserRoles';

const UserSchema: Schema = new Schema({ 
  mobileNumber:{
    type: String,
    default: ''
  },
  alternativeMobileNumber:{
    type: String,
    default: ''
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  dob:{
    type: Date,
    default: ''
  },
  drivingLicense: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  profilePictureUrl: {
    type: String,
    default: ''
  },
  token:{
    type: String,
    default: ''
  },
  adiOrPdiBadgeNumber: {
    type: String,
    default: ''
  },
  userType: {
    type: UserTypes,
    default: UserTypes.LEARNER
  },
  userRole: {
    type: UserRoles,
    default: UserRoles.APP_USER
  },
  companions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  addresses:[
    {
      type: Schema.Types.ObjectId,
      ref: 'Address',
    }
  ],
  documents:[
    {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
  ],
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
    default: false
  },
  aboutme:{
    type:String,
    default:" "
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  countryCode:{
    type:String,
    default:""
  }
});

export default model('User', UserSchema);