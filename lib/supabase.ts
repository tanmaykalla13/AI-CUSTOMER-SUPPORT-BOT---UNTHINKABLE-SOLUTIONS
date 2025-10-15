import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  session_id: string;
  status: 'active' | 'escalated' | 'closed';
  escalated_at?: string;
  escalation_reason?: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
};
