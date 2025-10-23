// API Configuration
const API_BASE_URL = '/api'; // Proxy through nginx to API Gateway

// Data storage
let verificationRequests = [];
let issuedCredits = [
    {
        id: 'CC1703123456789',
        ownerId: 'Nguyễn Văn A',
        evOwner: 'Nguyễn Văn A',
        amount: 15.5,
        co2Reduced: 155,
        issueDate: '2024-01-15',
        certificateHash: 'abc123def456',
        verificationRequestId: 'VR001',
        status: 'active'
    },
    {
        id: 'CC1703123456790',
        ownerId: 'Trần Thị B',
        evOwner: 'Trần Thị B',
        amount: 22.3,
        co2Reduced: 223,
        issueDate: '2024-01-20',
        certificateHash: 'def456ghi789',
        verificationRequestId: 'VR002',
        status: 'active'
    },
    {
        id: 'CC1703123456791',
        ownerId: 'Lê Văn C',
        evOwner: 'Lê Văn C',
        amount: 18.7,
        co2Reduced: 187,
        issueDate: '2024-01-25',
        certificateHash: 'ghi789jkl012',
        verificationRequestId: 'VR003',
        status: 'active'
    }
];
let reportData = [];

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', function () {
    loadSampleData(); // Load sample data first
    loadVerificationRequests();
    loadPendingApprovals();
    loadApprovedCredits();
    generateSampleReportData();
});

// Chuyển đổi tab
function showTab(tabName) {
    // Ẩn tất cả tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Bỏ active từ tất cả tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Hiển thị tab được chọn
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');

    // Load dữ liệu cho tab tương ứng
    switch (tabName) {
        case 'verification':
            loadVerificationRequests();
            break;
        case 'approval':
            loadPendingApprovals();
            break;
        case 'issuance':
            loadApprovedCredits();
            break;
        case 'reports':
            generateReport();
            break;
    }
}

// Load danh sách yêu cầu xác minh
async function loadVerificationRequests() {
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '<p>Đang tải dữ liệu...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/verification/requests`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        verificationRequests = data.requests || [];

        requestsList.innerHTML = '';

        if (verificationRequests.length === 0) {
            requestsList.innerHTML = '<p>Không có yêu cầu xác minh nào.</p>';
            return;
        }

        verificationRequests.forEach(request => {
            const requestCard = createRequestCard(request);
            requestsList.appendChild(requestCard);
        });
    } catch (error) {
        console.error('Error loading verification requests:', error);
        requestsList.innerHTML = '<p>Lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>';

        // Fallback to sample data for demo
        loadSampleData();
    }
}

// Load sample data for demo purposes
function loadSampleData() {
    verificationRequests = [
        {
            id: 'REQ001',
            evOwner: 'Nguyễn Văn An',
            evModel: 'Tesla Model 3',
            licensePlate: '30A-12345',
            createdAt: '2024-10-15T10:00:00Z',
            status: 'pending',
            tripData: { totalKm: 1250 },
            co2Calculation: { totalReduction: 187.5 },
            documents: ['trip_data.json', 'vehicle_registration.pdf'],
            verificationNotes: ''
        },
        {
            id: 'REQ002',
            evOwner: 'Trần Thị Bình',
            evModel: 'VinFast VF8',
            licensePlate: '29B-67890',
            createdAt: '2024-10-14T10:00:00Z',
            status: 'in-review',
            tripData: { totalKm: 890 },
            co2Calculation: { totalReduction: 133.5 },
            documents: ['trip_data.json', 'vehicle_registration.pdf'],
            verificationNotes: 'Đang kiểm tra dữ liệu hành trình'
        },
        {
            id: 'REQ003',
            evOwner: 'Lê Văn Cường',
            evModel: 'Hyundai Kona Electric',
            licensePlate: '51C-11111',
            createdAt: '2024-10-12T10:00:00Z',
            status: 'verified',
            tripData: { totalKm: 1500 },
            co2Calculation: { totalReduction: 225 },
            documents: ['trip_data.json', 'vehicle_registration.pdf', 'insurance.pdf'],
            verificationNotes: 'Đã xác minh thành công. Dữ liệu hành trình chính xác.'
        },
        {
            id: 'REQ004',
            evOwner: 'Phạm Thị Dung',
            evModel: 'BMW i3',
            licensePlate: '43F-22222',
            createdAt: '2024-10-10T10:00:00Z',
            status: 'verified',
            tripData: { totalKm: 980 },
            co2Calculation: { totalReduction: 147 },
            documents: ['trip_data.json', 'vehicle_registration.pdf'],
            verificationNotes: 'Xác minh hoàn tất. Sẵn sàng phát hành tín chỉ.'
        },
        {
            id: 'REQ005',
            evOwner: 'Hoàng Văn Em',
            evModel: 'Nissan Leaf',
            licensePlate: '92H-33333',
            createdAt: '2024-10-08T10:00:00Z',
            status: 'verified',
            tripData: { totalKm: 1200 },
            co2Calculation: { totalReduction: 180 },
            documents: ['trip_data.json', 'vehicle_registration.pdf', 'maintenance_record.pdf'],
            verificationNotes: 'Dữ liệu đã được xác thực. Chờ phát hành tín chỉ carbon.'
        }
    ];

    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';
    verificationRequests.forEach(request => {
        const requestCard = createRequestCard(request);
        requestsList.appendChild(requestCard);
    });
}

