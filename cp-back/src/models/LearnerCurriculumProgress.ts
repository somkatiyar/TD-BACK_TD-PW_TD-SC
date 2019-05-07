import { model, Schema } from 'mongoose';

const LearnerCurriculumProgressSchema: Schema = new Schema({
  curriculumId:{
    type: Schema.Types.ObjectId,
    ref: 'Curriculum',
  },
  bookingId:{
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },
  progress:{
    type: Number,
    default: 0
  },
  // status:{
  //   type: String,
  //   default: ''
  // },
  // rating:{
  //   type: Number,
  //   default: null
  // },
  // comment:{
  //   type: String,
  //   default: ''
  // },
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

export default model('LearnerCurriculumProgress', LearnerCurriculumProgressSchema);