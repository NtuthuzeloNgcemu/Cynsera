/**
 * payments.js
 * ─────────────────────────────────────────────────────
 * Payment balance display and simulated transaction
 * timeline. Full payment processing (authorisation
 * holds, release) is a planned Supabase extension.
 * Depends on: utils.js
 * ─────────────────────────────────────────────────────
 */

function updatePaymentBalance() {
  const el = document.getElementById('pay-balance');
  if (el && currentUser) {
    el.textContent = 'R' + Number(currentUser.balance || 0).toLocaleString();
  }
}

/**
 * Simulates an authorisation hold on the client side.
 * In production this would call a Supabase Edge Function
 * or a payment gateway (e.g. PayFast, Peach Payments).
 *
 * @param {string} gigId   - The gig being paid for
 * @param {number} amount  - Rand amount to hold
 */
async function simulatePaymentHold(gigId, amount) {
  if (!currentUser) return { ok: false, message: 'Not logged in.' };
  if ((currentUser.balance || 0) < amount)
    return { ok: false, message: 'Insufficient balance to place a hold.' };

  currentUser.balance = (currentUser.balance || 0) - amount;
  await updateUserInDB(currentUser.email, { balance: currentUser.balance });
  saveLocalState();
  updatePaymentBalance();
  showToast(`R${amount.toLocaleString()} held for gig payment.`, 'success');
  return { ok: true };
}

/**
 * Releases a previously held payment to the youth worker.
 *
 * @param {string} workerEmail - Recipient's email
 * @param {number} amount      - Rand amount to release
 */
async function releasePayment(workerEmail, amount) {
  const worker = allUsers.find(u => u.email === workerEmail)
    || await fetchUserByEmail(workerEmail);
  if (!worker) return { ok: false, message: 'Worker account not found.' };

  worker.balance = (worker.balance || 0) + amount;
  await updateUserInDB(workerEmail, { balance: worker.balance });
  const idx = allUsers.findIndex(u => u.email === workerEmail);
  if (idx >= 0) allUsers[idx] = worker;
  saveLocalState();
  showToast(`R${amount.toLocaleString()} released to ${worker.full_name}.`, 'success');
  return { ok: true };
}
