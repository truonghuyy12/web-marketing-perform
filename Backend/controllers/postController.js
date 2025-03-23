const Post = require("../models/Post");
const { sendErrorResponse } = require("../middlewares/errorHandler");

const VALID_CATEGORIES = ['Marketing', 'Product', 'Technology', 'Performance', 'other'];

exports.createPost = async (req, res, next) => {
  try {
    const { title, content, image, category } = req.body;

    if (!title || !content) {
      return sendErrorResponse(res, 400, "Tiêu đề và nội dung không được để trống.");
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return sendErrorResponse(res, 400, "Danh mục không hợp lệ.");
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Kiểm tra slug đã tồn tại chưa
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      return sendErrorResponse(res, 400, "Tiêu đề bài viết đã tồn tại.");
    }

    const postData = {
      title,
      content,
      image,
      category: category || 'other',
      slug,
      userId: req.user._id
    };

    const post = new Post(postData);
    const savedPost = await post.save();

    const populatedPost = await Post.findById(savedPost._id)
      .populate({
        path: 'userId',
        select: 'username avatar fullname role',
        model: 'User'
      })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Tạo bài viết thành công.",
      post: populatedPost
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(res, 400, messages.join(', '));
    }

    if (error.code === 11000) {
      return sendErrorResponse(res, 400, "Bài viết với tiêu đề này đã tồn tại.");
    }

    return sendErrorResponse(res, 500, "tạo bài viết", error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const { startIndex = 0, limit = 9, order = 'asc', userId, category, searchTerm } = req.query;
    const parsedStartIndex = parseInt(startIndex);
    const parsedLimit = parseInt(limit);
    const sortDirection = order === 'asc' ? 1 : -1;

    let query = {};

    if (userId) {
      query.userId = userId;
    }
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return sendErrorResponse(res, 400, "Danh mục không hợp lệ.");
      }
      query.category = category;
    }
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const posts = await Post.find(query)
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit)
      .populate({
        path: 'userId',
        model: 'User',
        select: 'username avatar fullname role'
      })
      .populate({
        path: 'comments.userId',
        model: 'User',
        select: 'username avatar fullname'
      })
      .lean()  // Convert to plain JavaScript object
      .then(posts => posts.map(post => ({
        ...post,
        likes: Array.isArray(post.likes) ? post.likes : []  // Ensure likes is always an array
      })));

    const totalPosts = await Post.countDocuments(query);

    return res.status(200).json({
      success: true,
      posts,
      totalPosts,
      hasMore: totalPosts > startIndex + posts.length
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "lấy danh sách bài viết", error);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: 'userId',
        select: 'username avatar fullname role',
        model: 'User'
      })
      .populate({
        path: 'comments.userId',
        select: 'username avatar fullname',
        model: 'User'
      })
      .lean();

    if (!post) {
      return sendErrorResponse(res, 404, "Không tìm thấy bài viết.");
    }

    return res.status(200).json({ success: true, post });
  } catch (error) {
    return sendErrorResponse(res, 500, "lấy thông tin bài viết", error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return sendErrorResponse(res, 404, "Không tìm thấy bài viết.");
    }

    if (post.userId.toString() !== req.user._id && req.user.role !== "Admin") {
      return sendErrorResponse(res, 403, "Bạn không có quyền cập nhật bài viết này.");
    }

    const { title, content, image, category } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $set: {
          title,
          content,
          image,
          category
        }
      },
      { new: true }
    ).populate({
      path: 'comments.userId',
      select: 'username avatar fullname',
      model: 'User'
    }).lean();

    return res.status(200).json({
      success: true,
      message: "Cập nhật bài viết thành công.",
      post: updatedPost
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "cập nhật bài viết", error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return sendErrorResponse(res, 404, "Không tìm thấy bài viết.");
    }

    if (post.userId.toString() !== req.user._id && req.user.role !== "Admin") {
      return sendErrorResponse(res, 403, "Bạn không có quyền xóa bài viết này.");
    }

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({ success: true, message: "Xóa bài viết thành công." });
  } catch (error) {
    return sendErrorResponse(res, 500, "xóa bài viết", error);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return sendErrorResponse(res, 404, "Không tìm thấy bài viết.");
    }

    const userId = req.user._id;
    const userIndex = post.likes.indexOf(userId);

    if (userIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: userIndex === -1 ? "Đã thích bài viết." : "Đã bỏ thích bài viết.",
      likes: post.likes
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "thích/bỏ thích bài viết", error);
  }
};

exports.commentPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const content = req.body.content;

    if (!content) {
      return sendErrorResponse(res, 400, "Nội dung bình luận không được để trống.");
    }

    const post = await Post.findById(postId);
    if (!post) {
      return sendErrorResponse(res, 404, "Không tìm thấy bài viết.");
    }

    const newComment = {
      userId: req.user._id,
      content: content,
      createdAt: new Date()
    };

    post.comments = post.comments || [];
    post.comments.push(newComment);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate({
        path: 'comments.userId',
        select: 'username avatar fullname',
        model: 'User'
      }).lean();

    return res.status(200).json({
      success: true,
      message: "Đã thêm bình luận.",
      comments: populatedPost.comments
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "bình luận bài viết", error);
  }
};

exports.getLikedPosts = async (req, res) => {
    try {
      // Lấy user ID từ request (đã được thêm vào bởi middleware xác thực)
      const userId = req.user._id;
  
      // Tìm tất cả các bài viết mà người dùng này đã thích
      const likedPosts = await Post.find({ likes: userId }, '_id'); // Only return _id for efficiency
  
      // Tạo một mảng chỉ chứa các post_id
      const likedPostIds = likedPosts.map(post => post._id);
  
      // Trả về mảng các post_id đã thích
      res.json(likedPostIds);
  
    } catch (error) {
      console.error("Error getting liked posts:", error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };