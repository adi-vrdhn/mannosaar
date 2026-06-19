# PayU MER_029 Fix - Ready-to-Apply Code Changes

## Summary
**Problem:** PhonePe UPI Intent fails with MER_029 (Intent mode transaction not allowed)  
**Root Cause:** `bankcode='UPI'` in line 134 of `src/lib/payu.ts` blocks Intent mode  
**Solution:** Remove bankcode from UPI payment mode  
**Impact:** PhonePe, GooglePay, PayTM Intent payments will work

---

## Fix #1: Critical - Update Payment Mode Configuration

### File: `src/lib/payu.ts`
### Lines: 131-141

**BEFORE (Broken):**
```typescript
export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUPaymentModeFields {
  switch (paymentMode) {
    case 'upi':
      return { pg: 'UPI', bankcode: 'UPI' };  // ❌ BLOCKS INTENT
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

**AFTER (Fixed):**
```typescript
export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUPaymentModeFields {
  switch (paymentMode) {
    case 'upi':
      return { pg: 'UPI' };  // ✅ FIXED: Allows both QR and Intent
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

**What Changed:**
- Line 134: Removed `bankcode: 'UPI'`
- This allows PayU's routing to handle both QR and Intent modes
- QR payments still work (no bankcode doesn't force QR, just removes the restriction)
- Intent payments now work (bankcode removed allows app routing)

**Why This Works:**
- `pg='UPI'` tells PayU to use UPI gateway
- Without explicit `bankcode='UPI'`, PayU defaults to accepting all UPI input methods
- Users can enter UPI ID, scan QR, or use Intent apps
- PayU intelligently routes based on user choice

---

## Fix #2: Optional Enhancement - Clarify Bankcode Handling

### File: `src/lib/payu.ts`
### Lines: 313-323

This fix is optional but makes the code more explicit and maintainable.

**BEFORE (Current):**
```typescript
  if (paymentModeFields.pg) {
    fields.pg = paymentModeFields.pg;
  }

  if (paymentModeFields.bankcode) {
    fields.bankcode = paymentModeFields.bankcode;
  }

  if (paymentModeFields.txn_s2s_flow) {
    fields.txn_s2s_flow = paymentModeFields.txn_s2s_flow;
  }
```

**AFTER (Enhanced Clarity):**
```typescript
  if (paymentModeFields.pg) {
    fields.pg = paymentModeFields.pg;
  }

  // Only set bankcode if explicitly provided (important for Intent mode)
  if (paymentModeFields.bankcode !== undefined && paymentModeFields.bankcode !== '') {
    fields.bankcode = paymentModeFields.bankcode;
  }

  if (paymentModeFields.txn_s2s_flow) {
    fields.txn_s2s_flow = paymentModeFields.txn_s2s_flow;
  }
```

**Why This Helps:**
- Makes intention explicit: "only set bankcode if intentionally provided"
- Prevents accidental bankcode values
- Documents the Intent mode workaround

---

## Fix #3: Recommended - Update Environment Variables

### File: `.env.local`
### Lines: 49-50

**CHECK FIRST:**
Before making this change, verify your merchant key environment:
1. Log in to PayU dashboard
2. Find merchant key `TaK2RU`
3. Determine: Is it in Test or Production environment?

**IF TEST MERCHANT:**
```
BEFORE:
PAYU_PAYMENT_URL=https://secure.payu.in/_payment
PAYU_IS_TEST=true

AFTER:
PAYU_PAYMENT_URL=https://test.payu.in/_payment
PAYU_IS_TEST=true
```

**IF PRODUCTION MERCHANT:**
```
BEFORE:
PAYU_PAYMENT_URL=https://secure.payu.in/_payment
PAYU_IS_TEST=true

AFTER:
PAYU_PAYMENT_URL=https://secure.payu.in/_payment
PAYU_IS_TEST=false
```

**Current Status:** You're using production endpoint with test flag = inconsistent

---

## Fix #4: Optional - Improve Transaction ID Generation

### File: `src/lib/payu.ts`
### Lines: 118-119

**Current (Works but improvable):**
```typescript
export function generatePayUTxnId() {
  return `payu_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}
```

**Option A - UUID Based (Best):**
```typescript
import { v4 as uuidv4 } from 'uuid';

export function generatePayUTxnId() {
  // UUID v4 guarantees uniqueness across systems
  return `payu_${uuidv4().replace(/-/g, '')}`;
}
```

**Option B - Enhanced Timestamp (Good):**
```typescript
export function generatePayUTxnId() {
  // Increased random bytes for lower collision risk
  return `payu_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}
```

**Why This Matters:**
- Current: `Date.now()` (ms precision) + 4 bytes random
- Enhanced: `Date.now()` (ms precision) + 8 bytes random
- UUID: 128-bit guaranteed unique
- Current works but could theoretically collide if 2 txns in same millisecond

**Decision:** Only needed if you see duplicate txnids in PayU logs

---

## Implementation Order

### Phase 1: Critical Fix (Do This First) ⚡
1. Apply Fix #1 to `src/lib/payu.ts` line 134
2. Test: PhonePe Intent payment
3. Verify: No more MER_029 errors

### Phase 2: Environment Check (Do This Next)
1. Verify merchant key environment
2. Apply Fix #3 to `.env.local`
3. Restart development server

### Phase 3: Code Quality (Optional)
1. Apply Fix #2 to enhance clarity (optional)
2. Apply Fix #4 if duplicates detected (optional)
3. Update tests if applicable

---

## Testing Checklist After Fixes

### ✅ Test 1: Debit Card (Should Still Work)
- [ ] Card number entry works
- [ ] OTP verification works
- [ ] Transaction completes

### ✅ Test 2: QR UPI (Should Still Work)
- [ ] QR code generates
- [ ] Scan with any UPI app works
- [ ] Transaction completes

### ✅ Test 3: PhonePe Intent (Should Now Work) 🎯
- [ ] Select UPI payment option
- [ ] User sees PhonePe as an option
- [ ] PhonePe app opens for payment
- [ ] No MER_029 error returned
- [ ] Transaction completes

### ✅ Test 4: GooglePay Intent (Should Now Work) 🎯
- [ ] Select UPI payment option
- [ ] User sees GooglePay as an option
- [ ] GooglePay app opens for payment
- [ ] Transaction completes

### ✅ Test 5: PayTM Intent (Should Now Work) 🎯
- [ ] Select UPI payment option
- [ ] User sees PayTM as an option
- [ ] PayTM app opens for payment
- [ ] Transaction completes

---

## Verification After Deployment

### Check 1: Transaction Logs
```
In PayU Dashboard:
1. Go to Transactions
2. Filter by: Status = Failed, Error = MER_029
3. Expected: No new MER_029 errors after fix
```

### Check 2: Intent Transactions
```
In PayU Dashboard:
1. Go to Transactions
2. Filter by: Payment Method = UPI, Status = Success
3. Look for: Multiple transaction types (Intent, QR)
4. Expected: See both Intent and QR mode transactions
```

### Check 3: Payment Method Distribution
```
In PayU Dashboard Analytics:
1. Check payment method breakdown
2. Look for: Increase in UPI transactions
3. Expected: UPI should increase (currently blocked for Intent)
4. Should see: PhonePe, GooglePay, PayTM transactions
```

---

## Rollback Plan (If Issues Occur)

### If PhonePe Still Fails After Fix

**Step 1: Verify the fix was applied**
```bash
grep -n "bankcode: 'UPI'" src/lib/payu.ts
# Should return 0 results if fix applied
```

**Step 2: Check PayU Dashboard Settings**
- Confirm "UPI Generic Intent" is enabled
- Confirm "PhonePe" is enabled
- Check if there are additional merchant configs needed

**Step 3: Check Request Payload**
- Add console.log in createPayUPaymentFields to log fields
- Verify `bankcode` is NOT in the fields object
- Verify `pg='UPI'` is present

**Step 4: Contact PayU Support**
- Provide transaction ID from failed Intent payment
- Ask for MER_029 diagnostic details
- Verify merchant ID has Intent enabled

### Rollback Code Change
```bash
# Revert to original
git checkout src/lib/payu.ts
# This puts back bankcode='UPI'
```

---

## Code Diff Summary

```diff
--- a/src/lib/payu.ts
+++ b/src/lib/payu.ts
@@ -131,7 +131,7 @@ export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUP
  * switch (paymentMode) {
    case 'upi':
-     return { pg: 'UPI', bankcode: 'UPI' };
+     return { pg: 'UPI' };
    case 'cards':
      return { pg: 'CC' };
```

That's it! One line change fixes the issue.

---

## FAQ

**Q: Will removing bankcode break QR UPI?**
A: No. QR UPI still works because pg='UPI' alone doesn't force QR. Users can still scan QR and enter UPI ID. PayU routes based on user input, not bankcode.

**Q: Do I need to change anything in frontend?**
A: No. The frontend already supports 'upi' payment mode. No UI changes needed.

**Q: Will existing transactions be affected?**
A: No. This only affects new transactions created after the fix is deployed.

**Q: How long until Intent transactions appear in dashboard?**
A: Usually within minutes. Check transaction logs within 5-10 minutes of first Intent test.

**Q: Do I need to update hash generation?**
A: No. Hash generation is correct and unchanged.

**Q: What about VPA validation?**
A: No change needed. VPA validation endpoint still works. The create-order endpoint validates VPA exists but doesn't strictly enforce it for Intent.

---

## Success Criteria

| Item | Before Fix | After Fix |
|------|-----------|-----------|
| Debit Card Payments | ✅ Works | ✅ Works |
| QR UPI Payments | ✅ Works | ✅ Works |
| PhonePe Intent | ❌ MER_029 Error | ✅ Works |
| GooglePay Intent | ❌ Fails | ✅ Works |
| PayTM Intent | ❌ Fails | ✅ Works |
| Card Hash | ✅ Correct | ✅ Correct |
| Response Hash | ✅ Correct | ✅ Correct |

---

## Summary

This is a **one-line fix**:
- Remove `bankcode: 'UPI'` from line 134
- Test with PhonePe Intent
- Deploy
- Monitor transaction logs

Expected outcome: PhonePe, GooglePay, PayTM Intent payments will work without MER_029 error.
