import React from 'react';
import { motion } from 'framer-motion';

const Features = () => {
  const features = [
    {
      icon: '📊',
      title: 'Visual Project Manager',
      description: 'Intuitive Kanban boards and Gantt charts to track project progress, manage tasks, and meet deadlines with ease.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '📧',
      title: 'Email Automation',
      description: 'Automated follow-ups, proposal reminders, and client communications to keep your business running smoothly.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '👥',
      title: 'Client Portal',
      description: 'Secure client access to project updates, file sharing, invoices, and real-time communication.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '📈',
      title: 'Analytics Dashboard',
      description: 'Comprehensive business insights with revenue forecasting, client analytics, and performance metrics.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: '🎯',
      title: 'CRM & Activity Hub',
      description: 'Complete customer relationship management with activity tracking and engagement insights.',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Intelligent reminders for deadlines, payments, follow-ups, and important business milestones.',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: '💬',
      title: 'Internal Support Chat',
      description: 'Built-in messaging system for seamless communication with clients and team members.',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: '📄',
      title: 'Professional Invoicing',
      description: 'Beautiful, customizable invoice templates with automated payment tracking and reminders.',
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Scale Your Business
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From project management to client relationships, FreelanceFlow provides 
            all the tools you need to run a successful freelance business.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-12 lg:p-16 flex flex-col justify-center">
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Streamline Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    Workflow
                  </span>
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Our intuitive project management tools help you stay organized, 
                  track progress, and deliver projects on time. From task creation 
                  to client delivery, manage everything in one place.
                </p>
                <div className="space-y-4">
                  {[
                    'Drag-and-drop task management',
                    'Real-time progress tracking',
                    'Automated deadline reminders',
                    'Team collaboration tools'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 lg:p-12 flex items-center justify-center">
                <div className="relative">
                  {/* Kanban Board Preview */}
                  <div className="bg-white rounded-xl shadow-lg p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="grid grid-cols-3 gap-4">
                      {['To Do', 'In Progress', 'Done'].map((column, colIndex) => (
                        <div key={colIndex} className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700 text-center">
                            {column}
                          </h4>
                          {[1, 2].map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className="bg-gray-50 rounded-lg p-3 shadow-sm"
                            >
                              <div className="w-full h-2 bg-gray-200 rounded mb-2"></div>
                              <div className="w-3/4 h-1 bg-gray-300 rounded"></div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Floating Task Card */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500"
                  >
                    <div className="text-xs font-medium text-gray-800">Task Completed!</div>
                    <div className="text-xs text-gray-500">Website Design</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white">
            <h3 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Business?
            </h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of freelancers who have streamlined their workflow 
              and increased their revenue with FreelanceFlow.
            </p>
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Get Started for Free
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
