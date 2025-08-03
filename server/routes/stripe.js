import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Function to get Stripe instance (lazy initialization)
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.');
  }
  return Stripe(process.env.STRIPE_SECRET_KEY);
}

// POST /api/stripe/checkout
router.post('/checkout', async (req, res) => {
  try {
    const stripe = getStripe();

    const { priceId, email } = req.body;
    if (!priceId || !email) {
      return res.status(400).json({ error: 'Missing priceId or email' });
    }

    // Create or retrieve customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: email,
        });
      }
    } catch (customerError) {
      console.error('Customer creation error:', customerError);
      return res.status(500).json({ error: 'Failed to create customer' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?upgrade=cancel`,
      metadata: {
        customer_email: email,
      },
    });
    res.json({ url: session.url });
  } catch (err) {
    if (err.message.includes('Stripe is not configured')) {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/create-price
router.post('/create-price', async (req, res) => {
  try {
    const stripe = getStripe();

    // Create product
    const product = await stripe.products.create({
      name: 'FreelanceFlow Pro',
      description: 'Unlimited clients, proposals, invoices, and automation features',
    });

    // Create price
    const price = await stripe.prices.create({
      unit_amount: 900, // $9.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product: product.id,
    });

    res.json({ 
      product: product, 
      price: price,
      priceId: price.id 
    });
  } catch (err) {
    if (err.message.includes('Stripe is not configured')) {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stripe/status
router.get('/status', (req, res) => {
  try {
    const stripe = getStripe();
    res.json({
      stripeInitialized: true,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      keyFormat: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '***',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      stripeInitialized: false,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      keyFormat: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '***',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/stripe/config
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    priceId: 'price_pro_monthly', // Default price ID
  });
});

// POST /api/stripe/webhook
router.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful:', session);
      // Update user subscription in database
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription);
      // Update user subscription status in database
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
