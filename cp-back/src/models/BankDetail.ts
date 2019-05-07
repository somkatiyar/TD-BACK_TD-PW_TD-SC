import { model, Schema } from 'mongoose';

const BankDetailSchema: Schema = new Schema({
    bankName: {
        type: String,
        default: ''
    },
    accountNumber: {
        type: String,
        default: ''
    },
    IFSCCode: {
        type: String,
        default: ''
    },
    branchName: {
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

export default model('BankDetail', BankDetailSchema);