const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  heading: { 
    type: String, 
    required: [true, 'Heading is required'], 
    trim: true, 
    minlength: [5, 'Heading must be at least 5 characters'], 
    maxlength: [200, 'Heading must be at most 200 characters']
  },
  keywords: { 
    type: [String], 
    validate: {
      validator: function(value) {
        return Array.isArray(value) && value.every(val => typeof val === 'string');
      },
      message: 'Keywords must be an array of strings'
    }
  },
  data: { 
    type: String, 
    required: [true, 'Data is required'], 
    minlength: [10, 'Data must be at least 10 characters'] 
  },
  approved: { 
    type: Boolean, 
    default: false 
  },
  image: { 
    type: String, 
    required: [true, 'Image URL is required'],
  },
  images: { 
    type: [Object], 
    default: []
  },
  feedId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'rssfeed', 
    required: [true, 'Feed ID is required']
  },
  categories: { 
    type: [String], 
    default: [] 
  },
  isSaved : {
    type:Boolean,
    default: false
  },
  hash: { 
    type: String, 
    unique: true 
  },
  source : {
    type: String
  },
  sourceUrl : {
    type: String
  },
  publishedAt : {
    type : Date
  },
  gradient: {
    type: [String]
  },
  isChatGpt:{
    type:Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

newsSchema.index({ approved: 1 });
newsSchema.index({ feedId: 1 });
newsSchema.index({ categories: 1 });
newsSchema.index({ feedId: 1, approved: 1 });

module.exports = mongoose.model('news', newsSchema);
