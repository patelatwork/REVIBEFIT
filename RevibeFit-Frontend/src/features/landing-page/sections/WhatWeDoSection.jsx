import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const WhatWeDoSection = () => {
  const services = [
    {
      title: 'Live Classes',
      description: 'Join interactive live fitness classes with expert trainers and connect with a community of fitness enthusiasts.',
      icon: (
        <svg className="w-12 h-12 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      link: '/live-classes'
    },
    {
      title: 'One-on-One Trainer Interaction',
      description: 'Get personalized attention and customized workout plans through dedicated one-on-one sessions with certified trainers.',
      icon: (
        <svg className="w-12 h-12 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      link: '/trainers'
    },
    {
      title: 'Content from Trainers',
      description: 'Access exclusive workout videos, nutrition tips, and wellness content created by our expert trainers.',
      icon: (
        <svg className="w-12 h-12 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/content'
    },
    {
      title: 'Lab Test Booking',
      description: 'Book comprehensive health and fitness lab tests to track your progress and optimize your wellness journey.',
      icon: (
        <svg className="w-12 h-12 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      link: '/lab-tests'
    },
    {
      title: 'Workouts Guide',
      description: 'Follow structured workout programs designed for all fitness levels, from beginners to advanced athletes.',
      icon: (
        <svg className="w-12 h-12 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      link: '/workouts'
    },
    {
      title: 'Nutrition Planner',
      description: 'Create personalized meal plans and track your nutrition with expert guidance to complement your fitness goals.',
      icon: (
        <svg className="w-12 h-12 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      link: '/nutrition-plan'
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

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#225533] mb-4">
            What We Do
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive fitness solutions tailored to help you achieve your health and wellness goals
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
            >
              <Link
                to={service.link}
                className="block group bg-[#fffff0] rounded-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full"
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#3f8554] transition-colors duration-200">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhatWeDoSection;
