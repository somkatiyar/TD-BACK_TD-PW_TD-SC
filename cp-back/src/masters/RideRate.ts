import { model, Schema } from 'mongoose';
import { ObjectId } from 'bson';

const RideRateSchema: Schema = new Schema({
  who:{
    type:Object
  },
  price:{
    type: Number,
    default: ''
  },
  taxId:{
    type: Schema.Types.ObjectId,
    ref: 'Tax'
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
    default: false
  },
  isSchool: {
    type: Boolean,
    default: false,
    required : true
  },
  createdBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
updatedBy:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isGeneric: {
    type: Boolean,
    default: false
  },
});

export default model('RideRate', RideRateSchema);