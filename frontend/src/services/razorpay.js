/**
 * Razorpay Checkout Loader
 * Agrawal Matrimony Platform
 *
 * Loads the hosted Checkout script on demand and wraps it in a promise so the
 * caller receives the real razorpay_payment_id / razorpay_signature pair that
 * the backend needs for HMAC verification.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let loaderPromise = null;

/**
 * Injects the Razorpay Checkout script exactly once.
 * @returns {Promise<boolean>} resolves true when window.Razorpay is available
 */
export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      loaderPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return loaderPromise;
}

/**
 * Opens Razorpay Checkout for an order created by the backend.
 *
 * @param {Object} options
 * @param {string} options.keyId Razorpay public key returned by create-order
 * @param {string} options.orderId Razorpay order id
 * @param {number} options.amount Amount in paise
 * @param {string} [options.currency='INR']
 * @param {string} [options.name] Merchant name shown in the modal
 * @param {string} [options.description] Line description shown in the modal
 * @param {Object} [options.prefill] { name, email, contact }
 * @returns {Promise<{ paymentId: string, orderId: string, signature: string }>}
 *          Rejects with code 'CHECKOUT_DISMISSED' if the user closes the modal,
 *          or 'CHECKOUT_FAILED' if Razorpay reports a payment failure.
 */
export function openRazorpayCheckout({
  keyId,
  orderId,
  amount,
  currency = 'INR',
  name = 'Agrawal Matrimony',
  description = 'Premium Membership',
  prefill = {}
}) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      const err = new Error('Payment gateway failed to load. Please check your connection and try again.');
      err.code = 'CHECKOUT_UNAVAILABLE';
      reject(err);
      return;
    }

    let settled = false;

    const checkout = new window.Razorpay({
      key: keyId,
      order_id: orderId,
      amount,
      currency,
      name,
      description,
      prefill,
      theme: { color: '#570013' },
      handler: (response) => {
        settled = true;
        resolve({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        });
      },
      modal: {
        ondismiss: () => {
          if (settled) return;
          const err = new Error('Payment was cancelled.');
          err.code = 'CHECKOUT_DISMISSED';
          reject(err);
        }
      }
    });

    checkout.on('payment.failed', (response) => {
      settled = true;
      const err = new Error(response?.error?.description || 'Payment failed. Please try another method.');
      err.code = 'CHECKOUT_FAILED';
      err.details = response?.error || null;
      reject(err);
    });

    checkout.open();
  });
}

export default { loadRazorpayCheckout, openRazorpayCheckout };
