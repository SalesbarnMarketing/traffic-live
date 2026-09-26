export interface PayFastPaymentRequest {
  amount: number;
  itemName: string;
  itemDescription?: string;
  category: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  message?: string;
  isAnonymous?: boolean;
  potholesCount?: number;
  potholeLocation?: string;
  potholeImageUrl?: string;
  potholeLat?: number;
  potholeLng?: number;
}

export interface PayFastPaymentResponse {
  processUrl: string;
  paymentFields: Record<string, string>;
  paymentId: string;
}

/**
 * Submits a dynamic form directly to the PayFast gateway.
 * When openInNewTab is false or if running on mobile where pop-ups are strictly blocked,
 * it safely redirects the top-level window.
 */
export function submitPayFastForm(
  processUrl: string,
  paymentFields: Record<string, string>,
  openInNewTab: boolean = true
): boolean {
  try {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = processUrl;
    if (openInNewTab) {
      form.target = '_blank';
    }
    form.style.display = 'none';

    for (const key in paymentFields) {
      if (Object.prototype.hasOwnProperty.call(paymentFields, key)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentFields[key];
        form.appendChild(input);
      }
    }

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      try {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      } catch (e) {
        // Ignored
      }
    }, 2000);

    return true;
  } catch (err) {
    console.error('Error submitting PayFast form:', err);
    return false;
  }
}

/**
 * Initiates an official PayFast South Africa checkout session.
 * Generates the signed form parameters from the secure server and posts to PayFast.
 */
export async function initiatePayFastPayment(paymentData: PayFastPaymentRequest): Promise<PayFastPaymentResponse> {
  const hostOrigin = window.location.origin;
  const categoryParam = encodeURIComponent(paymentData.category || 'donation');
  const returnUrl = `${hostOrigin}/?payment=success&category=${categoryParam}`;
  const cancelUrl = `${hostOrigin}/?payment=cancelled&category=${categoryParam}`;

  const res = await fetch('/api/payfast/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...paymentData,
      returnUrl,
      cancelUrl
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to initialize PayFast payment gateway.');
  }

  const data: PayFastPaymentResponse = await res.json();
  const { processUrl, paymentFields, paymentId } = data;

  if (paymentId) {
    // Store in localStorage for client confirmation fallback & resilience across browser reloads
    try {
      localStorage.setItem('pending_payfast_id', paymentId);
      localStorage.setItem('pending_payfast_time', Date.now().toString());
      localStorage.setItem('pending_payfast_meta', JSON.stringify({
        paymentId,
        amount: paymentData.amount,
        category: paymentData.category,
        donorName: paymentData.donorName,
        message: paymentData.message,
        potholeLocation: paymentData.potholeLocation,
        potholesCount: paymentData.potholesCount
      }));
    } catch (e) {
      console.warn('Could not cache pending payment ID:', e);
    }
  }

  // Attempt automatic submission to new tab
  try {
    submitPayFastForm(processUrl, paymentFields, true);
  } catch (err) {
    console.warn('Automatic form submission failed, fallback modal will handle it:', err);
  }

  return data;
}
