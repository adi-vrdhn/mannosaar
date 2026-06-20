# PayU Integration Audit Report
**Status:** Production Issue - PhonePe UPI Intent Failing (MER_029)  
**Date:** 2026-06-19  
**Error:** MER_029 | Reason: Intent mode transaction not allowed

---

## Executive Summary

Your PayU integration is using **Seamless/Form-based checkout** with hardcoded UPI parameters that don't properly support **UPI Intent mode** (PhonePe, GooglePay, PayTM). This causes PhonePe Intent transactions to fail with **MER_029**.

**Root Cause:** Setting `bankcode='UPI'` for all UPI payments prevents Intent mode detection, forcing PayU to treat all UPI as QR mode only.

---

## Critical Issues Found

### 🔴 **CRITICAL: Issue #1 - Incorrect UPI Intent Configuration**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L133-L134)

```typescript
case 'upi':
  return { pg: 'UPI', bankcode: 'UPI' };  // ❌ WRONG FOR INTENT
```

**Problem:**
- Setting `bankcode='UPI'` is for QR-based UPI payments only
- PhonePe Intent, GooglePay Intent require `bankcode` to be **empty or null** to allow app-based payment routing
- PayU dashboard shows "UPI Generic Intent" as Active, but the code blocks Intent by forcing a specific bankcode
- This is why debit cards and QR work, but PhonePe Intent fails with MER_029

**Impact:** PhonePe, GooglePay, PayTM Intent payments are completely blocked

**Fix Required:** Remove `bankcode` for Intent payments or use intent-specific parameters

---

### 🔴 **CRITICAL: Issue #2 - Missing Intent Mode Detection**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L131-L141) and [src/app/api/payments/create-order/route.ts](src/app/api/payments/create-order/route.ts#L20-L33)

**Problem:**
- No distinction between QR UPI and Intent UPI payments
- The `paymentMode='upi'` parameter treats all UPI the same way
- Intent requires `txn_s2s_flow='intent'` but the code doesn't set this
- No VPA validation for Intent vs QR mode

**Current Code:**
```typescript
// All UPI payments use same params - no Intent detection
const paymentModeFields = getPayUPaymentModeFields(input.paymentMode);
// Always produces: { pg: 'UPI', bankcode: 'UPI' }
```

**Expected:** Need separate handling for:
- QR UPI: `pg='UPI', bankcode='UPI'`
- Intent UPI: `pg='UPI', bankcode=null/undefined, txn_s2s_flow='intent'`

---

### 🟡 **CRITICAL: Issue #3 - Production Endpoint Check**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L59)

```typescript
const paymentUrl = process.env.PAYU_PAYMENT_URL || 
                   process.env.PAYU_BASE_URL || 
                   'https://secure.payu.in/_payment';
```

**Current Status:** ✅ CORRECT
- Using production endpoint: `https://secure.payu.in/_payment`
- Your `.env.local` has: `PAYU_IS_TEST=true` (but URL is still production)

**⚠️ INCONSISTENCY:**
- `PAYU_IS_TEST=true` suggests test mode
- But `PAYU_PAYMENT_URL=https://secure.payu.in/_payment` is production
- These should match: if test, use `https://test.payu.in/_payment`

---

### 🟡 **MEDIUM: Issue #4 - Transaction ID Generation**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L118-L119)

```typescript
export function generatePayUTxnId() {
  return `payu_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}
```

**Status:** ✅ Likely Unique (but suboptimal)

**Analysis:**
- Uses `Date.now()` (ms precision) + 4 bytes of random data
- Works but could theoretically have edge-case collisions
- Better approach: Use UUID v4 or larger random bytes

**Verification:** Transaction IDs should be checked in PayU dashboard for duplicates

---

### 🟡 **MEDIUM: Issue #5 - Hash Generation Correctness**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L146-L180)

**Status:** ✅ Correct for Seamless Integration

**Validation:**

**Initiation Hash (Line 160-180):** ✅ Correct
```typescript
const hashSequence = [
  params.key,      // ✅
  params.txnid,    // ✅
  params.amount,   // ✅
  params.productinfo,
  params.firstname,
  params.email,
  ...params.udf1-5,
  '',              // 5 empty string padding fields
  ...params.salt   // ✅
];
```

**Response Hash (Line 206-229):** ✅ Correct
- Proper reverse order: salt first, key last
- Correct UDF handling

---

### 🟡 **MEDIUM: Issue #6 - Missing S2S (Server-to-Server) Flow Parameters**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L299-309)

**Current Implementation:**
```typescript
if (input.s2sClientIp) {
  fields.s2s_client_ip = input.s2sClientIp;
}

