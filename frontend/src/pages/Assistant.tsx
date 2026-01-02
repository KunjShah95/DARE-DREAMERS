
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Send, FileText, Sparkles, Bot, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';

const Assistant = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Hello! I'm your AI research assistant. I can help you find papers and answer questions based on them. Try asking 'What are the latest trends in React Performance?'" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isCrawling, setIsCrawling] = useState(false);
    const [papers, setPapers] = useState<any[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';

            const contextPapersIds = papers.map(p => p.id);
            const res = await api.chatWithAI(userId, userMessage, contextPapersIds);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.response || "I couldn't generate a response at this time."
            }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Error: Failed to connect to AI service."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleCrawl = async () => {
        const query = prompt("What research topic should I crawl?");
        if (!query) return;

        setIsCrawling(true);
        try {
            const results = await api.crawlPapers(query);
            setPapers(prev => [...results, ...prev]);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Found and analyzed ${results.length} new papers about "${query}". They are now in my context.`
            }]);
        } catch (e) {
            console.error(e);
            alert("Failed to crawl papers.");
        } finally {
            setIsCrawling(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Bot size={16} className="text-primary" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-muted text-foreground rounded-tl-none text-left whitespace-pre-wrap'
                                }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Bot size={16} className="text-primary" />
                            </div>
                            <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex gap-1">
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-75" />
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="p-4 bg-background border-t border-border">
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-muted border-none rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Ask anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <Button size="icon" className="rounded-full w-10 h-10" onClick={handleSend} disabled={isTyping}>
                            <Send size={18} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Paper Context Sidebar */}
            <div className="w-80 hidden xl:flex flex-col gap-4">
                <div className="bg-card border border-border rounded-xl p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 font-bold mb-4">
                        <FileText size={20} className="text-primary" />
                        <h2>Research Context</h2>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 h-0">
                        {papers.length === 0 && (
                            <div className="text-center text-muted-foreground py-8 text-xs">
                                No papers in context.<br />Click below to crawl.
                            </div>
                        )}
                        {papers.map((paper, i) => (
                            <div key={paper.id || i} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border text-xs">
                                <div className="font-semibold mb-1 truncate">{paper.title}</div>
                                <div className="text-muted-foreground line-clamp-2">{paper.abstract}</div>
                                <a href={paper.url} target="_blank" rel="noreferrer" className="text-primary hover:underline mt-1 block">View Source</a>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        className="mt-4 gap-2 w-full text-xs"
                        size="sm"
                        onClick={handleCrawl}
                        disabled={isCrawling}
                    >
                        {isCrawling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {isCrawling ? 'Crawling...' : 'Crawl New Papers'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
