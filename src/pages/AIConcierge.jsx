import { GlassCard } from '../components/ui';
import { ChatInterface } from '../components/chat';
import { Bot, Sparkles, Zap } from 'lucide-react';

const AIConcierge = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold text-gradient-neon mb-2">
                    AI Concierge
                </h1>
                <p className="text-gray-400">
                    Your intelligent assistant powered by Google Gemini
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Bot, title: 'Smart Assistance', desc: 'AI-powered help at your fingertips', color: 'cyan' },
                    { icon: Sparkles, title: 'Personalized', desc: 'Tailored to your needs', color: 'purple' },
                    { icon: Zap, title: 'Fast Response', desc: 'Instant answers and solutions', color: 'pink' },
                ].map((item) => (
                    <GlassCard key={item.title} glowColor={item.color} className="p-6">
                        <item.icon className={`w-12 h-12 mb-4 text-neon-${item.color}`} />
                        <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                    </GlassCard>
                ))}
            </div>

            <GlassCard className="overflow-hidden">
                <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.1)]">
                    <h2 className="text-2xl font-bold text-white">Chat with AI</h2>
                    <p className="text-sm text-gray-400 mt-1">Powered by Google Gemini</p>
                </div>
                <ChatInterface />
            </GlassCard>
        </div>
    );
};

export default AIConcierge;
