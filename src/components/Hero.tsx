import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Globe } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3)',
        }}
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'var(--gradient-glow)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 text-accent">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Website Generation</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Build Stunning Websites
            <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              In Seconds with AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Describe your dream website and watch as our advanced AI brings it to life. 
            Fast, responsive, and pixel-perfect on every device.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              variant="hero" 
              size="lg"
              onClick={onGetStarted}
              className="w-full sm:w-auto"
            >
              <Zap className="w-5 h-5" />
              Start Building Now
            </Button>
            <Button 
              variant="glass" 
              size="lg"
              className="w-full sm:w-auto"
            >
              <Globe className="w-5 h-5" />
              See Examples
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Generate in seconds" },
              { icon: Globe, title: "Fully Responsive", desc: "Perfect on all devices" },
              { icon: Sparkles, title: "AI-Powered", desc: "Smart & intuitive" },
            ].map((feature, i) => (
              <div 
                key={i}
                className="p-6 rounded-xl bg-card/5 backdrop-blur-md border border-primary/10 hover:border-primary/30 transition-[var(--transition-smooth)] hover:shadow-[var(--shadow-card)]"
              >
                <feature.icon className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
