# Personal Finance Tracker - Features & Business Logic

## 1. TRANSACTION MANAGEMENT (Manajemen Transaksi)

### Fitur:

- Mencatat setiap transaksi (income, expense, transfer)
- Tracking saldo fund source secara real-time
- Kategorisasi transaksi otomatis
- Filter & search transaksi berdasarkan tanggal, kategori, amount

### Logika Bisnis:

**A. Transaksi Biasa (Income/Expense)**

```
Transaction Type: INCOME
- Amount ditambah ke destination_fund_id
- Category harus tipe 'income'
- Source fund bisa null

Transaction Type: EXPENSE
- Amount dikurangi dari source_fund_id
- Category harus tipe 'expense'
- Destination fund bisa null

Transaction Type: TRANSFER
- Amount dikurangi dari source_fund_id
- Amount ditambah ke destination_fund_id (bisa beda currency)
- Category bisa null
- Kedua fund harus ada
```

**B. Balance Update Logic**

```
Saat transaction dibuat/update/delete:
1. Retrieve fund_sources balance
2. Hitung perubahan amount
3. Update balance fund sumber & tujuan
4. Log transaction untuk audit trail
5. Trigger update budget spending jika ada
```

**C. Validasi Transaksi**

```
- Cegah negative balance (opsional, bisa config per user)
- Cegah duplicate transaksi (check dalam 5 detik terakhir)
- Validate tanggal transaksi tidak boleh >30 hari ke depan
- Cegah transfer ke fund yang sama
```

---

## 2. BUDGET MANAGEMENT (Manajemen Anggaran)

### Fitur:

- Buat budget dengan periode (monthly, quarterly, yearly)
- Set spending limit per kategori
- Real-time tracking spending vs budget
- Alert jika pengeluaran mencapai threshold
- Laporan budget performance

### Logika Bisnis:

**A. Budget Creation**

```
1. User buat budget dengan:
   - Nama & periode (monthly/quarterly/yearly)
   - Total limit (opsional)
   - Alert threshold (default 80%)
   - Start & end date

2. Budget items dibuat per kategori:
   - Kategori harus expense type
   - Set planned_amount untuk setiap kategori
   - Total planned tidak boleh melebihi budget limit (opsional)
```

**B. Spending Calculation**

```
Setiap transaksi expense dibuat:
1. Cari budget aktif yang mencakup transaction_date
2. Cari budget_item dengan kategori matching
3. Update spent_amount di budget_item:
   spent_amount = SUM(transactions.amount)
   WHERE budget_id = X AND category_id = Y
   AND transaction_date BETWEEN budget.start_date AND budget.end_date

4. Calculate percentage: (spent_amount / planned_amount) * 100
5. Jika percentage >= alert_threshold:
   - Trigger alert/notification ke user
   - Mark budget_item status sebagai "warning" atau "exceeded"
```

**C. Multiple Budget Handling**

```
Jika user punya 2 budget (Monthly & Yearly):
- Transaksi hitung ke kedua budget
- Alert hanya di budget yang applicable
- User bisa lihat progress di kedua budget
```

---

## 3. RECURRING TRANSACTIONS (Transaksi Berulang)

### Fitur:

- Setup transaksi yang berulang (gaji, subscription, dll)
- Auto-generate transaksi sesuai jadwal
- Enable/disable recurring pattern
- Kelola transaksi berulang (edit, skip, delete instance)

### Logika Bisnis:

**A. Pattern Setup**

```
Recurring pattern dengan:
- Frequency: daily, weekly, biweekly, monthly, quarterly, yearly
- Interval: repeat setiap N frequency
- Start & end date
- Next execution date

Contoh:
- Gaji: frequency=monthly, interval=1, start_date=2024-01-15
- Cicilan: frequency=monthly, interval=2 (every 2 months)
- Daily allowance: frequency=daily, interval=1
```

**B. Auto-Generation Logic**

```
Scheduler job (background task):
1. Cari recurring_patterns dengan is_active=true
2. Filter where next_execution_date <= TODAY
3. Untuk setiap pattern:
   a. Buat transaction baru
   b. Copy dari template (amount, category, fund_source)
   c. Set transaction_date = next_execution_date
   d. Hitung next_execution_date:
      - Monthly: next_date = current + 1 month
      - Weekly: next_date = current + 7 days
      - Biweekly: next_date = current + 14 days
      dll
   e. Jika next_date > end_date: set is_active=false
   f. Update fund_sources balance
   g. Create transaction record
4. Trigger notification ke user
```

**C. Transaction Linking**

```
recurring_pattern_id di transactions table:
- Link setiap recurring transaksi ke patternnya
- User bisa lihat riwayat semua transaksi dari pattern
- User bisa edit transaksi recurring:
  - Edit one instance: ubah transaction itu saja
  - Edit series: ubah recurring pattern (affect future transactions)
```

---

## 4. CATEGORY MANAGEMENT (Manajemen Kategori)

### Fitur:

- Buat kategori custom (income/expense)
- Nested categories (parent-child)
- Category dengan warna & icon
- Sort kategori sesuai preferensi
- Disable kategori tanpa menghapus data

### Logika Bisnis:

**A. Category Hierarchy**

```
Contoh struktur:
EXPENSE
├── Housing (parent_id=null)
│   ├── Rent (parent_id=housing_id)
│   ├── Electricity (parent_id=housing_id)
│   └── Water (parent_id=housing_id)
├── Food (parent_id=null)
│   ├── Groceries (parent_id=food_id)
│   └── Dining Out (parent_id=food_id)

Saat user pilih kategori:
- Bisa pilih parent category (agregat spending)
- Atau pilih child category (detail spending)
```

**B. Category Usage Validation**

```
Saat delete kategori:
1. Cek ada transaksi dengan kategori ini
2. Jika ada:
   - Soft delete: set is_active=false
   - User tidak bisa pilih lagi, tapi data transaksi tetap
3. Jika tidak ada:
   - Hard delete: hapus totally

Saat delete parent category:
- Harus delete child categories dulu
- Atau reassign child ke parent lain
```

**C. Category Rules (Opsional Future Feature)**

```
User bisa set auto-categorization rules:
- Jika description contains "Indomaret" → kategori "Groceries"
- Jika amount > 100,000 → kategori "Major Purchase"
- Auto-categorize future transaksi
```

---

## 5. FINANCIAL GOALS (Target Finansial)

### Fitur:

- Set target finansial (saving, investment, debt payoff)
- Track progress menuju goal
- Priority setting
- Achievement tracking & celebration

### Logika Bisnis:

**A. Goal Types**

```
1. SAVINGS GOAL
   - Target: kumpulkan amount X sampai target_date
   - Progress: current_amount / target_amount
   - Contoh: "Tabung liburan Rp 50juta by 2025-12-31"

2. INVESTMENT GOAL
   - Track ROI target
   - Expected return vs actual
   - Contoh: "Investasi Rp 100juta dengan return 15%"

3. DEBT PAYOFF GOAL
   - Target: bayar utang X dalam N bulan
   - Progress: remaining debt
   - Contoh: "Lunasi cicilan motor dalam 24 bulan"

4. OTHER GOAL
   - Custom goals
```

**B. Progress Calculation**

```
Manual Update:
- User update current_amount via input
- Calculate percentage: (current_amount / target_amount) * 100

Auto Update (Optional):
- Link ke kategori spending tertentu
- Misal: goal "Save Rp 50juta" link ke kategori "Savings"
- Setiap income ke kategori savings → update current_amount automatically

Check Completion:
- Jika current_amount >= target_amount:
  - Set status = "completed"
  - Calculate actual vs target date
  - Show achievement message & badge
```

**C. Goal Analytics**

```
Dashboard menampilkan:
- Total goals: X
- Completed: Y
- On track: Z
- At risk: W (progress < expected)

Expected progress =
  (target_amount / total_months) * months_elapsed
  vs current_amount

Jika actual < expected: user dapat reminder
```

---

## 6. FUND SOURCES (Sumber Dana)

### Fitur:

- Manage multiple fund sources (bank, cash, credit card)
- Track balance per fund
- Fund types configuration
- Currency support

### Logika Bisnis:

**A. Fund Source Types**

```
BANK: untuk rekening bank (update manual atau API)
CASH: untuk uang tunai (update manual saja)
CREDIT_CARD: untuk kartu kredit (track outstanding)
WALLET: untuk e-wallet (update via API atau manual)
OTHER: custom types

Setiap type punya behavior berbeda di balance calculation
```

**B. Balance Calculation**

```
Balance Real-time =
  Initial balance
  + SUM(income transactions as destination_fund_id)
  - SUM(expense transactions as source_fund_id)
  + SUM(transfer in as destination_fund_id)
  - SUM(transfer out as source_fund_id)

Validation:
- Credit card balance bisa negative (utang)
- Cash & bank balance ideally tidak negative
- Configurable per fund per user
```

**C. Multi-Currency Support**

```
Jika transfer antar currency:
- Tambah field exchange_rate di transaction
- Contoh: transfer Rp 100,000 to USD account
  - Source: Rp 100,000 (IDR fund source)
  - Destination: ~$6.5 (USD fund source)
  - Exchange rate logged: 1 USD = 15,385 IDR

Display:
- Show setiap fund dalam currency-nya
- Dashboard total bisa convert ke base currency (IDR)
  dengan exchange rate terakhir
```

---

## 7. ANALYTICS & REPORTS (Laporan & Analitik)

### Fitur yang Bisa Dibangun:

- Income vs Expense trend
- Category spending breakdown
- Budget performance report
- Savings rate analysis
- Cashflow projection

### Logika Bisnis:

**A. Spending by Category**

```
Query:
SELECT
  c.name,
  SUM(t.amount) as total,
  COUNT(t.id) as transaction_count
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = ?
  AND t.type = 'expense'
  AND t.transaction_date BETWEEN ? AND ?
GROUP BY c.id, c.name
ORDER BY total DESC
```

**B. Monthly Trend**

```
Bulan | Income | Expense | Net
------|--------|---------|-----
Jan   | 5M     | 3M      | 2M
Feb   | 5M     | 3.5M    | 1.5M
Mar   | 5M     | 4M      | 1M

Bisa visualisasi dengan chart
```

**C. Cashflow Projection**

```
Predict 3 bulan ke depan:
1. Rata-rata monthly income & expense
2. Add recurring transactions yang sudah di-schedule
3. Project balance fund sources
4. Alert jika projected negative balance
```

---

## 8. NOTIFICATIONS & ALERTS

### Logika:

```
Alert triggers:
1. Budget exceeded (spent_amount >= planned_amount * 1.1)
2. Budget warning (spent_amount >= planned_amount * alert_threshold)
3. Fund balance low (balance <= minimum_threshold)
4. Recurring transaction not created (next_execution_date passed but not generated)
5. Goal at risk (progress < expected progress)
6. Large transaction (amount > user_defined_threshold)

Notification channels:
- In-app notification
- Email notification (optional)
- Push notification (mobile, optional)
```

---

## 9. DATA INTEGRITY & AUDIT

### Logika:

```
Transaction Audit Trail:
- Track siapa yang create/update/delete setiap transaksi
- Soft delete: jangan hapus data, hanya mark as deleted_at
- Revert transaction: bisa undo transaksi terakhir

Fund Source Reconciliation:
- User bisa reconcile actual balance dengan system balance
- Log perbedaan untuk investigation
- Adjust jika ada discrepancy

Backup & Recovery:
- Regular backup data user
- GDPR compliance: user bisa request export data
```

---

## 10. USER PREFERENCES & SETTINGS

### Fitur:

```
Currency settings:
- Default currency (IDR, USD, etc)
- Display format

Alert settings:
- Enable/disable notifikasi
- Alert threshold per budget
- Minimum balance threshold

Calculation rules:
- Allow negative balance? (per fund type)
- Budget calculation method (strict vs flexible)

Privacy:
- Data retention policy
- Data export
- Account deletion
```

---

## WORKFLOW EXAMPLE: Monthly Budget Tracking

```
1. User setup budget "November 2024" pada 1 Nov
   - Total limit: Rp 10,000,000
   - Items:
     - Food: 2,000,000
     - Transport: 1,000,000
     - Entertainment: 500,000
     - Other: 6,500,000

2. 5 Nov: User input expense Rp 600,000 (Food)
   - Transaction created
   - Budget_item.spent_amount = 600,000
   - Percentage = (600,000 / 2,000,000) * 100 = 30%
   - No alert (threshold 80%)

3. 15 Nov: User input multiple expenses
   - Food expenses total: 1,800,000
   - Percentage = 90% → ALERT!
   - User dapat notifikasi: "Food budget 90% spent"

4. 20 Nov: User input expense Rp 300,000 (Food)
   - Total now: 2,100,000
   - Status = "EXCEEDED" (110%)
   - User dapat warning: "Food budget exceeded!"

5. 30 Nov: Generate budget report
   - Summary per kategori
   - Total spending: 9,200,000 (92% dari limit)
   - Visual chart comparing planned vs actual

6. 1 Dec: Budget month ended
   - Freeze November budget
   - Generate monthly report
   - Suggest adjustments untuk December budget based on actual spending
```

---

## WORKFLOW EXAMPLE: Recurring Transaction

```
1. 1 Jan 2024: User setup gaji recurring pattern
   - Amount: 10,000,000
   - Frequency: monthly
   - Start date: 2024-01-15
   - End date: null (ongoing)
   - Destination fund: Bank account
   - Next execution: 2024-01-15

2. 15 Jan 2024: Scheduler job runs
   - Find patterns dengan next_execution_date <= 2024-01-15
   - Create transaction:
     * Type: income
     * Amount: 10,000,000
     * Transaction_date: 2024-01-15
     * Recurring_pattern_id: gaji_pattern_id
     * Status: completed
   - Update fund_sources balance: +10,000,000
   - Calculate next execution: 2024-02-15
   - Notify user: "Gaji diterima!"

3. 15 Feb 2024: Scheduler repeats
   - Create transaction lagi
   - Next execution: 2024-03-15

4. User dapat nanti ingin edit gaji (naik)
   - Edit recurring_pattern: amount = 12,000,000
   - Option 1: "Edit only this payment" → edit transaction instance
   - Option 2: "Edit all future" → update pattern
   - Future transactions sudah auto-adjust

5. User berhenti kerja, disable recurring
   - Set is_active = false
   - No more auto-generation
   - Historical transactions tetap ada untuk record
```
