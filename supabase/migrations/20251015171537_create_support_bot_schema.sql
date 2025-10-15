/*
  # AI Customer Support Bot Schema

  1. New Tables
    - `faqs`
      - `id` (uuid, primary key)
      - `question` (text) - FAQ question
      - `answer` (text) - FAQ answer
      - `category` (text) - Category for grouping FAQs
      - `keywords` (text array) - Keywords for matching
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `conversations`
      - `id` (uuid, primary key)
      - `session_id` (text, unique) - Unique session identifier
      - `status` (text) - active, escalated, closed
      - `escalated_at` (timestamptz) - When escalation occurred
      - `escalation_reason` (text) - Reason for escalation
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `role` (text) - user or assistant
      - `content` (text) - Message content
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for FAQs
    - Session-based access for conversations and messages
*/

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'closed')),
  escalated_at timestamptz,
  escalation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQs are publicly readable"
  ON faqs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert conversations"
  ON conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON conversations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

INSERT INTO faqs (question, answer, category, keywords) VALUES
  ('What are your business hours?', 'We are open Monday to Friday, 9 AM to 6 PM EST. Our support team is available during these hours to assist you.', 'general', ARRAY['hours', 'time', 'open', 'available']),
  ('How do I reset my password?', 'To reset your password, click on "Forgot Password" on the login page. Enter your email address, and we will send you a password reset link.', 'account', ARRAY['password', 'reset', 'forgot', 'login']),
  ('What payment methods do you accept?', 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.', 'billing', ARRAY['payment', 'credit card', 'paypal', 'billing']),
  ('How can I track my order?', 'Once your order is shipped, you will receive an email with a tracking number. You can use this number on our website or the carrier''s website to track your package.', 'orders', ARRAY['track', 'order', 'shipping', 'delivery']),
  ('What is your return policy?', 'We offer a 30-day return policy for most items. Products must be in original condition with tags attached. Contact support to initiate a return.', 'returns', ARRAY['return', 'refund', 'exchange', 'policy']),
  ('How do I contact customer support?', 'You can reach our support team via this chat, email at support@company.com, or call us at 1-800-123-4567 during business hours.', 'general', ARRAY['contact', 'support', 'help', 'email', 'phone']),
  ('Do you offer international shipping?', 'Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times vary by location. Check our shipping page for details.', 'shipping', ARRAY['international', 'shipping', 'worldwide', 'global']),
  ('How do I cancel my subscription?', 'To cancel your subscription, go to Account Settings > Subscriptions and click "Cancel Subscription". Your access will continue until the end of the billing period.', 'account', ARRAY['cancel', 'subscription', 'unsubscribe', 'billing'])
ON CONFLICT DO NOTHING;
