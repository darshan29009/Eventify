module.exports = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  },
  // Indian payment preferences
  preferredGateway: process.env.PREFERRED_GATEWAY || 'stripe', // 'stripe' or 'razorpay'
  currency: 'INR',
  taxRate: 18, // GST rate in percentage
  minimumPayment: 1, // Minimum payment amount
  enablePartialPayments: true,
  advancePaymentPercentage: 30 // Minimum advance percentage
}
