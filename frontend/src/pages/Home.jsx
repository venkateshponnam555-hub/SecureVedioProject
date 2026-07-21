// frontend/src/pages/Home.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Upload,
  Zap,
  Globe,
  Fingerprint,
  Server,
  ArrowRight,
  CheckCircle,
  Star,
} from 'lucide-react';

const Home = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = !!(token && user);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      icon: Lock,
      title: 'AES-256 Encryption',
      description: 'Military-grade symmetric encryption for your video content with GCM mode for authentication.',
      color: 'from-cyan-400 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      icon: Key,
      title: 'ECC Key Exchange',
      description: 'Elliptic Curve Cryptography for secure key agreement with perfect forward secrecy.',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      icon: Fingerprint,
      title: 'RSA-4096 Protection',
      description: 'Asymmetric encryption wraps session keys for maximum security and authentication.',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Lightning-fast encryption and decryption with optimized chunking algorithms.',
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      icon: Server,
      title: 'Secure Storage',
      description: 'Encrypted videos stored with zero-knowledge architecture on distributed systems.',
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      icon: Globe,
      title: 'Global CDN',
      description: 'Stream your encrypted content worldwide with low latency and high availability.',
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
    },
  ];

  const stats = [
    { value: '256-bit', label: 'AES Encryption', icon: Lock },
    { value: '4096-bit', label: 'RSA Key Size', icon: Key },
    { value: '521-bit', label: 'ECC Curve', icon: Shield },
    { value: '99.99%', label: 'Uptime SLA', icon: Server },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">
                Next-Gen Video Security Platform
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Secure Your Videos with </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400">
                Hybrid Cryptography
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              A novel multikey encryption system combining AES-256, ECC, and RSA-4096 for
              military-grade video protection. Upload, encrypt, stream, and share securely.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/upload" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload & Encrypt Video
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link to="/about" className="btn-secondary text-lg px-10 py-4">
                Learn More
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Free 5GB storage
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Enterprise security
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 -mt-16 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="stat-card text-center hover:border-cyan-500/30 transition-all duration-300"
              >
                <stat.icon className="w-6 h-6 text-cyan-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Why Choose SecureVault?
              </span>
            </h2>
            <p className="section-subtitle">
              Our hybrid multikey cryptography approach ensures maximum security for your video
              content at every stage.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="glass-card-hover p-6 group"
              >
                <div
                  className={`p-3 rounded-xl ${feature.bgColor} border ${feature.borderColor} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-6 h-6 bg-clip-text text-transparent bg-gradient-to-br ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title text-white">How It Works</h2>
            <p className="section-subtitle">
              Four simple steps to secure your video communication
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Upload', description: 'Upload your video file securely to our platform.' },
              { step: '02', title: 'Encrypt', description: 'AES-256 encrypts chunks, ECC exchanges keys, RSA protects them.' },
              { step: '03', title: 'Store', description: 'Encrypted chunks stored with zero-knowledge architecture.' },
              { step: '04', title: 'Stream', description: 'Authorized users decrypt and stream seamlessly.' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-700/50 flex items-center justify-center">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Secure Your Videos?
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Join thousands of users who trust SecureVault for their video encryption needs.
                Start with a free account today.
              </p>
              {isAuthenticated ? (
                <Link to="/upload" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Video Now
                </Link>
              ) : (
                <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Create Free Account
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;