# PayU Integration - Code Inspection Guide

## 📋 Files to Review

### **PRIMARY ISSUE: Payment Mode Configuration**

#### File 1: [src/lib/payu.ts](src/lib/payu.ts)

**🔴 CRITICAL SECTION - Lines 131-141**
```typescript
131 | export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUPaymentModeFields {
132 |   switch (paymentMode) {
133 |     case 'upi':
134 |       return { pg: 'UPI', bankcode: 'UPI' };  // ❌ PROBLEM: Blocks Intent Mode
135 |     case 'cards':
136 |       return { pg: 'CC' };
137 |     case 'netbanking':
138 |       return { pg: 'NB' };
139 |     case 'wallets':
140 |       return { pg: 'CASH' };
141 |     default:
142 |       return {};
143 |   }
144 | }
```

**Why This Breaks PhonePe Intent:**
- `bankcode='UPI'` tells PayU: "Only allow QR mode"
- For Intent mode (PhonePe, GooglePay, PayTM), you must NOT set bankcode
- Result: PayU rejects Intent with MER_029

**Expected Fix:**
```typescript
export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUPaymentModeFields {
  switch (paymentMode) {
    case 'upi':
      return { pg: 'UPI' };  // ✅ FIXED: No bankcode = allows both QR and Intent
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

**🟡 RELATED SECTION - Lines 305-318**
```typescript
305 |   if (input.s2sClientIp) {
306 |     fields.s2s_client_ip = input.s2sClientIp;
307 |   }
308 |
309 |   if (input.s2sDeviceInfo) {
310 |     fields.s2s_device_info = input.s2sDeviceInfo;
311 |   }
312 |
313 |   if (paymentModeFields.pg) {
314 |     fields.pg = paymentModeFields.pg;
315 |   }
316 |
317 |   if (paymentModeFields.bankcode) {  // ⚠️ Issue: Always sets if exists
318 |     fields.bankcode = paymentModeFields.bankcode;
319 |   }
320 |
321 |   if (paymentModeFields.txn_s2s_flow) {
322 |     fields.txn_s2s_flow = paymentModeFields.txn_s2s_flow;
323 |   }
```

**Issue:** Line 317-319 always sets bankcode if present
- With current fix to line 134, this will be empty/undefined
- Code won't add empty bankcode fields (good)
- But should be more explicit

**Better Implementation:**
```typescript
if (paymentModeFields.pg) {
  fields.pg = paymentModeFields.pg;
}

// Only add bankcode if explicitly set and non-empty
if (paymentModeFields.bankcode) {
  fields.bankcode = paymentModeFields.bankcode;
}