if (input.s2sDeviceInfo) {
  fields.s2s_device_info = input.s2sDeviceInfo;
}
```

**Problem:**
- For Intent payments, you might need `txn_s2s_flow='intent'`
- The code has structure for this (line 316-318) but never sets it
- Passing S2S parameters without `txn_s2s_flow` might be incomplete

**Missing Parameter in getPayUPaymentModeFields:**
```typescript
// Should add for Intent:
// txn_s2s_flow: 'intent'
```

---

### 🟡 **MEDIUM: Issue #7 - VPA Validation Not Required for Form Submission**

**File:** [src/app/api/payments/payu/validate-vpa/route.ts](src/app/api/payments/payu/validate-vpa/route.ts#L1-100)

**Status:** ✅ Implemented but not enforced in payment flow

**Analysis:**
- VPA validation endpoint exists
- But in create-order route (line 101-108), only checks if VPA exists, doesn't validate it
- For Intent, invalid VPA will fail at PayU gateway anyway
- Not critical but could improve UX

---

### 🟢 **LOW: Issue #8 - No Hardcoded Bank/App Codes**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L1-600)

**Status:** ✅ CLEAN
- No hardcoded `bankcode='PHONEPE'`, `'GPAY'`, `'PAYTM'` found
- No hardcoded `upiAppName` values found
- Generic UPI handling only

---

### 🟢 **LOW: Issue #9 - QR vs Intent Payloads Are Identical**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L262-371)

**Status:** ✅ This is intentional but problematic
- `createPayUPaymentFields()` builds same payload for all UPI
- Works for QR mode (current working transactions)
- Fails for Intent mode (the issue)

---

## Detailed Fix Recommendations

### **Fix #1: Update Payment Mode Fields (URGENT)**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L131-141)

**Current:**
```typescript
export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUPaymentModeFields {
  switch (paymentMode) {
    case 'upi':
      return { pg: 'UPI', bankcode: 'UPI' };
    case 'cards':
      return { pg: 'CC' };
    case 'netbanking':
      return { pg: 'NB' };
    case 'wallets':
      return { pg: 'CASH' };
    default:
      return {};
  }
}
```

**Recommended Fix:**
Create a separate Intent mode or add detection based on context:

```typescript
interface PayUPaymentModeFields {
  pg?: string;
  bankcode?: string;  // Make optional
  txn_s2s_flow?: string;
  upiAppName?: string;
}

export type PayUPaymentMode = 'auto' | 'upi' | 'upi-intent' | 'upi-qr' | 'cards' | 'netbanking' | 'wallets';

export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUPaymentModeFields {
  switch (paymentMode) {
    case 'upi-qr':
      // QR only - force bankcode
      return { pg: 'UPI', bankcode: 'UPI' };
    case 'upi-intent':
      // Intent only - no bankcode to allow app routing
      return { pg: 'UPI', txn_s2s_flow: 'intent' };
    case 'upi':  // Default - allow both
      // For default, omit bankcode to allow PayU's smart routing
      return { pg: 'UPI' };
    case 'cards':
      return { pg: 'CC' };
    case 'netbanking':
      return { pg: 'NB' };
    case 'wallets':
      return { pg: 'CASH' };
    default:
      return {};
  }
}
```

---

### **Fix #2: Update createPayUPaymentFields to Handle Conditional Bankcode**

**File:** [src/lib/payu.ts](src/lib/payu.ts#L305-315)

**Current:**
```typescript
if (paymentModeFields.bankcode) {
  fields.bankcode = paymentModeFields.bankcode;
}
```

**Issue:** Sets bankcode even if undefined

**Recommended:**
```typescript
// Only set bankcode if explicitly provided
// Don't set it to undefined or empty string
if (paymentModeFields.bankcode !== undefined && paymentModeFields.bankcode !== '') {
  fields.bankcode = paymentModeFields.bankcode;
}
// txn_s2s_flow will be set automatically if present
if (paymentModeFields.txn_s2s_flow) {
  fields.txn_s2s_flow = paymentModeFields.txn_s2s_flow;
}
```

---

### **Fix #3: Update Frontend Payment Mode Selection**

**File:** [src/app/appointment/payment/page.tsx](src/app/appointment/payment/page.tsx#L1)

**Current Issue:** No way to select Intent vs QR mode in frontend

**Add:** Radio button or automatic detection:

```typescript
// Detect if user is on mobile/app-capable device
const isIntentCapable = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

