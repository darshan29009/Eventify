const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  // Create Stripe payment intent
  async createStripePaymentIntent(amount, currency = 'inr', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Stripe expects amount in smallest currency unit
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        }
      });

      logger.info(`Stripe payment intent created: ${paymentIntent.id} for amount ${amount} ${currency}`);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      return {
        success: false,
        message: error.message,
        error: error.type
      };
    }
  }

  // Confirm Stripe payment
  async confirmStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert back to regular amount
          charges: paymentIntent.charges.data
        };
      }

      return {
        success: false,
        status: paymentIntent.status,
        message: 'Payment not completed'
      };
    } catch (error) {
      logger.error('Stripe payment confirmation failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Create Razorpay order
  async createRazorpayOrder(amount, currency = 'INR', receipt = null, notes = {}) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt,
        notes,
        payment_capture: 1 // Auto capture
      };

      const order = await this.razorpay.orders.create(options);

      logger.info(`Razorpay order created: ${order.id} for amount ${amount} ${currency}`);

      return {
        success: true,
        orderId: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        receipt: order.receipt
      };
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Verify Razorpay payment signature
  async verifyRazorpayPayment(orderId, paymentId, signature) {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isVerified = signature === expectedSignature;

      if (isVerified) {
        // Fetch payment details
        const payment = await this.razorpay.payments.fetch(paymentId);

        return {
          success: true,
          payment: {
            id: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            email: payment.email,
            contact: payment.contact
          }
        };
      }

      return {
        success: false,
        message: 'Invalid payment signature'
      };
    } catch (error) {
      logger.error('Razorpay payment verification failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Refund Stripe payment
  async refundStripePayment(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount) : undefined,
        reason: reason
      });

      logger.info(`Stripe refund created: ${refund.id} for payment ${paymentIntentId}`);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error) {
      logger.error('Stripe refund failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Refund Razorpay payment
  async refundRazorpayPayment(paymentId, amount = null, notes = {}) {
    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
        notes
      });

      logger.info(`Razorpay refund created: ${refund.id} for payment ${paymentId}`);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error) {
      logger.error('Razorpay refund failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Format currency
  formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Get payment method icon/name
  getPaymentMethodDisplay(method) {
    const methods = {
      card: { name: 'Credit/Debit Card', icon: 'fa-credit-card' },
      upi: { name: 'UPI', icon: 'fa-google-pay' },
      netbanking: { name: 'Net Banking', icon: 'fa-university' },
      wallet: { name: 'Wallet', icon: 'fa-wallet' },
      emi: { name: 'EMI', icon: 'fa-credit-card' },
      cash: { name: 'Cash', icon: 'fa-money-bill-wave' },
      cheque: { name: 'Cheque', icon: 'fa-file-invoice-dollar' }
    };

    return methods[method] || { name: method, icon: 'fa-question' };
  }

  // Calculate GST (if applicable)
  calculateGST(amount, gstRate = 18) {
    const gstAmount = (amount * gstRate) / 100;
    return {
      subtotal: amount,
      gstRate,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: Math.round((amount + gstAmount) * 100) / 100
    };
  }
}

module.exports = new PaymentService();
