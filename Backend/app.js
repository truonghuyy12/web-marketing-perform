const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const connectDB = require('./middlewares/database');
const cors = require('cors');
const fs = require('fs');

// Load biến môi trường từ file .env
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Create products directory if it doesn't exist
const productsDir = path.join(__dirname, 'public/img/products');
if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
    console.log('Created products directory:', productsDir);
}

// Create poster directory if it doesn't exist
const posterDir = path.join(__dirname, 'public/img/poster');
if (!fs.existsSync(posterDir)) {
    fs.mkdirSync(posterDir, { recursive: true });
    console.log('Created poster directory:', posterDir);
}

// Static files middleware
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Log all requests
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    next();
});

// Kết nối tới MongoDB
connectDB();

// Cấu hình session và flash
app.use(session({
    secret: process.env.SESSION_SECRET || 'JUASDANAUDDANad',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

// Middleware để sử dụng flash message trong view
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// API Routes
require('./middlewares/emailAutomation');

const authRouter = require('./routes/authRouter');
const indexRouter = require('./routes/indexRouter');
const categoryRouter = require('./routes/categoryRouter');
const productRouter = require('./routes/productRouter');
const employeeRouter = require('./routes/employeeRouter');
const customerRouter = require('./routes/customerRouter')
const postRouter = require('./routes/postRouter');
const commentRouter = require('./routes/commentRouter');
const transactionRouter = require('./routes/transactionRouter');
const reportRouter = require('./routes/reportRouter');
const uploadRouter = require('./routes/uploadRouter');

app.use('/api/auth', authRouter);
app.use('/api/dashboard', indexRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/posts', postRouter);
app.use('/api/comments', commentRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/customers', customerRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/reports', reportRouter);
app.use('/api/upload/image', uploadRouter);

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../Frontend/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../Frontend/build', 'index.html'));
    });
}

// Middleware xử lý lỗi 404
app.use((req, res) => {
    res.status(404).send("404 Not Found");
});

// Middleware xử lý lỗi 500
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).send("500 Internal Server Error");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`))
