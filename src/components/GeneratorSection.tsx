import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, History, ImageIcon, VideoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
  media_url?: string;
  media_type?: "image" | "video";
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export const GeneratorSection = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadConversations();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadConversations();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }
    
    setConversations(data || []);
  };

  const createNewConversation = async (firstMessage: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    setCurrentConversationId(data.id);
    loadConversations();
    return data.id;
  };

  const saveMessage = async (conversationId: string, role: string, content: string, mediaUrl?: string, mediaType?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        media_url: mediaUrl,
        media_type: mediaType
      });

    if (error) {
      console.error('Error saving message:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const typedMessages: Message[] = (data || []).map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      media_url: msg.media_url || undefined,
      media_type: msg.media_type as "image" | "video" | undefined
    }));

    setMessages(typedMessages);
    setCurrentConversationId(conversationId);
    setIsHistoryOpen(false);
  };

  const extractHTMLCode = (text: string): string => {
    const htmlMatch = text.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) return htmlMatch[1];
    
    const docTypeMatch = text.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/);
    if (docTypeMatch) return docTypeMatch[1];
    
    return "";
  };

  const generateImage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const prompt = input;
    setInput("");
    setIsGenerating(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId && user) {
        conversationId = await createNewConversation(prompt);
      }

      if (conversationId && user) {
        await saveMessage(conversationId, 'user', prompt);
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          generateImage: true
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      const imageUrl = data.imageUrl;

      const assistantMessage: Message = {
        role: "assistant",
        content: "I've generated an image for you:",
        media_url: imageUrl,
        media_type: "image"
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (conversationId && user) {
        await saveMessage(conversationId, 'assistant', "I've generated an image for you:", imageUrl, 'image');
      }

      toast({
        title: "Image generated",
        description: "Your image has been created successfully",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const prompt = input;
    setInput("");
    setIsGenerating(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId && user) {
        conversationId = await createNewConversation(prompt);
      }

      if (conversationId && user) {
        await saveMessage(conversationId, 'user', prompt);
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to start video generation");
      }

      const prediction = await response.json();
      
      const loadingMessage: Message = {
        role: "assistant",
        content: "Generating your video... This may take a few minutes."
      };
      setMessages((prev) => [...prev, loadingMessage]);

      const checkStatus = async () => {
        const statusResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ predictionId: prediction.id }),
        });

        const status = await statusResponse.json();

        if (status.status === "succeeded") {
          const videoUrl = status.output?.[0];
          const assistantMessage: Message = {
            role: "assistant",
            content: "I've generated a video for you:",
            media_url: videoUrl,
            media_type: "video"
          };

          setMessages((prev) => [...prev.slice(0, -1), assistantMessage]);

          if (conversationId && user) {
            await saveMessage(conversationId, 'assistant', "I've generated a video for you:", videoUrl, 'video');
          }

          toast({
            title: "Video generated",
            description: "Your video has been created successfully",
          });
          setIsGenerating(false);
        } else if (status.status === "failed") {
          throw new Error("Video generation failed");
        } else {
          setTimeout(checkStatus, 3000);
        }
      };

      setTimeout(checkStatus, 3000);
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    const prompt = input;
    setInput("");
    setIsGenerating(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId && user) {
        conversationId = await createNewConversation(prompt);
      }

      if (conversationId && user) {
        await saveMessage(conversationId, 'user', prompt);
      }

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

      if (conversationId && user) {
        await saveMessage(conversationId, 'assistant', assistantMessage);
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Website Builder Chat
            </h2>
            {user && (
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <History className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Conversation History</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setMessages([]);
                          setCurrentConversationId(null);
                          setGeneratedCode("");
                          setIsHistoryOpen(false);
                        }}
                      >
                        New Conversation
                      </Button>
                      {conversations.map((conv) => (
                        <Button
                          key={conv.id}
                          variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-left"
                          onClick={() => loadConversation(conv.id)}
                        >
                          <div className="truncate">
                            <div className="font-medium truncate">{conv.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(conv.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
          </div>
          
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
                    {msg.media_url && msg.media_type === "image" && (
                      <img src={msg.media_url} alt="Generated" className="mt-2 rounded-lg max-w-full" />
                    )}
                    {msg.media_url && msg.media_type === "video" && (
                      <video src={msg.media_url} controls className="mt-2 rounded-lg max-w-full" />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
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
            <div className="flex gap-2">
              <Button
                onClick={generateImage}
                disabled={isGenerating || !input.trim()}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Image
              </Button>
              <Button
                onClick={generateVideo}
                disabled={isGenerating || !input.trim()}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <VideoIcon className="h-4 w-4 mr-2" />
                Generate Video
              </Button>
            </div>
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
