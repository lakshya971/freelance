import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/20 rounded-full blur-lg"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Transform
            </span>{' '}
            Your Freelance Business?
          </h2>
          
          <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed">
            Join thousands of successful freelancers who have streamlined their workflow, 
            increased their revenue, and built thriving businesses with FreelanceFlow.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { number: "10,000+", label: "Active Users" },
              { number: "$50M+", label: "Revenue Managed" },
              { number: "99.9%", label: "Uptime SLA" },
              { number: "4.9★", label: "User Rating" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
          >
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
            >
              <span className="relative z-10">Start Your Free Trial</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:border-white hover:bg-white/10 transition-all duration-300 text-lg backdrop-blur-sm">
              Schedule Demo
            </button>
          </motion.div>

          {/* Features Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Everything you need to succeed
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🚀',
                  title: '14-Day Free Trial',
                  description: 'Full access to all features, no credit card required'
                },
                {
                  icon: '💰',
                  title: 'No Setup Fees',
                  description: 'Start immediately with zero upfront costs'
                },
                {
                  icon: '🔒',
                  title: 'Secure & Reliable',
                  description: 'Bank-level security with 99.9% uptime guarantee'
                }
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-gray-300 mb-6">
              Trusted by freelancers at top companies
            </p>
            
            <div className="flex items-center justify-center space-x-8 opacity-60">
              <div className="text-lg font-medium text-white">Google</div>
              <div className="text-lg font-medium text-white">Microsoft</div>
              <div className="text-lg font-medium text-white">Apple</div>
              <div className="text-lg font-medium text-white">Netflix</div>
              <div className="text-lg font-medium text-white">Spotify</div>
            </div>
          </motion.div>

          {/* Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <span className="text-2xl">🛡️</span>
              <span className="text-white font-medium">
                30-day money-back guarantee
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
