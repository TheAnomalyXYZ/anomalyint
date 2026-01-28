import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Brain, User, FileText, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { corporaApi } from '../../lib/supabase';
import { Corpus } from '../../lib/types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ file_name: string; similarity: number }>;
}

export function RagChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [selectedCorpusId, setSelectedCorpusId] = useState<string>('');
  const [loadingCorpora, setLoadingCorpora] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available corpora when component mounts
  useEffect(() => {
    loadCorpora();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCorpora = async () => {
    setLoadingCorpora(true);
    try {
      const data = await corporaApi.getCorpora();
      // Only show completed corpora with indexed documents
      const available = data.filter(
        (c) => c.syncStatus === 'completed' && c.lastSyncStats && c.lastSyncStats.files_processed > 0
      );
      setCorpora(available);
      if (available.length > 0 && !selectedCorpusId) {
        setSelectedCorpusId(available[0].id);
      }
    } catch (error) {
      console.error('Failed to load corpora:', error);
    } finally {
      setLoadingCorpora(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    if (!selectedCorpusId) {
      toast.error('Please select a knowledge base first');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corpus_id: selectedCorpusId,
          message: userMessage,
          conversation_history: messages.slice(-6), // Last 6 messages for context
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get response');
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');

      // Remove the user message if failed
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
        aria-label="Open Knowledge Base Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Knowledge Base Chat</h3>
            <p className="text-xs text-white/80">Ask questions about your documents</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Corpus Selector */}
      <div className="p-3 border-b bg-slate-50">
        {loadingCorpora ? (
          <div className="text-sm text-muted-foreground">Loading knowledge bases...</div>
        ) : corpora.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No knowledge bases available. Sync a corpus first.
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Knowledge Base:</label>
            <Select value={selectedCorpusId} onValueChange={setSelectedCorpusId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select a knowledge base" />
              </SelectTrigger>
              <SelectContent>
                {corpora.map((corpus) => (
                  <SelectItem key={corpus.id} value={corpus.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{corpus.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {corpus.lastSyncStats?.files_processed || 0} docs
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about your documents
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center justify-center w-8 h-8 gradient-primary text-white rounded-lg flex-shrink-0">
                    <Brain className="h-4 w-4" />
                  </div>
                )}
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div
                    className={cn(
                      'rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                        : 'bg-muted'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm whitespace-pre-wrap',
                        message.role === 'user' ? 'text-white' : ''
                      )}
                    >
                      {message.content}
                    </p>
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.sources.slice(0, 3).map((source, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          {source.file_name}
                          <span className="text-muted-foreground">
                            ({(source.similarity * 100).toFixed(0)}%)
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-200 rounded-lg flex-shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex items-center justify-center w-8 h-8 gradient-primary text-white rounded-lg flex-shrink-0">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Ask about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={loading || corpora.length === 0}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading || corpora.length === 0}
            className="gradient-primary text-white border-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="w-full text-xs"
          >
            New Chat
          </Button>
        )}
      </div>
    </div>
  );
}
