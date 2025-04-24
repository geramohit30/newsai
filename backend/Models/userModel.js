const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [false, 'Username is required'],
    unique: false, 
    trim: true, 
    minlength: [3, 'Username must be at least 3 characters'], 
    maxlength: [30, 'Username must be at most 30 characters'], 
    match: [/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens'],
    index: true
  },
  email:{
    type: String,
    trim: true,
    index: true
  },
  password: { 
    type: String, 
    required: [false, 'Password is required'], 
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'], 
    unique: true, 
    match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'], 
    sparse: true,
    trim: true
  },
  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  },
  f_id: {
    type: String, 
    required: false, 
  }
}, { 
  timestamps: true 
});

userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);
