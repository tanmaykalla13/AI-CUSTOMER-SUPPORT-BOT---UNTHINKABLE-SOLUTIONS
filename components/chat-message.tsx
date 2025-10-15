'use client';

import { Message } from '@/lib/supabase';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-colors',
        isUser ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8',
        isSystem && 'bg-amber-50 mx-8'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-600' : 'bg-gray-700'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="font-medium text-sm text-gray-900">
          {isUser ? 'You' : isSystem ? 'System' : 'Support Assistant'}
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