// Tạo card yêu cầu
function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.onclick = () => viewRequestDetails(request.id);

    card.innerHTML = `
        <div class="request-header">
            <div class="request-id">${request.id}</div>
            <div class="status-badge status-${request.status}">
                ${getStatusText(request.status)}
            </div>
        </div>
        <div class="request-info">
            <div class="info-item">
                <div class="info-label">Chủ xe</div>
                <div class="info-value">${request.evOwner}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Xe điện</div>
                <div class="info-value">${request.evModel}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Biển số</div>
                <div class="info-value">${request.licensePlate}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tổng km</div>
                <div class="info-value">${(request.tripData?.totalKm || 0).toLocaleString()} km</div>
            </div>
            <div class="info-item">
                <div class="info-label">CO₂ giảm</div>
                <div class="info-value">${request.co2Calculation?.totalReduction || 0} kg</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tín chỉ yêu cầu</div>
                <div class="info-value">${((request.co2Calculation?.totalReduction || 0) / 10).toFixed(2)}</div>
            </div>
        </div>
        <div class="action-buttons">
            <button class="btn btn-view" onclick="event.stopPropagation(); viewRequestDetails('${request.id}')">
                Xem chi tiết
            </button>
            ${request.status === 'pending' ? `
                <button class="btn btn-approve" onclick="event.stopPropagation(); startVerification('${request.id}')">
                    Bắt đầu xác minh
                </button>
            ` : ''}
        </div>
    `;

    return card;
}

// Lấy text trạng thái
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xác minh',
        'in-review': 'Đang xem xét',
        'verified': 'Đã xác minh',
        'rejected': 'Từ chối',
        'issued': 'Đã phát hành'
    };
    return statusMap[status] || status;
}

