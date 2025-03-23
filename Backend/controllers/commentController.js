const Comment = require("../models/Comment");
const { sendErrorResponse } = require("../middlewares/errorHandler");

exports.getComments = async (req, res, next) => {
  try {
    const { startIndex = 0, limit = 9, sort = 'asc' } = req.query;
    const parsedStartIndex = parseInt(startIndex);
    const parsedLimit = parseInt(limit);
    const sortDirection = sort === 'desc' ? -1 : 1;

    const comments = await Comment.find()
      .sort({ createdAt: sortDirection })
      .skip(parsedStartIndex)
      .limit(parsedLimit)
      .lean();

    const totalComments = await Comment.countDocuments();

    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastMonthComments = await Comment.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    return res.status(200).json({
      success: true,
      comments,
      totalComments,
      lastMonthComments
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "lấy bình luận", error);
  }
};

exports.getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    return sendErrorResponse(res, 500, "lấy bình luận từ bài viết", error);
  }
};

exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return sendErrorResponse(res, 404, "Bình luận không tồn tại.");
    }

    const userId = req.user.id;
    const userIndex = comment.likes.indexOf(userId);

    if (userIndex === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(userIndex, 1);
    }
    comment.numberOfLikes = comment.likes.length;
    await comment.save();

    return res.status(200).json({ success: true, message: "Thích bình luận thành công.", comment });
  } catch (error) {
    return sendErrorResponse(res, 500, "thích bình luận", error);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const { content, postId, userId } = req.body;

    if (userId !== req.user.id) {
      return sendErrorResponse(res, 403, "Không có quyền truy cập.");
    }

    const comment = new Comment({ content, postId, userId });
    await comment.save();

    return res.status(201).json({ success: true, message: "Tạo bình luận thành công.", comment });
  } catch (error) {
    return sendErrorResponse(res, 500, "tạo bình luận", error);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return sendErrorResponse(res, 404, "Không tìm thấy bình luận.");
    }

    if (comment.userId !== req.user.id && !["Admin", "Employee"].includes(req.user.role)) {
      return sendErrorResponse(res, 403, "Không có quyền cập nhật bình luận này.");
    }

    const editedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content: req.body.content },
      { new: true }
    ).lean();

    return res.status(200).json({ success: true, message: "Cập nhật bình luận thành công.", comment: editedComment });
  } catch (error) {
    return sendErrorResponse(res, 500, "cập nhật bình luận", error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return sendErrorResponse(res, 404, "Không tìm thấy bình luận.");
    }

    const userRole = req.user.role;
    if (comment.userId !== req.user.id && !["Admin", "Employee"].includes(userRole)) {
      return sendErrorResponse(res, 403, "Không có quyền xóa bình luận này.");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({ success: true, message: "Xóa bình luận thành công." });
  } catch (error) {
    return sendErrorResponse(res, 500, "xóa bình luận", error);
  }
};