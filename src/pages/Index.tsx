import { useRef } from "react";
import { Hero } from "@/components/Hero";
import { GeneratorSection } from "@/components/GeneratorSection";

const Index = () => {
  const generatorRef = useRef<HTMLDivElement>(null);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero onGetStarted={scrollToGenerator} />
      <div ref={generatorRef}>
        <GeneratorSection />
      </div>
    </div>
  );
};

export default Index;
