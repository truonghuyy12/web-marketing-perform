# Sử dụng image Node.js
FROM node:16

# Thiết lập thư mục làm việc
WORKDIR /app/frontend

# Sao chép file package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép mã nguồn
COPY . .

# Expose cổng cho ứng dụng frontend
EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["npm", "start"]