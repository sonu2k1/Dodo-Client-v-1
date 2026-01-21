import { GlassCard } from '../components/ui';
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

            <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-4 text-white">Chat with AI</h2>
                <div className="h-96 flex items-center justify-center text-gray-400">
                    AI Chat Interface Coming Soon...
                </div>
            </GlassCard>
        </div>
    );
};

export default AIConcierge;
