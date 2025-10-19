import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const GeneratorSection = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const extractHTMLCode = (text: string): string => {
    const htmlMatch = text.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) return htmlMatch[1];
    
    const docTypeMatch = text.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/);
    if (docTypeMatch) return docTypeMatch[1];
    
    return "";
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });

              const htmlCode = extractHTMLCode(assistantMessage);
              if (htmlCode) {
                setGeneratedCode(htmlCode);
              }
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }

      toast({
        title: "Response received",
        description: "AI has responded to your message",
      });

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Chat Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-elegant flex flex-col h-[700px]">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            AI Website Builder Chat
          </h2>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-muted-foreground mb-4">
                    Start a conversation with the AI to build your website
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Example: "I need a landing page for my coffee shop"
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary/10 ml-8 border border-primary/20"
                        : "bg-secondary/10 mr-8 border border-border/30"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Describe what you want to build..."
              className="bg-background/50 border-primary/20 focus:border-primary"
              disabled={isGenerating}
            />
            <Button
              onClick={sendMessage}
              disabled={isGenerating || !input.trim()}
              className="bg-gradient-primary hover:shadow-glow"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-elegant h-[700px] flex flex-col">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Live Preview
          </h2>
          
          {generatedCode ? (
            <Tabs defaultValue="preview" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="flex-1 mt-0">
                <div className="rounded-lg overflow-hidden border border-border/50 bg-background/30 h-full">
                  <iframe
                    srcDoc={generatedCode}
                    className="w-full h-full"
                    title="Website Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="flex-1 mt-0">
                <div className="rounded-lg overflow-hidden border border-border/50 h-full">
                  <pre className="bg-background/80 p-4 overflow-auto h-full">
                    <code className="text-sm text-foreground/90">{generatedCode}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-background/30">
              <p className="text-muted-foreground text-center px-4">
                Your generated website will appear here.<br />
                Start chatting with the AI to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
