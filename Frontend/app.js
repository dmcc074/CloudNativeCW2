const API_BASE = "http://localhost:7071/api";

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();

    // Wire up the upload form
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
});

async function loadDashboard() {
    try {
        // 1. Fetch All Data
        const response = await fetch(`${API_BASE}/GetReports`);
        if (!response.ok) throw new Error("API Offline");
        const reports = await response.json();

        // 2. Calculate Statistics 
        const total = reports.length;
        const verified = reports.filter(r => r.status === 'Verified' || r.status === 'real').length;
        const review = reports.filter(r => r.status === 'Under Review' || r.status === 'potential_fake').length;
        const flagged = reports.filter(r => r.status === 'Flagged' || r.status === 'fake').length;

        // Update DOM - Stats Cards
        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-verified').innerText = verified;
        document.getElementById('stat-review').innerText = review;
        document.getElementById('stat-flagged').innerText = flagged;

        // Update DOM - Ledger Stats [cite: 83, 85]
        document.getElementById('stat-blocks').innerText = total;
        if (reports.length > 0) {
            document.getElementById('latest-hash').innerText = reports[0].hash; // reports[0] is newest
        }

        // 3. Render "Recent Reports" Feed 
        // Show first 5 items from the list
        renderFeed(reports.slice(0, 5));

        // 4. Render "Verification Queue" 
        // Filter only items that need review
        const itemsToReview = reports.filter(r => r.status === 'Under Review' || r.status === 'potential_fake');
        renderQueue(itemsToReview);

    } catch (error) {
        console.error("Dashboard Error:", error);
        alert("Failed to load dashboard data. Is the backend running?");
    }
}

function renderFeed(reports) {
    const container = document.getElementById('recent-reports-feed');
    container.innerHTML = '';

    reports.forEach(report => {
        // Dynamic Badge Color
        let badgeClass = 'bg-secondary';
        if (report.status === 'Verified' || report.status === 'real') badgeClass = 'bg-success';
        if (report.status === 'Under Review') badgeClass = 'bg-warning text-dark';
        if (report.status === 'Flagged') badgeClass = 'bg-danger';

        const item = `
            <div class="list-group-item p-3">
                <div class="d-flex align-items-center">
                    <img src="${report.mediaUrl}" class="report-img me-3">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-0 fw-bold">${report.title}</h6>
                            <span class="badge ${badgeClass}">${report.status}</span>
                        </div>
                        <small class="text-muted">Uploaded by: ${report.creatorId} • ${(report.aiConfidenceScore * 100).toFixed(0)}% AI Score</small>
                        <span class="hash-text mt-1"><i class="fas fa-fingerprint"></i> ${report.hash}</span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += item;
    });
}

function renderQueue(reports) {
    const container = document.getElementById('verification-queue');
    container.innerHTML = '';

    if (reports.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-muted">All caught up! No pending reviews.</div>';
        return;
    }

    reports.forEach(report => {
        const item = `
            <div class="list-group-item p-3 border-start border-warning border-3">
                <div class="d-flex justify-content-between mb-2">
                    <small class="fw-bold">Report #${report.hash.substring(0, 6)}</small>
                    <small class="text-danger">Priority</small>
                </div>
                <p class="mb-2 small">${report.title}</p>
                <div class="d-grid gap-2 d-md-flex">
                    <button class="btn btn-sm btn-outline-success flex-grow-1" onclick="mockAction('Verify', '${report.id}')">Verify</button>
                    <button class="btn btn-sm btn-outline-danger flex-grow-1" onclick="mockAction('Flag', '${report.id}')">Flag</button>
                </div>
            </div>
        `;
        container.innerHTML += item;
    });
}

// Mock Action for Buttons (Since we don't have an Update API yet)
function mockAction(action, id) {
    alert(`${action} action triggered for report ID: ${id}\n(Feature pending Backend Phase 3)`);
}

// Re-using the Upload Logic from previous step
async function handleUpload(e) {
    e.preventDefault();
    // ... (Use the same upload logic as provided in the previous turn) ...
    // Note: For brevity, ensure you copy the toBase64 helper and fetch logic here.
    alert("Demo: Upload functionality would trigger here. Copy code from previous app.js");
}