# AI Customer Support Bot – Unthinkable Solutions

**AI Customer Support Bot** is a demo web application built for *Unthinkable Solutions*. It simulates a support chatbot: users send queries, the bot answers from FAQs + uses Gemini as LLM if needed, remembers context per session, and escalates when it can’t answer. Built as a fast prototype using Supabase for backend, and React + Tailwind for UI.

---

## 🚀 Features

- Chat interface with message history, user/bot bubbles, and typing animations  
- Session-based memory: stores recent conversation context  
- FAQ first layer: bot tries to answer from FAQ data  
- Gemini LLM fallback: when FAQs don’t suffice, the app queries Gemini (using a placeholder API key)  
- Escalation simulation: if query cannot be answered, logs escalate event  
- Supabase backend (tables for sessions, messages, FAQs, escalations)  
- REST API endpoints: `/api/query`, `/api/faqs`, `/api/escalate`  
- README + setup guide included

---

## 📁 Repository Structure

```text
AI-CUSTOMER-SUPPORT-BOT---UNTHINKABLE-SOLUTIONS
├── app/
│   ├── components/         # React components (ChatWindow, MessageBubble, FAQ panel etc.)
│   ├── hooks/              # React hooks (e.g. useChatSession)
│   └── pages/              # Next.js pages or main chat UI
├── supabase/               # Supabase migrations, schema setup
├── .eslintrc.json          # ESLint config
├── next.config.js          # Next.js configuration
├── package.json            # npm / yarn dependencies & scripts
├── tailwind.config.ts      # Tailwind CSS configuration
└── README.md               # This file
