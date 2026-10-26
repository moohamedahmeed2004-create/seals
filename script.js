let employees = JSON.parse(localStorage.getItem('office_employees')) || [
    { id: 1, name: "أحمد", salary: 5000, history: [] },
    { id: 2, name: "محمد", salary: 5000, history: [] }
];

let transactions = JSON.parse(localStorage.getItem('office_transactions')) || [];

document.addEventListener("DOMContentLoaded", () => {
    loadSalesData();
    renderTransactions();
    renderStats();
    if (document.getElementById('employeesTable')) {
        renderEmployees();
    }
});

function saveData() {
    localStorage.setItem('office_employees', JSON.stringify(employees));
    localStorage.setItem('office_transactions', JSON.stringify(transactions));
}

function loadSalesData() {
    const salesSelect = document.getElementById('salesSelect');
    const salesList = document.getElementById('salesList');
    
    if (salesSelect) {
        salesSelect.innerHTML = employees.map(e => `<option value="${e.name}">${e.name}</option>`).join('');
    }
    if (salesList) {
        salesList.innerHTML = employees.map(e => `<li><i class="fas fa-user"></i> ${e.name}</li>`).join('');
    }
}

function handleTypeChange() {
    const type = document.getElementById('typeSelect').value;
    const appGroup = document.getElementById('appGroup');
    appGroup.style.display = (type === 'ابليكشن') ? 'block' : 'none';
}

function handleAppChange() {
    const appSelect = document.getElementById('appSelect').value;
    const customAppGroup = document.getElementById('customAppGroup');
    customAppGroup.style.display = (appSelect === 'other') ? 'block' : 'none';
}

function calculateCommission() {
    const amount = parseFloat(document.getElementById('amountInput').value) || 0;
    const rate = parseFloat(document.getElementById('rateInput').value) || 0;
    const commission = (amount * rate) / 100;
    document.getElementById('calculatedCommission').innerText = `${commission.toFixed(2)} ج.م`;
}

// إضافة / تعديل سحبة
const transactionForm = document.getElementById('transactionForm');
if (transactionForm) {
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const editIndex = parseInt(document.getElementById('editIndex').value);
        const salesName = document.getElementById('salesSelect').value;
        const type = document.getElementById('typeSelect').value;
        
        let appName = "-";
        if (type === 'ابليكشن') {
            const appSelect = document.getElementById('appSelect').value;
            appName = (appSelect === 'other') ? document.getElementById('customAppName').value : appSelect;
        }

        const amount = parseFloat(document.getElementById('amountInput').value);
        const rate = parseFloat(document.getElementById('rateInput').value);
        const commission = (amount * rate) / 100;
        const now = new Date();

        const txData = {
            salesName,
            type,
            appName,
            amount,
            rate,
            commission,
            date: editIndex > -1 ? transactions[editIndex].date : now.toISOString(),
            dateFormatted: editIndex > -1 ? transactions[editIndex].dateFormatted : `${now.toLocaleDateString('ar-EG')} - ${now.toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`
        };

        if (editIndex > -1) {
            transactions[editIndex] = txData;
        } else {
            transactions.unshift(txData);
        }

        saveData();
        renderTransactions();
        renderStats();
        closeModal();
    });
}

