import express from 'express';
import cors from 'cors';
import stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Initialize Stripe with your secret key
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  const { products } = req.body;

  try {
    // Prepare line items for Stripe
    const lineItems = products.map((product) => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: product.dish,
          images: [product.imgdata],
        },
        unit_amount: Math.round(product.price * 100), // Convert to paisa (smallest currency unit)
      },
      quantity: product.qnty,
    }));

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:5173/cart?payment=success', // Redirect to cart with success parameter
      cancel_url: 'http://localhost:5173/cart?payment=cancelled', // Redirect to cart with cancelled parameter
    });

    // Send session ID back to client
    res.json({ id: session.id });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    res.status(500).json({ 
      error: 'Error creating checkout session',
      details: err.message 
    });
  }
});

// Start the server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;