import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Calendar, Activity, TrendingUp } from 'lucide-react';
import { ParticleBackground } from '../../../packages/ui/src/components/BackgroundEffects';
import { AnimatedButton, AnimatedCard, LoadingSpinner } from '../../../packages/ui/src/index';

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
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const AnimatedLandingPage = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const features = [
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamlessly coordinate with your healthcare team",
      color: "bg-blue-500"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Intelligent appointment and resource management",
      color: "bg-green-500"
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Track patient care and staff activities",
      color: "bg-purple-500"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "Data-driven insights for better decisions",
      color: "bg-orange-500"
    }
  ];

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground particleCount={30} enabled={true} className="opacity-30" />
      
      <motion.div
        className="relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Section */}
        <motion.section
          className="min-h-screen flex items-center justify-center px-4"
          variants={itemVariants}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              className="text-6xl md:text-8xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              NovumFlow
              <motion.span
                className="block text-3xl md:text-5xl text-blue-600 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Healthcare Management Reimagined
              </motion.span>
            </motion.h1>
            
            <motion.p
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Transform your healthcare practice with our comprehensive suite of tools designed for modern care coordination.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <AnimatedButton
                variant="primary"
                size="lg"
                loading={isLoading}
                onClick={handleGetStarted}
                className="text-lg px-8 py-4"
              >
                {isLoading ? 'Initializing...' : 'Get Started Now'}
              </AnimatedButton>
              
              <AnimatedButton
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4"
              >
                <Link to="/demo" className="flex items-center gap-2">
                  View Demo
                  <ArrowRight size={20} />
                </Link>
              </AnimatedButton>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          className="py-20 px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16"
              variants={itemVariants}
            >
              Powerful Features
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <AnimatedCard
                  key={index}
                  delay={index}
                  hover={true}
                  className="text-center p-8 cursor-pointer"
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                >
                  <motion.div
                    className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, 10, -10, 0],
                      transition: { rotate: { duration: 0.5 } }
                    }}
                  >
                    <feature.icon size={32} className="text-white" />
                  </motion.div>
                  
                  <motion.h3
                    className="text-xl font-semibold text-gray-900 mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    {feature.title}
                  </motion.h3>
                  
                  <motion.p
                    className="text-gray-600"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    {feature.description}
                  </motion.p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          className="py-20 px-4 bg-gray-50"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { number: "10K+", label: "Healthcare Providers" },
                { number: "50K+", label: "Patients Managed" },
                { number: "99.9%", label: "Uptime" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="p-8"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className="text-5xl font-bold text-blue-600 mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    {stat.number}
                  </motion.div>
                  <motion.div
                    className="text-xl text-gray-600"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    {stat.label}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default AnimatedLandingPage;