function renderTransactions() {
    const tableBody = document.getElementById('transactionsTable');
    if (!tableBody) return;

    tableBody.innerHTML = transactions.map((t, index) => `
        <tr>
            <td><b>${t.salesName}</b></td>
            <td>${t.type}</td>
            <td>${t.appName}</td>
            <td>${t.amount.toLocaleString()} ج.م</td>
            <td>${t.rate}%</td>
            <td style="color: #38bdf8; font-weight: bold;">${t.commission.toLocaleString()} ج.م</td>
            <td>${t.dateFormatted}</td>
            <td>
                <button class="btn-icon btn-edit" title="تعديل" onclick="editTransaction(${index})"><i class="fas fa-pen"></i></button>
                <button class="btn-icon btn-delete" title="حذف" onclick="deleteTransaction(${index})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function editTransaction(index) {
    const t = transactions[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('modalTitle').innerText = "تعديل العملية";
    document.getElementById('submitBtnText').innerText = "تعديل العملية";
    
    document.getElementById('salesSelect').value = t.salesName;
    document.getElementById('typeSelect').value = t.type;
    handleTypeChange();

    if (t.type === 'ابليكشن') {
        const appSelect = document.getElementById('appSelect');
        if ([...appSelect.options].some(o => o.value === t.appName)) {
            appSelect.value = t.appName;
            document.getElementById('customAppGroup').style.display = 'none';
        } else {
            appSelect.value = 'other';
            document.getElementById('customAppGroup').style.display = 'block';
            document.getElementById('customAppName').value = t.appName;
        }
    }

    document.getElementById('amountInput').value = t.amount;
    document.getElementById('rateInput').value = t.rate;
    calculateCommission();
    
    openModal();
}

function deleteTransaction(index) {
    if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
        transactions.splice(index, 1);
        saveData();
        renderTransactions();
        renderStats();
    }
}

function renderStats() {
    if (!document.getElementById('todayAmount')) return;

    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayAmount = 0, monthAmount = 0;
    let todayCount = 0, monthCount = 0;

    transactions.forEach(t => {
        const txDate = new Date(t.date);
        
        if (txDate.toDateString() === todayStr) {
            todayAmount += t.amount;
            todayCount++;
        }

        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            monthAmount += t.amount;
            monthCount++;
        }
    });

    document.getElementById('todayAmount').innerText = `${todayAmount.toLocaleString()} ج.م`;
    document.getElementById('monthAmount').innerText = `${monthAmount.toLocaleString()} ج.م`;
    document.getElementById('todayCount').innerText = todayCount;
    document.getElementById('monthCount').innerText = monthCount;
}

// --- إدارة الموظفين والسُلف والخصومات مع التواريخ والملحوظات ---
function renderEmployees() {
    const table = document.getElementById('employeesTable');
    if (!table) return;

    table.innerHTML = employees.map(e => {
        if (!e.history) e.history = [];

        // حساب إجمالي السلف والخصومات والعمولات
        const totalAdvances = e.history.filter(h => h.type === 'سلفة').reduce((sum, h) => sum + h.amount, 0);
        const totalDeductions = e.history.filter(h => h.type === 'خصم').reduce((sum, h) => sum + h.amount, 0);
        
        const totalCommissions = transactions
            .filter(t => t.salesName === e.name)
            .reduce((sum, t) => sum + t.commission, 0);

        const netSalary = e.salary + totalCommissions - totalAdvances - totalDeductions;

        return `
            <tr>
                <td><b>${e.name}</b></td>
                <td>${e.salary.toLocaleString()} ج.م</td>
                <td style="color: #facc15;">${totalAdvances.toLocaleString()} ج.م</td>
                <td style="color: #f87171;">${totalDeductions.toLocaleString()} ج.م</td>
                <td style="color: #4ade80;">${totalCommissions.toLocaleString()} ج.م</td>
                <td style="font-size: 1.1rem; font-weight: bold; color: #fff;">${netSalary.toLocaleString()} ج.م</td>
                <td>
                    <button class="btn-action btn-advance" onclick="openActionModal(${e.id}, 'سلفة')">+ سلفة</button>
                    <button class="btn-action btn-deduct" onclick="openActionModal(${e.id}, 'خصم')">+ خصم</button>
                    <button class="btn-action btn-history" onclick="viewHistory(${e.id})"><i class="fas fa-list"></i> السجل</button>
                    <button class="btn-icon btn-delete" title="حذف الموظف" onclick="deleteEmployee(${e.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// فتح نافذة سلفة أو خصم
function openActionModal(empId, type) {
    document.getElementById('actionEmpId').value = empId;
    document.getElementById('actionType').value = type;
    document.getElementById('actionModalTitle').innerText = `إضافة ${type}`;
    document.getElementById('actionModal').style.display = 'flex';
}

function closeActionModal() {
    document.getElementById('actionModal').style.display = 'none';
    document.getElementById('actionForm').reset();
}

// حفظ السلفة أو الخصم مع التوقيت والسبب
const actionForm = document.getElementById('actionForm');
if (actionForm) {
    actionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const empId = parseInt(document.getElementById('actionEmpId').value);
        const type = document.getElementById('actionType').value;
        const amount = parseFloat(document.getElementById('actionAmount').value);
        const note = document.getElementById('actionNote').value;
        const now = new Date();

        const emp = employees.find(e => e.id === empId);
        if (emp) {
            if (!emp.history) emp.history = [];
            emp.history.unshift({
                type,
                amount,
                note,
                dateFormatted: `${now.toLocaleDateString('ar-EG')} - ${now.toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`
            });
            saveData();
            renderEmployees();
            closeActionModal();
        }
    });
}

// عرض كشف حساب السُلف والخصومات للموظف
function renderScanLogs() {
    const tableBody = document.getElementById('scanLogTable');
    if (!tableBody) return;
    let scanRecords = JSON.parse(localStorage.getItem('office_scans')) || [];
    
    if (scanRecords.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">لا توجد سجلات حضور حتى الآن</td></tr>`;
    } else {
        tableBody.innerHTML = scanRecords.map(s => `
            <tr>
                <td><b>${s.salesName}</b></td>
                <td style="color: #38bdf8;">${s.dateFormatted}</td>
                <td><span style="color: ${s.status.includes('متأخر') ? '#f87171' : '#4ade80'}; font-weight:bold;">${s.status}</span></td>
            </tr>
        `).join('');
    }
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

function deleteEmployee(empId) {
    if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
        employees = employees.filter(e => e.id !== empId);
        saveData();
        renderEmployees();
        loadSalesData();
    }
}

const empForm = document.getElementById('empForm');
if (empForm) {
    empForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('empName').value;
        const salary = parseFloat(document.getElementById('empSalary').value);

        employees.push({ id: Date.now(), name, salary, history: [] });
        saveData();
        renderEmployees();
        loadSalesData();
        closeEmpModal();
        empForm.reset();
    });
}

function openModal() { document.getElementById('transactionModal').style.display = 'flex'; }
function closeModal() { 
    document.getElementById('transactionModal').style.display = 'none';
    document.getElementById('transactionForm').reset();
    document.getElementById('editIndex').value = "-1";
    document.getElementById('modalTitle').innerText = "إضافة عملية سحب / تمويل";
    document.getElementById('submitBtnText').innerText = "حفظ العملية";
    document.getElementById('calculatedCommission').innerText = '0 ج.م';
}
function openEmpModal() { document.getElementById('empModal').style.display = 'flex'; }
function closeEmpModal() { document.getElementById('empModal').style.display = 'none'; }