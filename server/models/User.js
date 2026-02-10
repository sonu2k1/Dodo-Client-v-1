import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema - Authentication and authorization
 */
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },

    // Role-based access control
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },

    // Account status
    status: {
        type: String,
        enum: ['active', 'suspended', 'pending'],
        default: 'active'
    },

    // Email verification
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Refresh token for JWT
    refreshToken: {
        type: String,
        select: false
    },
    refreshTokenExpires: Date,

    // Security tracking
    lastLogin: Date,
    lastLoginIP: String,
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,

    // Profile
    avatar: String,
    phone: String,

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
// Hash password before saving
UserSchema.pre('save', async function () {
    this.updatedAt = new Date();

    // Only hash password if it's modified
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Increment failed login attempts
UserSchema.methods.incLoginAttempts = async function () {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    // Lock account after 5 failed attempts for 2 hours
    if (this.failedLoginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }

    return this.updateOne(updates);
};

// Reset login attempts on successful login
UserSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: {
            failedLoginAttempts: 0,
            lastLogin: new Date()
        },
        $unset: { lockUntil: 1 }
    });
};

// Get public profile (exclude sensitive fields)
UserSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        email: this.email,
        name: this.name,
        role: this.role,
        status: this.status,
        emailVerified: this.emailVerified,
        avatar: this.avatar,
        createdAt: this.createdAt,
        lastLogin: this.lastLogin
    };
};

const User = mongoose.model('User', UserSchema);

export default User;
