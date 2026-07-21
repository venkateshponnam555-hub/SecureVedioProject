// frontend/src/pages/About.jsx

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Cpu,
  Users,
  Target,
  Award,
  BookOpen,
  Code2,
  Layers,
  Fingerprint,
} from 'lucide-react';

const About = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  const team = [
    { name: 'Dr. Sarah Chen', role: 'Cryptography Researcher', avatar: 'SC', color: 'from-cyan-400 to-blue-500' },
    { name: 'Alex Rodriguez', role: 'Security Engineer', avatar: 'AR', color: 'from-purple-400 to-pink-500' },
    { name: 'Emily Watson', role: 'Full Stack Developer', avatar: 'EW', color: 'from-emerald-400 to-cyan-500' },
    { name: 'Michael Park', role: 'DevOps Architect', avatar: 'MP', color: 'from-amber-400 to-orange-500' },
  ];

  const technologies = [
    { name: 'AES-256-GCM', description: 'Symmetric Encryption', icon: Lock },
    { name: 'ECC P-521', description: 'Key Exchange', icon: Key },
    { name: 'RSA-4096', description: 'Key Protection', icon: Shield },
    { name: 'SHA-512', description: 'Hashing Algorithm', icon: Fingerprint },
    { name: 'PBKDF2', description: 'Key Derivation', icon: Cpu },
    { name: 'TLS 1.3', description: 'Transport Security', icon: Layers },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">About SecureVault</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              A novel hybrid multikey cryptography platform for secure video communication.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Our Mission', description: 'Military-grade video encryption accessible to everyone.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { icon: Award, title: 'Our Vision', description: 'Zero-knowledge architecture as standard for all video communication.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: Users, title: 'Our Commitment', description: 'Continuous research to stay ahead of quantum computing threats.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card text-center">
                <div className={`p-3 rounded-xl ${item.bg} w-fit mx-auto mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="section-title">Technology Stack</h2>
            <p className="section-subtitle">Enterprise-grade technologies powering our encryption</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {technologies.map((tech, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass-card text-center p-4">
                <tech.icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <h4 className="text-white text-sm font-medium">{tech.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="section-title">Our Team</h2>
            <p className="section-subtitle">Experts behind SecureVault's security</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card text-center">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-2xl font-bold`}>
                  {member.avatar}
                </div>
                <h3 className="text-white font-semibold">{member.name}</h3>
                <p className="text-sm text-slate-400">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeInUp} className="glass-card p-12">
            <Code2 className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Open Source</h2>
            <p className="text-slate-400 mb-6">Our encryption libraries are open source and audited by the security community.</p>
            <div className="flex justify-center gap-4">
              <a href="#" className="btn-secondary"><BookOpen className="w-4 h-4" /> Documentation</a>
              <a href="#" className="btn-primary"><Code2 className="w-4 h-4" /> View on GitHub</a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;