// Xem chi tiết yêu cầu
function viewRequestDetails(requestId) {
    const request = verificationRequests.find(r => r.id === requestId);
    if (!request) return;

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2>Chi tiết Yêu cầu ${request.id}</h2>
        
        <div class="detail-section">
            <h3>Thông tin Chủ xe</h3>
            <div class="detail-grid">
                <div class="info-item">
                    <div class="info-label">Họ tên</div>
                    <div class="info-value">${request.evOwner}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Xe điện</div>
                    <div class="info-value">${request.evModel}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Biển số</div>
                    <div class="info-value">${request.licensePlate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ngày nộp</div>
                    <div class="info-value">${formatDate(request.createdAt || request.submissionDate)}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Dữ liệu Hành trình</h3>
            <div class="co2-calculation">
                <div class="detail-grid">
                    <div class="info-item">
                        <div class="info-label">Tổng quãng đường</div>
                        <div class="info-value">${(request.tripData?.totalKm || 0).toLocaleString()} km</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">CO₂ giảm phát thải</div>
                        <div class="info-value">${request.co2Calculation?.totalReduction || 0} kg</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Tín chỉ carbon yêu cầu</div>
                        <div class="info-value">${((request.co2Calculation?.totalReduction || 0) / 10).toFixed(2)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Hệ số quy đổi</div>
                        <div class="info-value">0.15 kg CO₂/km</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Tài liệu đính kèm</h3>
            <ul>
                ${request.documents.map(doc => `<li>📄 ${doc}</li>`).join('')}
            </ul>
        </div>
        
        ${request.verificationNotes ? `
            <div class="detail-section">
                <h3>Ghi chú xác minh</h3>
                <div class="verification-notes">
                    ${request.verificationNotes}
                </div>
            </div>
        ` : ''}
        
        <div class="action-buttons">
            ${request.status === 'pending' || request.status === 'in-review' ? `
                <button class="btn btn-approve" onclick="approveRequest('${request.id}')">
                    ✅ Duyệt yêu cầu
                </button>
                <button class="btn btn-reject" onclick="rejectRequest('${request.id}')">
                    ❌ Từ chối yêu cầu
                </button>
            ` : ''}
            ${request.status === 'verified' ? `
                <button class="btn btn-issue" onclick="issueCredits('${request.id}')">
                    🎫 Phát hành tín chỉ
                </button>
            ` : ''}
        </div>
    `;

    document.getElementById('requestModal').style.display = 'block';
}

// Bắt đầu xác minh
async function startVerification(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/verification/requests/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'in-review',
                verificationNotes: 'Đã bắt đầu quá trình xác minh dữ liệu'
            })
        });

        if (response.ok) {
            loadVerificationRequests();
            alert('Đã bắt đầu xác minh yêu cầu ' + requestId);
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error starting verification:', error);
        // Fallback to local update for demo
        const request = verificationRequests.find(r => r.id === requestId);
        if (request) {
            request.status = 'in-review';
            request.verificationNotes = 'Đã bắt đầu quá trình xác minh dữ liệu';
            loadVerificationRequests();
            alert('Đã bắt đầu xác minh yêu cầu ' + requestId);
        }
    }
}

// Duyệt yêu cầu
async function approveRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/verification/requests/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'verified',
                verificationNotes: 'Đã xác minh và duyệt thành công. Dữ liệu hành trình chính xác.'
            })
        });

        if (response.ok) {
            closeModal();
            loadVerificationRequests();
            loadPendingApprovals();
            alert('Đã duyệt yêu cầu ' + requestId);
        } else {
            throw new Error('Failed to approve request');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        // Fallback to local update for demo
        const request = verificationRequests.find(r => r.id === requestId);
        if (request) {
            request.status = 'verified';
            request.verificationNotes = 'Đã xác minh và duyệt thành công. Dữ liệu hành trình chính xác.';
            closeModal();
            loadVerificationRequests();
            loadPendingApprovals();
            alert('Đã duyệt yêu cầu ' + requestId);
        }
    }
}

// Từ chối yêu cầu
async function rejectRequest(requestId) {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason) {
        try {
            const response = await fetch(`${API_BASE_URL}/audit/reject/${requestId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason,
                    notes: reason
                })
            });

            if (response.ok) {
                closeModal();
                loadVerificationRequests();
                alert('Đã từ chối yêu cầu ' + requestId);
            } else {
                throw new Error('Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            // Fallback to local update for demo
            const request = verificationRequests.find(r => r.id === requestId);
            if (request) {
                request.status = 'rejected';
                request.verificationNotes = 'Từ chối: ' + reason;
                closeModal();
                loadVerificationRequests();
                alert('Đã từ chối yêu cầu ' + requestId);
            }
        }
    }
}

