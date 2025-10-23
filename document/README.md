# 🌱 Carbon Verification & Audit System

Hệ thống kiểm toán và xác minh tín chỉ carbon cho xe điện với 4 chức năng cốt lõi.

## 🎯 4 Chức năng chính

1. **Kiểm tra dữ liệu phát thải & hồ sơ tín chỉ**
2. **Duyệt hoặc từ chối yêu cầu phát hành tín chỉ carbon**
3. **Cấp tín chỉ và ghi vào ví carbon**
4. **Xuất báo cáo phát hành tín chỉ carbon**

## 🚀 Chạy hệ thống

### Yêu cầu

- Docker và Docker Compose

### Khởi động

```bash
# Windows
start.bat

# Manual
docker-compose up -d --build
```

### Truy cập

- **Frontend**: <http://localhost:8080>
- **API Gateway**: <http://localhost:3000>

### Dừng hệ thống

```bash
docker-compose down
```

## 🏗️ Kiến trúc

### 5 Microservices

- **API Gateway** (Port 3000)
- **Verification Service** (Port 3001)
- **Audit Service** (Port 3002)
- **Credit Service** (Port 3003)
- **Report Service** (Port 3004)

### Frontend

- **Web Interface** (Port 8080)
- 4 tabs tương ứng 4 chức năng

### Databases

- 4 MongoDB containers riêng biệt
- Ports 27017-27020

## 📊 Tính năng

### Tab 1: Kiểm tra & Xác minh

- Danh sách yêu cầu xác minh
- Filter và search
- Tính toán CO₂ tự động
- Modal chi tiết

### Tab 2: Duyệt Tín chỉ

- Workflow approve/reject
- Lý do từ chối
- Audit trail

### Tab 3: Phát hành Tín chỉ

- Tự động phát hành sau khi duyệt
- Quản lý ví carbon
- Certificate hash

### Tab 4: Báo cáo

- Thống kê tổng hợp
- Filter theo thời gian
- Export data

## 🔧 Development

### Cấu trúc thư mục

```text
├── frontend/           # Web interface
├── microservices/      # 5 services
├── docker-compose.yml  # Container orchestration
├── index.html         # Main frontend
├── script.js          # Frontend logic
└── styles.css         # Styling
```

### Health Check

```bash
curl http://localhost:3000/api/health/services
```

## 📝 API Endpoints

### Verification Service

- `GET /verification/requests` - Danh sách yêu cầu
- `POST /verification/requests` - Tạo yêu cầu mới
- `PUT /verification/requests/:id/status` - Cập nhật trạng thái

### Audit Service

- `GET /audit/pending` - Yêu cầu chờ duyệt
- `POST /audit/approve/:id` - Duyệt yêu cầu
- `POST /audit/reject/:id` - Từ chối yêu cầu

### Credit Service

- `POST /credits/issue` - Phát hành tín chỉ
- `GET /credits/wallet/:ownerId` - Xem ví
- `GET /credits` - Danh sách tín chỉ

### Report Service

- `GET /reports/summary` - Báo cáo tổng hợp
- `GET /reports/detailed` - Báo cáo chi tiết

## 🎯 Kết luận

Hệ thống hoàn chỉnh với 4 chức năng Carbon Verification & Audit, sẵn sàng production deployment với Docker microservices.
