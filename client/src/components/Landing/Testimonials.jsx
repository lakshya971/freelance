import React from 'react';
import { motion } from 'framer-motion';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "UI/UX Designer",
      company: "Design Studio Pro",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612c2a3?w=150&h=150&fit=crop&crop=face",
      content: "FreelanceFlow transformed how I manage my design projects. The client portal feature alone has saved me hours every week. My clients love the transparency and real-time updates.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Full-Stack Developer",
      company: "TechSolutions LLC",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "The project management tools are incredible. I can track multiple projects simultaneously and the automated invoicing has streamlined my billing process completely.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Content Strategist",
      company: "Creative Agency",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content: "Since using FreelanceFlow, my revenue has increased by 40%. The analytics dashboard gives me insights I never had before, helping me make better business decisions.",
      rating: 5
    },
    {
      name: "David Park",
      role: "Marketing Consultant",
      company: "Growth Partners",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content: "The CRM features and email automation have revolutionized my client relationships. I can focus on delivering great work while FreelanceFlow handles the business side.",
      rating: 5
    },
    {
      name: "Lisa Thompson",
      role: "Graphic Designer",
      company: "Visual Impact Studio",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      content: "The professional invoice templates and payment tracking have made billing so much easier. I get paid faster and my clients appreciate the professional presentation.",
      rating: 5
    },
    {
      name: "James Wilson",
      role: "Web Developer",
      company: "Code Craft Solutions",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      content: "FreelanceFlow's project tracking and deadline management keep me organized and on schedule. I've never missed a deadline since I started using it.",
      rating: 5
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

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Loved by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Thousands
            </span>{' '}
            of Freelancers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what our users have to say about how FreelanceFlow has 
            transformed their freelance businesses.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {[
            { number: "10,000+", label: "Happy Users" },
            { number: "4.9/5", label: "Average Rating" },
            { number: "99.9%", label: "Uptime" },
            { number: "24/7", label: "Support" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-indigo-600">
                      {testimonial.company}
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Video Testimonial Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-12 lg:p-16 flex flex-col justify-center">
                <div className="flex items-center mb-6">
                  {renderStars(5)}
                  <span className="ml-3 text-gray-600 font-medium">5.0 out of 5</span>
                </div>
                
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  "FreelanceFlow helped me{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    double my revenue
                  </span>{' '}
                  in just 6 months"
                </h3>
                
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  "The analytics and project management features gave me insights 
                  into my business I never had before. I can now take on more clients 
                  and deliver better results."
                </p>
                
                <div className="flex items-center">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&crop=face"
                    alt="Featured testimonial"
                    className="w-15 h-15 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-bold text-gray-900 text-lg">
                      Rachel Martinez
                    </div>
                    <div className="text-gray-600">
                      Digital Marketing Specialist
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 lg:p-12 flex items-center justify-center">
                <div className="relative">
                  <div className="w-80 h-60 bg-white rounded-xl shadow-2xl flex items-center justify-center">
                    <button className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors duration-300 group">
                      <svg className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Play button animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-indigo-300 rounded-full animate-ping opacity-30"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-8">Trusted by freelancers worldwide</p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            {/* Trust badges/logos would go here */}
            <div className="text-2xl font-bold text-gray-400">Freelancer.com</div>
            <div className="text-2xl font-bold text-gray-400">Upwork</div>
            <div className="text-2xl font-bold text-gray-400">Fiverr</div>
            <div className="text-2xl font-bold text-gray-400">99designs</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