// Always add txn_s2s_flow if present
if (paymentModeFields.txn_s2s_flow) {
  fields.txn_s2s_flow = paymentModeFields.txn_s2s_flow;
}
```

---

**🟢 CORRECT SECTIONS - Hash Functions**

**Lines 146-180: buildPayUInitiationHash()**
```typescript
146 | export function buildPayUInitiationHash(params: {
147 |   key: string;
148 |   txnid: string;
149 |   amount: string;
150 |   productinfo: string;
151 |   firstname: string;
152 |   email: string;
153 |   udf1?: string;
154 |   udf2?: string;
155 |   udf3?: string;
156 |   udf4?: string;
157 |   udf5?: string;
158 |   salt: string;
159 | }) {
160 |   const hashSequence = [
161 |     params.key,
162 |     params.txnid,
163 |     params.amount,
164 |     params.productinfo,
165 |     params.firstname,
166 |     params.email,
167 |     params.udf1 || '',
168 |     params.udf2 || '',
169 |     params.udf3 || '',
170 |     params.udf4 || '',
171 |     params.udf5 || '',
172 |     '',  // 5 empty fields (PayU padding)
173 |     '',
174 |     '',
175 |     '',
176 |     '',
177 |     params.salt,
178 |   ];
178 |
179 |   return crypto.createHash('sha512').update(hashSequence.join('|')).digest('hex');
180 | }
```

✅ **Status: CORRECT** - Proper SHA-512 implementation

---

**Lines 206-229: buildPayUResponseHash()**
```typescript
206 | export function buildPayUResponseHash(params: {
207 |   key: string;
208 |   txnid: string;
209 |   amount: string;
210 |   productinfo: string;
211 |   firstname: string;
212 |   email: string;
213 |   status: string;
214 |   udf1?: string;
215 |   udf2?: string;
216 |   udf3?: string;
217 |   udf4?: string;
218 |   udf5?: string;
219 |   salt: string;
220 |   additionalCharges?: string;
221 | }) {
222 |   const hashSegments = [
223 |     params.salt,     // ✅ Reversed order (salt first)
224 |     params.status,
225 |     '',
226 |     '',
227 |     '',
228 |     '',
229 |     '',
230 |     params.udf5 || '',
231 |     params.udf4 || '',
232 |     params.udf3 || '',
233 |     params.udf2 || '',
234 |     params.udf1 || '',
235 |     params.email,
236 |     params.firstname,
237 |     params.productinfo,
238 |     params.amount,
239 |     params.txnid,
240 |     params.key,      // ✅ Key last
241 |   ];
242 |
243 |   const finalHashSegments = params.additionalCharges
244 |     ? [params.additionalCharges, ...hashSegments]
245 |     : hashSegments;
246 |
247 |   return crypto.createHash('sha512').update(finalHashSegments.join('|')).digest('hex');
248 | }
```

✅ **Status: CORRECT** - Proper reverse order for response hash

---

### **SECONDARY ISSUE: Transaction ID Generation**

#### File 1: [src/lib/payu.ts](src/lib/payu.ts)

**🟡 MEDIUM PRIORITY - Lines 118-119**
```typescript
118 | export function generatePayUTxnId() {
119 |   return `payu_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
120 | }
```

**Analysis:**
- ✅ Each transaction should have unique ID
- ✅ Uses Date.now() (ms precision) + 4 bytes random = ~32 bits
- ⚠️ Theoretical collision risk if 2 transactions in same millisecond
- ✅ Practically sufficient but could be improved

**Verification Needed:**
- Check PayU dashboard transaction logs
- Search for duplicate txnid values
- Look for patterns in failed transactions

**Better Implementation (Optional):**
```typescript
import { v4 as uuidv4 } from 'uuid';

export function generatePayUTxnId() {
  // Option 1: UUID-based
  return `payu_${uuidv4().replace(/-/g, '')}`;
  
  // Option 2: Timestamp-based (current approach)
  return `payu_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}
```

---

### **TERTIARY ISSUE: Environment Configuration**

#### File: [.env.local](.env.local)

**🟡 MEDIUM PRIORITY - Lines 46-50**
```
46  | # PAYU (Required for hosted checkout)
47  | PAYU_KEY=TaK2RU
48  | PAYU_SALT=CiPjMlbR0DX0ZFTc269CPysWxlX2slp6
49  | PAYU_PAYMENT_URL=https://secure.payu.in/_payment
50  | PAYU_IS_TEST=true
```

**Issues:**
1. `PAYU_IS_TEST=true` but using production endpoint
2. No clarity on whether `TaK2RU` is test or production key

**Verification Needed:**
```
Question: Check your PayU merchant dashboard
- Is TaK2RU in Test or Production environment?
- If Test: Change PAYU_PAYMENT_URL to https://test.payu.in/_payment
- If Production: Change PAYU_IS_TEST to false
```

---

#### File: [src/lib/payu.ts](src/lib/payu.ts)

**Lines 48-61: getPayUConfig()**
```typescript
48  | export function getPayUConfig() {
49  |   const key =
50  |     process.env.PAYU_KEY ||
51  |     process.env.PAYU_MERCHANT_KEY ||
52  |     process.env.NEXT_PUBLIC_PAYU_KEY ||
53  |     '';
54  |   const salt =
55  |     process.env.PAYU_SALT ||
56  |     process.env.PAYU_MERCHANT_SALT ||
57  |     process.env.NEXT_PUBLIC_PAYU_SALT ||
58  |     '';
59  |   const paymentUrl = process.env.PAYU_PAYMENT_URL || 
60  |                      process.env.PAYU_BASE_URL || 
61  |                      'https://secure.payu.in/_payment';
62  |
63  |   return { key, salt, paymentUrl };
64  | }
```

**Status:** ✅ Correct endpoint (production is `secure.payu.in`)

---

### **VERIFIED: No Hardcoded Bank Codes**

#### File: [src/lib/payu.ts](src/lib/payu.ts)

**Searched entire file for:**
- ❌ `bankcode='PHONEPE'` - NOT FOUND ✅
- ❌ `bankcode='GPAY'` - NOT FOUND ✅
- ❌ `bankcode='PAYTM'` - NOT FOUND ✅
- ❌ `upiAppName='phonepay'` - NOT FOUND ✅

**Status:** ✅ CLEAN - No hardcoded payment app codes

---

### **VERIFIED: Request Payloads Are Identical**

#### File: [src/lib/payu.ts](src/lib/payu.ts)

**Lines 262-371: createPayUPaymentFields()**

**Observation:**
- All UPI payments (QR, Intent, etc.) use same payload structure
- No conditional logic based on payment method
- Lines 313-323 add pg/bankcode/txn_s2s_flow based on mode
- With the broken bankcode='UPI', all become QR-only

**Current Flow:**
```
Input: paymentMode='upi'
    ↓