// Then pass: paymentMode={isIntentCapable ? 'upi-intent' : 'upi-qr'}
// Or let user choose
```

---

### **Fix #4: Clarify Test vs Production Mode**

**File:** [.env.local](.env.local#L47-L50)

**Current:**
```
PAYU_KEY=TaK2RU
PAYU_SALT=CiPjMlbR0DX0ZFTc269CPysWxlX2slp6
PAYU_PAYMENT_URL=https://secure.payu.in/_payment
PAYU_IS_TEST=true
```

**Issue:** `PAYU_IS_TEST=true` but using production URL

**Options:**
1. If test merchant key: Use `https://test.payu.in/_payment`
2. If production merchant key: Set `PAYU_IS_TEST=false`

**Check your PayU dashboard:** Which environment is `TaK2RU` in?

---

## Additional Verification Checklist

- [ ] Verify `TaK2RU` is production merchant key (not test)
- [ ] Confirm "UPI Generic Intent" is enabled in PayU dashboard under Payment Methods
- [ ] Check if there's a separate "PhonePe Intent" option that needs enabling
- [ ] Review recent transaction logs in PayU dashboard for MER_029 patterns
- [ ] Verify no restrictions on Intent for your merchant ID
- [ ] Check if there's a specific integration ID or auth token needed for Intent

---

## Testing After Fixes

### **Test Case 1: QR UPI Payment**
- Use `paymentMode='upi-qr'`
- Scan code from payment gateway
- ✅ Should work (already working)

### **Test Case 2: PhonePe Intent**
- Use `paymentMode='upi-intent'`
- Select PhonePe from UPI options
- ✅ Should NOT return MER_029

### **Test Case 3: GooglePay Intent**
- Use `paymentMode='upi-intent'`
- Select GooglePay
- ✅ Should work

### **Test Case 4: Generic UPI**
- Use `paymentMode='upi'` (default)
- Should support both QR and Intent
- ✅ Smooth fallback

---

## Summary of Changes Required

| Issue | File | Severity | Fix |
|-------|------|----------|-----|
| `bankcode='UPI'` blocks Intent | [payu.ts#L134](src/lib/payu.ts#L134) | 🔴 CRITICAL | Remove or make optional per mode |
| No Intent mode detection | [payu.ts#L131-141](src/lib/payu.ts#L131-141) | 🔴 CRITICAL | Add `upi-intent` variant |
| Missing `txn_s2s_flow` | [payu.ts#L299-318](src/lib/payu.ts#L299-318) | 🟡 MEDIUM | Set for Intent mode |
| Test/Prod mismatch | [.env.local#L49-L50](.env.local#L49-L50) | 🟡 MEDIUM | Verify consistency |
| TxnID generation | [payu.ts#L118](src/lib/payu.ts#L118) | 🟢 LOW | Use UUID for better uniqueness |

---

## Recommended Next Steps

1. **Immediate:** Fix bankcode/Intent parameters (Critical Issues #1 & #2)
2. **Test:** PhonePe Intent with corrected payload
3. **Verify:** Production vs Test environment setup
4. **Enhance:** Add frontend UPI mode selector or auto-detection
5. **Monitor:** Check transaction logs for MER_029 resolution
