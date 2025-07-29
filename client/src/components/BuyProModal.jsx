import React from "react";

export default function BuyProModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-center">Upgrade to Pro</h2>
        <p className="mb-6 text-center text-gray-600">Unlock unlimited clients, proposals, invoices, and automation features.</p>
        <div className="mb-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-primary-600 mb-1">$9</span>
          <span className="text-gray-500">per month</span>
        </div>
        <form action="/api/stripe/checkout" method="POST">
          <input type="hidden" name="plan" value="pro" />
          <button type="submit" className="btn-primary w-full py-3 text-lg font-semibold">Buy with Stripe</button>
        </form>
      </div>
    </div>
  );
}
