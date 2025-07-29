const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/checkout
router.post('/checkout', async (req, res) => {
  try {
    const { priceId, email } = req.body;
    if (!priceId || !email) {
      return res.status(400).json({ error: 'Missing priceId or email' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?upgrade=cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
