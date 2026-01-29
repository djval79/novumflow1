import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { FormField } from '../../../packages/ui/src/components/Notification';

interface FormFieldData {
  value: string;
  error: string;
  touched: boolean;
}

interface AnimatedFormProps {
  onSubmit: (data: { email: string; password: string; name: string }) => void;
  loading?: boolean;
}

const AnimatedForm = ({ onSubmit, loading = false }: AnimatedFormProps) => {
  const [formData, setFormData] = useState({
    name: { value: '', error: '', touched: false },
    email: { value: '', error: '', touched: false },
    password: { value: '', error: '', touched: false }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        return value.length < 2 ? 'Name must be at least 2 characters' : '';
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email address' : '';
      case 'password':
        return value.length < 8 ? 'Password must be at least 8 characters' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const error = validateField(field, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        error: prev[field].touched ? error : '',
        touched: true
      }
    }));
  };

  const handleBlur = (field: keyof typeof formData) => () => {
    const value = formData[field].value;
    const error = validateField(field, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
        touched: true
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameError = validateField('name', formData.name.value);
    const emailError = validateField('email', formData.email.value);
    const passwordError = validateField('password', formData.password.value);
    
    if (nameError || emailError || passwordError) {
      setFormData(prev => ({
        name: { ...prev.name, error: nameError, touched: true },
        email: { ...prev.email, error: emailError, touched: true },
        password: { ...prev.password, error: passwordError, touched: true }
      }));
      return;
    }

    try {
      await onSubmit({
        name: formData.name.value,
        email: formData.email.value,
        password: formData.password.value
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const inputVariants = {
    focus: { scale: 1.02, borderColor: '#3b82f6' },
    blur: { scale: 1, borderColor: '#e5e7eb' }
  };

  const errorShake = {
    x: [0, -5, 5, -5, 5, 0],
    transition: { duration: 0.5 }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 15,
          duration: 0.6 
        }}
      >
        <motion.h2
          className="text-3xl font-bold text-gray-900 text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Create Account
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Full Name"
            error={formData.name.error}
            success={formData.name.touched && !formData.name.error && formData.name.value ? 'Valid' : undefined}
          >
            <motion.div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <motion.input
                type="text"
                value={formData.name.value}
                onChange={handleInputChange('name')}
                onBlur={handleBlur('name')}
                variants={inputVariants}
                whileFocus="focus"
                whileBlur="blur"
                animate={formData.name.error ? errorShake : {}}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  formData.name.error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </motion.div>
          </FormField>

          <FormField
            label="Email Address"
            error={formData.email.error}
            success={formData.email.touched && !formData.email.error && formData.email.value ? 'Valid' : undefined}
          >
            <motion.div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <motion.input
                type="email"
                value={formData.email.value}
                onChange={handleInputChange('email')}
                onBlur={handleBlur('email')}
                variants={inputVariants}
                whileFocus="focus"
                whileBlur="blur"
                animate={formData.email.error ? errorShake : {}}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  formData.email.error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                disabled={loading}
              />
            </motion.div>
          </FormField>

          <FormField
            label="Password"
            error={formData.password.error}
            success={formData.password.touched && !formData.password.error && formData.password.value.length >= 8 ? 'Strong' : undefined}
          >
            <motion.div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <motion.input
                type={showPassword ? 'text' : 'password'}
                value={formData.password.value}
                onChange={handleInputChange('password')}
                onBlur={handleBlur('password')}
                variants={inputVariants}
                whileFocus="focus"
                whileBlur="blur"
                animate={formData.password.error ? errorShake : {}}
                className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  formData.password.error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                disabled={loading}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
            </motion.div>
          </FormField>

          <motion.button
            type="submit"
            disabled={loading || Object.values(formData).some(f => f.error)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Creating account...
                </motion.div>
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Create Account
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <CheckCircle size={20} />
              Account created successfully!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedForm;