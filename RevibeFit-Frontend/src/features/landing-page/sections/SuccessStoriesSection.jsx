import { motion } from 'framer-motion';

const SuccessStoriesSection = () => {
  const stories = [
    {
      name: 'Sarah Johnson',
      role: 'Weight Loss Journey',
      image: '👩‍💼',
      story: 'Lost 30 pounds in 6 months with RevibeFit! The personalized nutrition plan and one-on-one trainer sessions completely transformed my life. I feel healthier, stronger, and more confident than ever before.',
      achievement: '30 lbs lost',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Strength Training',
      image: '👨‍💻',
      story: 'The live classes and expert guidance helped me build muscle and increase my strength by 40%. The trainers are incredibly knowledgeable and supportive. This is the best investment I\'ve made in myself!',
      achievement: '40% strength increase',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Wellness Transformation',
      image: '👩‍⚕️',
      story: 'RevibeFit helped me achieve a balanced lifestyle. The combination of workouts, nutrition planning, and mental wellness coaching has been life-changing. I have more energy and feel amazing every day!',
      achievement: 'Complete lifestyle change',
      rating: 5
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
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
            Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real transformations from real people. Join our community and write your own success story
          </p>
        </motion.div>

        {/* Stories Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {stories.map((story, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="bg-[#fffff0] rounded-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Profile */}
              <div className="flex items-center mb-6">
                <div className="text-5xl mr-4">{story.image}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{story.name}</h3>
                  <p className="text-[#3f8554] font-medium">{story.role}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(story.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              {/* Story */}
              <p className="text-gray-600 leading-relaxed mb-4">
                "{story.story}"
              </p>

              {/* Achievement Badge */}
              <div className="inline-block bg-[#3f8554] text-white px-4 py-2 rounded-full text-sm font-semibold">
                {story.achievement}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button className="px-8 py-4 bg-[#3f8554] text-white text-lg font-semibold rounded-full hover:bg-[#225533] transition-all duration-200 shadow-lg hover:shadow-xl">
            Start Your Journey Today
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
