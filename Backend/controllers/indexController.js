const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const { sendErrorResponse } = require("../middlewares/errorHandler");
const { GoogleGenerativeAI } = require("@google/generative-ai");

//---Hiển thị thông số ở Dashboard---
exports.getDashBoard = async (req, res) => {
    try {
        //Lấy thông số từ dữ liệu
        const productCount = await Product.countDocuments().lean();
        const salesCount = await User.countDocuments({ role: "Employee" }).lean();
        const categoryCount = await Category.countDocuments().lean();
        const orderCount = await Order.countDocuments().lean();

        const stats = {
            products: productCount,
            sales: salesCount,
            categories: categoryCount,
            orders: orderCount
        };

        res.status(200).json({ success: true, stats })
    } catch (error) {
        return sendErrorResponse(res, 500, "lấy thông số Dashboard", error);
    }
}

//-----Chatbot-----
exports.getChatbotResponse = async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const userMessage = req.body.message;
        let context = req.body.context || [];

        let relevantProducts = [];
        const productSearchKeywords = extractKeywords(userMessage);

        if (productSearchKeywords.length > 0) {
            const regexConditions = productSearchKeywords.map(keyword => ({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                ]
            }));

            relevantProducts = await Product.find({ $or: regexConditions })
                .populate('category')
                .lean();
        }

        let prompt = `Bạn là một chatbot dịch vụ khách hàng hữu ích cho một cửa hàng điện tử. Sử dụng thông tin sau để trả lời câu hỏi của người dùng bằng ngôn ngữ tương ứng: \n\n`;

        if (relevantProducts.length > 0) {
            prompt += "Sản phẩm liên quan:\n";
            relevantProducts.forEach(product => {
                prompt += `- ${product.name}: ${product.description} (Price: ${product.retailPrice})\n`;
            });
        }

        prompt += `\nTin nhắn người dùng: ${userMessage}\n\nTrả lời câu hỏi của người dùng một cách rõ ràng và súc tích. Nếu bạn không biết câu trả lời, hãy nói "Tôi xin lỗi, tôi không có đủ thông tin để trả lời câu hỏi đó. Vui lòng thử một câu hỏi khác hoặc liên hệ với bộ phận hỗ trợ khách hàng".'\n`;
        prompt += `Hãy chọn ra tối đa 3 sản phẩm phù hợp nhất với câu hỏi của người dùng và cung cấp thông tin ngắn gọn.`;

        const chat = model.startChat({
            history: context,
            generationConfig: {
                maxOutputTokens: 2048,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const geminiResponse = await response.text();

        context.push({ role: "user", parts: [{ text: userMessage }] });
        await new Promise(resolve => setTimeout(resolve, 0));

        context.push({ role: "model", parts: [{ text: geminiResponse }] });
        await new Promise(resolve => setTimeout(resolve, 0));

        res.status(200).json({ response: geminiResponse, context: context });

    } catch (error) {
        return sendErrorResponse(res, 500, "lấy phản hồi từ chatbot", error); // Include error message
    }
};

// --- Helper Function (Improved, but still basic) ---
function extractKeywords(message) {
    const stopWords = new Set(['là', 'một', 'của', 'cho', 'và', 'với', 'có', 'không', 'được', 'hãy', 'tôi', 'xin', 'lỗi', 'câu', 'hỏi', 'khác', 'liên', 'hệ', 'bộ', 'phận', 'hỗ', 'trợ']); // Vietnamese stopwords
    const words = message.toLowerCase().split(/\s+/); // Lowercase and split
    const filteredWords = words.filter(word => word.length > 2 && !stopWords.has(word)); // Remove short words and stopwords

    return [...new Set(filteredWords)];  //Remove duplicate.
}