// Load danh sách chờ duyệt
function loadPendingApprovals() {
    const pendingApprovals = document.getElementById('pendingApprovals');
    const verifiedRequests = verificationRequests.filter(r => r.status === 'verified');

    pendingApprovals.innerHTML = '';

    if (verifiedRequests.length === 0) {
        pendingApprovals.innerHTML = '<p>Không có yêu cầu nào chờ phát hành tín chỉ.</p>';
        return;
    }

    // Thêm header thống kê
    const approvalHeader = document.createElement('div');
    approvalHeader.className = 'approval-header';
    approvalHeader.innerHTML = `
        <h3>📋 Danh sách Yêu cầu Chờ Phát hành Tín chỉ</h3>
        <div class="approval-stats">
            <div class="approval-stat">
                <div class="approval-stat-number">${verifiedRequests.length}</div>
                <div class="approval-stat-label">Yêu cầu chờ duyệt</div>
            </div>
            <div class="approval-stat">
                <div class="approval-stat-number">${verifiedRequests.reduce((sum, req) => sum + ((req.co2Calculation?.totalReduction || 0) / 10), 0).toFixed(1)}</div>
                <div class="approval-stat-label">Tín chỉ sẽ phát hành</div>
            </div>
            <div class="approval-stat">
                <div class="approval-stat-number">${verifiedRequests.reduce((sum, req) => sum + (req.co2Calculation?.totalReduction || 0), 0)}</div>
                <div class="approval-stat-label">CO₂ giảm (kg)</div>
            </div>
        </div>
    `;
    pendingApprovals.appendChild(approvalHeader);

    // Thêm danh sách yêu cầu
    const requestsContainer = document.createElement('div');
    requestsContainer.className = 'requests-container';

    verifiedRequests.forEach(request => {
        const card = createApprovalCard(request);
        requestsContainer.appendChild(card);
    });

    pendingApprovals.appendChild(requestsContainer);
}

// Tạo card duyệt
function createApprovalCard(request) {
    const card = document.createElement('div');
    card.className = 'request-card';

    card.innerHTML = `
        <div class="request-header">
            <div class="request-id">${request.id}</div>
            <div class="status-badge status-verified">Đã xác minh</div>
        </div>
        <div class="request-info">
            <div class="info-item">
                <div class="info-label">Chủ xe</div>
                <div class="info-value">${request.evOwner}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tín chỉ sẽ phát hành</div>
                <div class="info-value">${((request.co2Calculation?.totalReduction || 0) / 10).toFixed(2)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">CO₂ giảm</div>
                <div class="info-value">${request.co2Calculation?.totalReduction || 0} kg</div>
            </div>
        </div>
        <div class="info-item">
            <div class="info-label">Ngày xác minh</div>
            <div class="info-value">${formatDate(request.createdAt)}</div>
        </div>
        <div class="action-buttons">
            <button class="btn btn-issue" onclick="issueCredits('${request.id}')">
                🎫 Phát hành tín chỉ
            </button>
            <button class="btn btn-view" onclick="viewRequestDetails('${request.id}')">
                👁️ Xem chi tiết
            </button>
        </div>
    `;

    return card;
}

// Phát hành tín chỉ
async function issueCredits(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/audit/approve/${requestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notes: 'Approved and credits issued by audit service'
            })
        });

        if (response.ok) {
            const result = await response.json();
            closeModal();
            loadPendingApprovals();
            loadApprovedCredits();
            alert(`Đã phát hành thành công ${result.creditsIssued || 'N/A'} tín chỉ carbon`);
        } else {
            throw new Error('Failed to issue credits');
        }
    } catch (error) {
        console.error('Error issuing credits:', error);
        // Fallback to local update for demo
        const request = verificationRequests.find(r => r.id === requestId);
        if (request && request.status === 'verified') {
            const creditId = 'CC' + Date.now();
            const creditsRequested = ((request.co2Calculation?.totalReduction || 0) / 10).toFixed(2);
            const issuedCredit = {
                id: creditId,
                requestId: request.id,
                evOwner: request.evOwner,
                amount: creditsRequested,
                co2Reduced: request.co2Calculation?.totalReduction || 0,
                issueDate: new Date().toISOString().split('T')[0],
                status: 'issued'
            };

            issuedCredits.push(issuedCredit);
            request.status = 'issued';
            request.creditId = creditId;

            // Thêm vào dữ liệu báo cáo
            reportData.push(issuedCredit);

            closeModal();
            loadPendingApprovals();
            loadApprovedCredits();
            alert(`Đã phát hành thành công ${creditsRequested} tín chỉ carbon với ID: ${creditId}`);
        }
    }
}