getPayUPaymentModeFields('upi')
    ↓
{ pg: 'UPI', bankcode: 'UPI' }  ← ALWAYS adds this
    ↓
PayU sees: pg=UPI + bankcode=UPI
    ↓
PayU routes to QR only (blocks Intent) ← MER_029
```

**Fixed Flow (after removing bankcode):**
```
Input: paymentMode='upi'
    ↓
getPayUPaymentModeFields('upi')
    ↓
{ pg: 'UPI' }  ← No bankcode
    ↓
PayU sees: pg=UPI (only)
    ↓
PayU's smart routing detects Intent capability
    ↓
PhonePe/GooglePay Intent works ✓
```

---

### **VERIFIED: Hash Generation Correctness**

#### Verification Summary:

**Initiation Hash:**
| Component | Order | Value | Status |
|-----------|-------|-------|--------|
| Key | 1st | params.key | ✅ |
| TxnID | 2nd | params.txnid | ✅ |
| Amount | 3rd | params.amount | ✅ |
| ProductInfo | 4th | params.productinfo | ✅ |
| FirstName | 5th | params.firstname | ✅ |
| Email | 6th | params.email | ✅ |
| UDF1-5 | 7th-11th | params.udf[1-5] | ✅ |
| Padding | 12th-16th | Empty strings | ✅ |
| Salt | 17th | params.salt | ✅ |
| Algorithm | - | SHA-512 hex | ✅ |

**Response Hash (Reversed):**
| Component | Order | Value | Status |
|-----------|-------|-------|--------|
| Salt | 1st | params.salt | ✅ |
| Status | 2nd | params.status | ✅ |
| Padding | 3rd-7th | Empty strings | ✅ |
| UDF5-1 | 8th-12th | Reversed order | ✅ |
| Email | 13th | params.email | ✅ |
| FirstName | 14th | params.firstname | ✅ |
| ProductInfo | 15th | params.productinfo | ✅ |
| Amount | 16th | params.amount | ✅ |
| TxnID | 17th | params.txnid | ✅ |
| Key | 18th | params.key | ✅ |
| Algorithm | - | SHA-512 hex | ✅ |

---

## 🎯 Action Items Checklist

### Immediate (Critical)
- [ ] **Fix Line 134** in `src/lib/payu.ts`
  - Remove `bankcode: 'UPI'` from UPI case
  - Change to: `return { pg: 'UPI' };`
  - Test: PhonePe Intent payment flow

- [ ] **Verify Environment** settings
  - Confirm TaK2RU is production or test
  - Align PAYU_IS_TEST and PAYU_PAYMENT_URL

### Next Week
- [ ] Test Intent payments thoroughly
  - PhonePe Intent ✓
  - GooglePay Intent ✓
  - PayTM Intent ✓
- [ ] Check PayU dashboard for remaining MER_029 errors
- [ ] Review transaction logs for unique txnid

### Optional Enhancement
- [ ] Replace Date.now() with UUID for txnid
- [ ] Add frontend UPI mode selector
- [ ] Add transaction duplicate detection

---

## Testing Commands

```bash
# After applying fixes:

# 1. Test Intent UPI payment
curl -X POST http://localhost:3000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500,
    "sessionType": "personal",
    "userEmail": "test@example.com",
    "userId": "test-user-123",
    "userName": "Test User",
    "paymentMode": "upi",
    "slotId": "test-slot",
    "date": "2025-01-15",
    "startTime": "10:00",
    "endTime": "10:40"
  }'

# 2. Verify response contains:
# - "pg": "UPI"
# - NO bankcode field (or empty)
# - Proper hash value
```

---

## Summary

**Main Problem:** Line 134 forces all UPI to QR mode by setting `bankcode='UPI'`

**Solution:** Remove bankcode from general UPI case

**Expected Result:** PhonePe, GooglePay, PayTM Intent payments will work

**Verification:** No more MER_029 errors for Intent payments
