import { model, Schema } from 'mongoose';

const DriverRatingSchema: Schema = new Schema({
  bookingId:{
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },
  attributeId:[{
    type: Schema.Types.ObjectId,
    ref: 'Attribute',
  }],
  learnerId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  driverId:{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  rating:{
    type: Number,
    default: null
  },
  review:{
    type: String,
    default: ''
  },
  createdDate: {
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

export default model('DriverRating', DriverRatingSchema);