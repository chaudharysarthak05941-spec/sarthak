import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Code2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const GeneratorSection = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the website you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation (will connect to real AI in next step)
    setTimeout(() => {
      const sampleCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Your AI-Generated Website</h1>
        <p>${prompt}</p>
    </div>
</body>
</html>`;
      
      setGeneratedCode(sampleCode);
      setIsGenerating(false);
      
      toast({
        title: "Website generated!",
        description: "Your AI-powered website is ready.",
      });
    }, 2000);
  };

  return (
    <section className="min-h-screen py-20 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Describe Your Vision
          </h2>
          <p className="text-xl text-muted-foreground">
            Tell us what you want, and we'll build it for you
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-6 bg-card/50 backdrop-blur-md border-primary/20">
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-accent" />
                Website Description
              </label>
              <Textarea
                placeholder="Describe your website... e.g., 'A modern landing page for a tech startup with a hero section, features grid, and contact form. Use purple and blue colors.'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] bg-background/50 border-primary/20 focus:border-accent resize-none"
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="hero"
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Website
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-6 bg-card/50 backdrop-blur-md border-primary/20">
            {generatedCode ? (
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Code
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-0">
                  <div className="rounded-lg overflow-hidden border border-primary/20 bg-background">
                    <iframe
                      srcDoc={generatedCode}
                      className="w-full h-[400px]"
                      title="Generated Website Preview"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="code" className="mt-0">
                  <div className="rounded-lg overflow-auto max-h-[400px] bg-background border border-primary/20">
                    <pre className="p-4 text-xs">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <Code2 className="w-12 h-12 mx-auto opacity-50" />
                  <p>Your generated website will appear here</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};
