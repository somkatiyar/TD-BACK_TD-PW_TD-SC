import { model, Schema } from 'mongoose';

const SchoolToUserSchema: Schema = new Schema({
    school: {
        type: Schema.Types.ObjectId,
        ref: 'School'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
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

export default model('SchoolToUser', SchoolToUserSchema);