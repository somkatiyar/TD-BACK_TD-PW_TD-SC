import { model, Schema } from 'mongoose';

const CountrySchema: Schema = new Schema({
  name:{
    type: String,
    default: ''
  },
  description:{
    type: String,
    default: ''
  },
  value:{
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
  isArchived: {
    type: Boolean,
    default: false,
    required: true
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

export default model('Country', CountrySchema);