// Load tín chỉ đã phát hành
async function loadApprovedCredits() {
    const approvedCredits = document.getElementById('approvedCredits');
    approvedCredits.innerHTML = '<p>Đang tải dữ liệu...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/credits`);
        if (response.ok) {
            const data = await response.json();
            if (data.credits && data.credits.length > 0) {
                issuedCredits = data.credits;
            }
        } else {
            console.log('API not available, using sample data');
        }
    } catch (error) {
        console.log('Using sample data for credits');
    }

    approvedCredits.innerHTML = '';

    if (issuedCredits.length === 0) {
        approvedCredits.innerHTML = '<p>Chưa có tín chỉ nào được phát hành.</p>';
        return;
    }

    // Thêm header thống kê
    const statsHeader = document.createElement('div');
    statsHeader.className = 'stats-header';
    statsHeader.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${issuedCredits.length}</div>
                <div class="stat-label">Tín chỉ đã phát hành</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${issuedCredits.reduce((sum, credit) => sum + credit.amount, 0).toFixed(1)}</div>
                <div class="stat-label">Tổng tín chỉ</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${issuedCredits.reduce((sum, credit) => sum + credit.co2Reduced, 0)}</div>
                <div class="stat-label">CO₂ giảm (kg)</div>
            </div>
        </div>
    `;
    approvedCredits.appendChild(statsHeader);

    // Thêm danh sách tín chỉ
    const creditsContainer = document.createElement('div');
    creditsContainer.className = 'credits-container';

    issuedCredits.forEach(credit => {
        const card = createCreditCard(credit);
        creditsContainer.appendChild(card);
    });

    approvedCredits.appendChild(creditsContainer);
}

// Tạo card tín chỉ
function createCreditCard(credit) {
    const card = document.createElement('div');
    card.className = 'request-card';

    card.innerHTML = `
        <div class="request-header">
            <div class="request-id">Tín chỉ ${credit.id}</div>
            <div class="status-badge status-verified">Đã phát hành</div>
        </div>
        <div class="request-info">
            <div class="info-item">
                <div class="info-label">Chủ xe</div>
                <div class="info-value">${credit.ownerId || credit.evOwner}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Số lượng tín chỉ</div>
                <div class="info-value">${credit.amount}</div>
            </div>
            <div class="info-item">
                <div class="info-label">CO₂ giảm</div>
                <div class="info-value">${credit.co2Reduced} kg</div>
            </div>
            <div class="info-item">
                <div class="info-label">Ngày phát hành</div>
                <div class="info-value">${formatDate(credit.issueDate)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Certificate Hash</div>
                <div class="info-value">${credit.certificateHash}</div>
            </div>
        </div>
        <div class="request-actions">
            <button class="btn btn-info" onclick="viewCreditDetails('${credit.id}')">
                📄 Xem chi tiết
            </button>
            <button class="btn btn-success" onclick="downloadCertificate('${credit.id}')">
                📥 Tải chứng chỉ
            </button>
        </div>
    `;

    return card;
}

// Tạo dữ liệu báo cáo mẫu
function generateSampleReportData() {
    // Thêm một số dữ liệu mẫu cho báo cáo
    const sampleData = [
        {
            id: 'CC1697123456',
            evOwner: 'Phạm Văn Đức',
            amount: 25.5,
            co2Reduced: 255,
            issueDate: '2024-10-10'
        },
        {
            id: 'CC1697123457',
            evOwner: 'Hoàng Thị Lan',
            amount: 18.2,
            co2Reduced: 182,
            issueDate: '2024-10-12'
        }
    ];

    reportData.push(...sampleData);
}

// Tạo báo cáo
async function generateReport() {
    const fromDate = document.getElementById('fromDate')?.value || '2024-10-01';
    const toDate = document.getElementById('toDate')?.value || '2024-10-31';

    const reportSummary = document.getElementById('reportSummary');
    const reportDetails = document.getElementById('reportDetails');

    if (reportSummary) reportSummary.innerHTML = '<p>Đang tạo báo cáo...</p>';
    if (reportDetails) reportDetails.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/reports/summary?fromDate=${fromDate}&toDate=${toDate}`);
        if (response.ok) {
            const data = await response.json();

            // Hiển thị tóm tắt
            if (reportSummary) {
                reportSummary.innerHTML = `
                    <div class="summary-card">
                        <div class="summary-number">${data.summary.totalCreditsIssued.toFixed(1)}</div>
                        <div class="summary-label">Tổng tín chỉ phát hành</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${data.summary.totalCO2Reduced.toFixed(1)}</div>
                        <div class="summary-label">Tổng CO₂ giảm (kg)</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${data.summary.totalTransactions}</div>
                        <div class="summary-label">Số giao dịch</div>
                    </div>
                `;
            }

            // Get detailed credit data
            const creditResponse = await fetch(`${API_BASE_URL}/credits`);
            if (creditResponse.ok) {
                const creditData = await creditResponse.json();
                const filteredCredits = (creditData.credits || []).filter(credit => {
                    const issueDate = credit.issueDate.split('T')[0];
                    return issueDate >= fromDate && issueDate <= toDate;
                });

                if (reportDetails) {
                    if (filteredCredits.length === 0) {
                        reportDetails.innerHTML = '<p>Không có dữ liệu trong khoảng thời gian đã chọn.</p>';
                    } else {
                        reportDetails.innerHTML = `
                            <h3>Chi tiết Phát hành Tín chỉ</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                <thead>
                                    <tr style="background: #f8f9fa;">
                                        <th style="padding: 12px; border: 1px solid #ddd;">ID Tín chỉ</th>
                                        <th style="padding: 12px; border: 1px solid #ddd;">Chủ xe</th>
                                        <th style="padding: 12px; border: 1px solid #ddd;">Số lượng</th>
                                        <th style="padding: 12px; border: 1px solid #ddd;">CO₂ giảm (kg)</th>
                                        <th style="padding: 12px; border: 1px solid #ddd;">Ngày phát hành</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredCredits.map(credit => `
                                        <tr>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${credit.id}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${credit.ownerId}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${credit.amount}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${credit.co2Reduced}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(credit.issueDate)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;
                    }
                }
            }
        } else {
            throw new Error('Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        // Fallback to local data
        generateLocalReport(fromDate, toDate);
    }
}

