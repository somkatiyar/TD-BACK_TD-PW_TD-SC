import { model, Schema } from 'mongoose';

const SchoolSchema: Schema = new Schema({
    schoolName: {
        type: String,
        default: ''
    },
    taxId: {
        type: String,
        default: ''
    },
    contactPersonName: {
        type: String,
        default: ''
    },
    contactPersonMobileNumber: {
        type: String,
        default: ''
    },
    contactPersonEmail: {
        type: String,
        default: ''
    },
    facebookLink: {
        type: String,
        default: ''
    },
    InstagramLink: {
        type: String,
        default: ''
    },
    googleLink: {
        type: String,
        default: ''
    },
    twitterLink: {
        type: String,
        default: ''
    },
    bankDetail: {
        type: Schema.Types.ObjectId,
        ref: 'BankDetail'
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

export default model('School', SchoolSchema);