# Test Client Registration Flow

## 4-Step Registration Process

### Step 1: Company Data
- Name: PT Test Company
- Industry: Technology  
- Size: 11-50 employees
- Phone: 021-12345678
- Address: Jl. Test No. 123, Jakarta

### Step 2: Administrator Data
- Name: John Doe
- Email: admin@testcompany.com
- Phone: 081234567890
- Position: CEO
- Password: password123

### Step 3: Package Selection
- Plan: Growth (299,000 IDR/month)
- Billing: Monthly
- Addons: Extra storage, analytics

### Step 4: Payment
- Invoice generation
- Payment via Midtrans or manual confirmation
- Account activation

## API Endpoints
- POST /api/registration/generate-invoice
- POST /api/registration/activate-account

## Database Updates
- organizations table updated with company fields
- users table for admin user
- invoices and invoice_line_items for billing