# Sử dụng image Node.js chính thức
FROM node:16

# Thiết lập thư mục làm việc trong container
WORKDIR /app/backend

# Sao chép file package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn backend
COPY . .

# Expose cổng mà ứng dụng chạy
EXPOSE 8080

# Lệnh khởi chạy ứng dụng
CMD ["npm", "start"]