import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/month',
      description: 'Perfect for freelancers just starting out',
      features: [
        'Up to 3 active projects',
        'Basic invoicing & payments',
        'Client portal access',
        'Email support',
        '1GB file storage',
        'Basic analytics'
      ],
      highlighted: false,
      popular: false
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'Best for growing freelance businesses',
      features: [
        'Unlimited projects',
        'Advanced project management',
        'Email automation',
        'CRM & activity tracking',
        'Priority support',
        '10GB file storage',
        'Advanced analytics',
        'Custom invoice templates',
        'Client proposals'
      ],
      highlighted: true,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$79',
      period: '/month',
      description: 'For agencies and teams',
      features: [
        'Everything in Professional',
        'Team collaboration',
        'White-label solution',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'Unlimited storage',
        'Advanced reporting',
        'Custom workflows',
        'SLA guarantee'
      ],
      highlighted: false,
      popular: false
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8
      }
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Simple,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Transparent
            </span>{' '}
            Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your business needs. All plans include a 14-day free trial 
            with no credit card required.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className="text-gray-600">Monthly</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" />
              <div className="w-14 h-8 bg-gray-200 rounded-full shadow-inner"></div>
              <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow transition-transform duration-300"></div>
            </div>
            <span className="text-gray-600">
              Yearly
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className={`relative ${plan.highlighted ? 'transform scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full ${
                plan.highlighted 
                  ? 'border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50' 
                  : 'border border-gray-200'
              }`}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 text-lg">
                      {plan.period}
                    </span>
                  </div>
                  
                  <Link
                    to="/register"
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 inline-block ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl hover:scale-105'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Start Free Trial
                  </Link>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                question: "Can I change my plan anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
              },
              {
                question: "Is there a free trial?",
                answer: "All plans include a 14-day free trial with full access to features. No credit card required to start."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers."
              },
              {
                question: "Can I cancel my subscription?",
                answer: "You can cancel your subscription at any time from your account settings. Your access will continue until the end of your billing period."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h4>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              30-Day Money Back Guarantee
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Not satisfied with FreelanceFlow? Get a full refund within 30 days of your purchase. 
              No questions asked, no hassle.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
