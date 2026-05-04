import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  addresses: [{
    label: { type: String, default: "Home" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  // New fields for membership
  membershipTier: {
    type: String,
    enum: ["Basic", "Silver", "Gold", "Platinum"],
    default: "Basic"
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  isFirstUser: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to check if this is the first user
userSchema.statics.isFirstUser = async function() {
  const count = await this.countDocuments();
  return count === 0;
};

// Virtual: auto‑calculate membership from loyaltyPoints
userSchema.virtual('calculatedMembership').get(function() {
  if (this.loyaltyPoints >= 10000) return 'Platinum';
  if (this.loyaltyPoints >= 5000) return 'Gold';
  if (this.loyaltyPoints >= 2000) return 'Silver';
  return 'Basic';
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;