// Fallback function for local report generation
function generateLocalReport(fromDate, toDate) {
    const filteredData = reportData.filter(item => {
        const issueDate = item.issueDate || item.issueDate;
        return issueDate >= fromDate && issueDate <= toDate;
    });

    // Tính toán tóm tắt
    const totalCredits = filteredData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalCO2 = filteredData.reduce((sum, item) => sum + parseFloat(item.co2Reduced || 0), 0);
    const totalTransactions = filteredData.length;

    // Hiển thị tóm tắt
    const reportSummary = document.getElementById('reportSummary');
    if (reportSummary) {
        reportSummary.innerHTML = `
            <div class="summary-card">
                <div class="summary-number">${totalCredits.toFixed(1)}</div>
                <div class="summary-label">Tổng tín chỉ phát hành</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${totalCO2.toFixed(1)}</div>
                <div class="summary-label">Tổng CO₂ giảm (kg)</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${totalTransactions}</div>
                <div class="summary-label">Số giao dịch</div>
            </div>
        `;
    }

    // Hiển thị chi tiết
    const reportDetails = document.getElementById('reportDetails');
    if (reportDetails) {
        if (filteredData.length === 0) {
            reportDetails.innerHTML = '<p>Không có dữ liệu trong khoảng thời gian đã chọn.</p>';
        } else {
            reportDetails.innerHTML = `
                <h3>Chi tiết Phát hành Tín chỉ</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #ddd;">ID Tín chỉ</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Chủ xe</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Số lượng</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">CO₂ giảm (kg)</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Ngày phát hành</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData.map(item => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${item.id}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${item.evOwner || item.ownerId}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${item.amount}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${item.co2Reduced}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(item.issueDate)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
}

// Xuất báo cáo Excel
function exportReport() {
    alert('Chức năng xuất Excel sẽ được triển khai trong phiên bản tiếp theo.');
}

// Lọc yêu cầu
function filterRequests() {
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    let filteredRequests = verificationRequests;

    if (searchTerm) {
        filteredRequests = filteredRequests.filter(request =>
            request.id.toLowerCase().includes(searchTerm) ||
            request.evOwner.toLowerCase().includes(searchTerm) ||
            request.licensePlate.toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter) {
        filteredRequests = filteredRequests.filter(request =>
            request.status === statusFilter
        );
    }

    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';

    filteredRequests.forEach(request => {
        const requestCard = createRequestCard(request);
        requestsList.appendChild(requestCard);
    });
}

// Đóng modal
function closeModal() {
    document.getElementById('requestModal').style.display = 'none';
}

// Format ngày
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Đóng modal khi click bên ngoài
window.onclick = function (event) {
    const modal = document.getElementById('requestModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Xem chi tiết tín chỉ
function viewCreditDetails(creditId) {
    const credit = issuedCredits.find(c => c.id === creditId);
    if (!credit) return;

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2>Chi tiết Tín chỉ Carbon</h2>
        <div class="detail-section">
            <h3>Thông tin Tín chỉ</h3>
            <div class="detail-grid">
                <div class="info-item">
                    <div class="info-label">ID Tín chỉ</div>
                    <div class="info-value">${credit.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Chủ sở hữu</div>
                    <div class="info-value">${credit.evOwner}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Số lượng tín chỉ</div>
                    <div class="info-value">${credit.amount}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">CO₂ giảm phát thải</div>
                    <div class="info-value">${credit.co2Reduced} kg</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ngày phát hành</div>
                    <div class="info-value">${formatDate(credit.issueDate)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Trạng thái</div>
                    <div class="info-value">
                        <span class="status-badge status-verified">Đang hoạt động</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Thông tin Bảo mật</h3>
            <div class="detail-grid">
                <div class="info-item">
                    <div class="info-label">Certificate Hash</div>
                    <div class="info-value" style="font-family: monospace; word-break: break-all;">${credit.certificateHash}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Yêu cầu xác minh gốc</div>
                    <div class="info-value">${credit.verificationRequestId}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Quy đổi Carbon</h3>
            <div class="co2-calculation">
                <div class="detail-grid">
                    <div class="info-item">
                        <div class="info-label">Tỷ lệ quy đổi</div>
                        <div class="info-value">1 tín chỉ = 10 kg CO₂</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Giá trị môi trường</div>
                        <div class="info-value">${credit.co2Reduced} kg CO₂ được giảm</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('requestModal').style.display = 'block';
}

// Tải chứng chỉ tín chỉ
function downloadCertificate(creditId) {
    const credit = issuedCredits.find(c => c.id === creditId);
    if (!credit) return;

    // Tạo nội dung chứng chỉ
    const certificateContent = `
CHỨNG CHỈ TÍN CHỈ CARBON
========================

ID Tín chỉ: ${credit.id}
Chủ sở hữu: ${credit.evOwner}
Số lượng: ${credit.amount} tín chỉ
CO₂ giảm phát thải: ${credit.co2Reduced} kg
Ngày phát hành: ${formatDate(credit.issueDate)}
Certificate Hash: ${credit.certificateHash}

Chứng chỉ này xác nhận việc giảm phát thải CO₂ 
thông qua việc sử dụng xe điện thay vì xe xăng.

Được phát hành bởi: Carbon Verification & Audit System
    `;

    // Tạo và tải file
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Carbon_Certificate_${credit.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('Chứng chỉ đã được tải xuống!');
}