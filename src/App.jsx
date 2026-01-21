import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, Code, Palette, Zap } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassModal } from './components/ui';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen w-full bg-dark relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-neon-blue/20 blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-purple/20 blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full bg-neon-pink/20 blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold mb-4 text-gradient-neon">
            Glass UI Component Library
          </h1>
          <p className="text-xl text-gray-400">
            Production-Ready Glassmorphism Components
          </p>
        </motion.div>

        {/* Component Showcase Grid */}
        <div className="max-w-6xl mx-auto space-y-12">

          {/* GlassCard Showcase */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gradient">GlassCard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Sparkles, title: 'Blue Glow', color: 'blue', desc: 'Hover for blue neon effect' },
                { icon: Palette, title: 'Purple Glow', color: 'purple', desc: 'Hover for purple neon effect' },
                { icon: Zap, title: 'Pink Glow', color: 'pink', desc: 'Hover for pink neon effect' },
              ].map((item, index) => (
                <GlassCard
                  key={item.title}
                  glowColor={item.color}
                  animated
                  className="p-6"
                >
                  <item.icon className={`w-12 h-12 mb-4 text-neon-${item.color}`} />
                  <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* GlassButton Showcase */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gradient">GlassButton</h2>
            <GlassCard className="p-8">
              <div className="space-y-6">
                {/* Variants */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <GlassButton variant="primary" glowColor="blue">
                      Primary Button
                    </GlassButton>
                    <GlassButton variant="secondary">
                      Secondary Button
                    </GlassButton>
                    <GlassButton variant="outline">
                      Outline Button
                    </GlassButton>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <GlassButton size="sm" glowColor="cyan">
                      Small
                    </GlassButton>
                    <GlassButton size="md" glowColor="purple">
                      Medium
                    </GlassButton>
                    <GlassButton size="lg" glowColor="pink">
                      Large
                    </GlassButton>
                  </div>
                </div>

                {/* States */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">States</h3>
                  <div className="flex flex-wrap gap-4">
                    <GlassButton glowColor="green">
                      Active
                    </GlassButton>
                    <GlassButton disabled>
                      Disabled
                    </GlassButton>
                    <GlassButton fullWidth glowColor="blue">
                      Full Width Button
                    </GlassButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          </section>

          {/* GlassInput Showcase */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gradient">GlassInput</h2>
            <GlassCard className="p-8">
              <div className="max-w-2xl space-y-6">
                <GlassInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User size={20} />}
                  glowColor="cyan"
                />

                <GlassInput
                  type="email"
                  label="Email Address"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={20} />}
                  glowColor="blue"
                />

                <GlassInput
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={20} />}
                  glowColor="purple"
                />

                <GlassInput
                  label="Error State Example"
                  placeholder="This field has an error"
                  error
                  errorMessage="This is an error message"
                  glowColor="pink"
                />
              </div>
            </GlassCard>
          </section>

          {/* GlassModal Showcase */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gradient">GlassModal</h2>
            <GlassCard className="p-8">
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">
                  Click the button below to open a glassmorphism modal with animations
                </p>
                <GlassButton
                  onClick={() => setIsModalOpen(true)}
                  glowColor="cyan"
                >
                  Open Modal Demo
                </GlassButton>
              </div>
            </GlassCard>
          </section>

          {/* Features List */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gradient">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'Background: rgba(255,255,255,0.05)',
                'Backdrop blur: 18-24px',
                'Border: rgba(255,255,255,0.12)',
                'Rounded corners (0.75-1rem)',
                'Soft hover glow animations',
                'Multiple color variants',
                'Fully accessible',
                'Production-ready',
              ].map((feature, index) => (
                <GlassCard key={index} className="p-4" glowColor="blue">
                  <div className="flex items-center gap-3">
                    <Code className="text-neon-cyan" size={20} />
                    <span className="text-white">{feature}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Glass Modal Demo"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This is a production-ready glassmorphism modal component with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Smooth entrance/exit animations</li>
            <li>Backdrop blur effect</li>
            <li>Keyboard support (ESC to close)</li>
            <li>Click outside to close</li>
            <li>Body scroll lock when open</li>
            <li>Multiple size options</li>
          </ul>

          <div className="pt-4">
            <GlassInput
              placeholder="Try typing in the modal..."
              glowColor="purple"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <GlassButton
              variant="primary"
              glowColor="blue"
              onClick={() => setIsModalOpen(false)}
            >
              Confirm
            </GlassButton>
            <GlassButton
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

export default App;
