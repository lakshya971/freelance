import React, { useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function BuyProModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Get user email from AuthContext
      const userEmail = user?.email || 'user@example.com';
      
      // First, let's create a price if it doesn't exist (for demo purposes)
      let priceId = 'price_pro_monthly';
      
      try {
        const priceResponse = await axios.post('/api/stripe/create-price');
        priceId = priceResponse.data.priceId;
        console.log('Created new price:', priceId);
      } catch (priceError) {
        console.log('Using default price ID or price already exists');
      }
      
      // Call your backend to create checkout session
      const response = await axios.post('/api/stripe/checkout', {
        priceId: priceId,
        email: userEmail
      });

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-center">Upgrade to Pro</h2>
        <p className="mb-6 text-center text-gray-600">Unlock unlimited clients, proposals, invoices, and automation features.</p>
        <div className="mb-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-emerald-600 mb-1">$9</span>
          <span className="text-gray-500">per month</span>
        </div>
        <button 
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Upgrade with Stripe'}
        </button>
      </div>
    </div>
  );
}
