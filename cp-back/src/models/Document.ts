import { ResourceTypes } from './../constants/ResouceTypes';
import { model, Schema } from 'mongoose';

const DocumentSchema: Schema = new Schema({
  value:{
    type: String,
    default: ''
  },
  documentType:{
    type: Schema.Types.ObjectId,
    ref: 'DocumentType',
  },
  ext:{
    type: String,
    default: ''
  },
  resouceType:{
    type: ResourceTypes,
    default: ResourceTypes.IMAGE
  },
  isVerified: {
    type: String,
    default: '2',
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

export default model('Document', DocumentSchema);