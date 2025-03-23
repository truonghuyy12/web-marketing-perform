const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề không được để trống'],
    minlength: [10, 'Tiêu đề phải có ít nhất 10 ký tự'],
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Nội dung không được để trống']
  },
  image: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return v.startsWith('data:image/');
      },
      message: 'Invalid image format'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['Marketing', 'Product', 'Technology', 'Performance', 'other'],
    default: 'other'
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Tăng số lượt xem
postSchema.methods.increaseViews = async function() {
  this.views += 1;
  return this.save();
};

// Virtual cho số lượng likes và comments
postSchema.virtual('likesCount').get(function() {
  return this.likes?.length || 0;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments?.length || 0;
});

// Populate tự động userId khi gọi find
postSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'userId',
    select: 'username avatar fullname role'
  });
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
