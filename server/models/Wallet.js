import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    dodoPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    history: [{
        type: {
            type: String,
            enum: ['EARN', 'REDEEM', 'DEPOSIT', 'PURCHASE'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: String,
        date: {
            type: Date,
            default: Date.now
        },
        metadata: {
            type: Map,
            of: String
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
WalletSchema.pre('save', function () {
    this.updatedAt = new Date();
});

const Wallet = mongoose.model('Wallet', WalletSchema);

export default Wallet;
