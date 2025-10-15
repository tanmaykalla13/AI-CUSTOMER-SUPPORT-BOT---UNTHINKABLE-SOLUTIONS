'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { FAQList } from '@/components/faq-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, HelpCircle, BarChart3 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let storedSessionId = localStorage.getItem('support_session_id');
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem('support_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const startNewSession = () => {
    const newSessionId = uuidv4();
    localStorage.setItem('support_session_id', newSessionId);
    setSessionId(newSessionId);
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI Customer Support
              </h1>
              <p className="text-gray-600">
                Get instant help with your questions, powered by advanced AI
              </p>
            </div>
            <Button onClick={startNewSession} variant="outline">
              Start New Conversation
            </Button>
          </div>
        </header>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Support
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="h-[600px]">
              <ChatInterface sessionId={sessionId} />
            </div>
          </TabsContent>

          <TabsContent value="faqs" className="space-y-4">
            <FAQList />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by Gemini AI | Session ID: {sessionId.slice(0, 8)}...
          </p>
        </footer>
      </div>
    </div>
  );
}
