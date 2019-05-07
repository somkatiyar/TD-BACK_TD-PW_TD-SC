import { model, Schema } from 'mongoose';

const PackageSchema: Schema = new Schema({
  name:{
    type: String,
    default: ''
  },
  description:{
    type: String,
    default: ''
  },
  numberOfLesson:{
    type: Number,
    default: 0
  },
  numberOfDay:{
    type: Number,
    default: 0
  },
  price:{
    type: Number,
    default: 0
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

export default model('Package', PackageSchema);