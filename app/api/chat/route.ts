import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateResponse, suggestNextActions } from '@/lib/gemini';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    let conversation = await getOrCreateConversation(sessionId);

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    const { data: faqs } = await supabase
      .from('faqs')
      .select('*');

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
    });

    const { response, shouldEscalate, escalationReason } = await generateResponse(
      message,
      messages || [],
      faqs || []
    );

    if (shouldEscalate && conversation.status === 'active') {
      await supabase
        .from('conversations')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalation_reason: escalationReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      conversation.status = 'escalated';
    }

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: response,
      metadata: { escalated: shouldEscalate },
    });

    const updatedMessages = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    const suggestions = await suggestNextActions(updatedMessages.data || []);

    return NextResponse.json({
      response,
      escalated: shouldEscalate,
      escalationReason,
      suggestions,
      conversationStatus: conversation.status,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOrCreateConversation(sessionId: string) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data: newConversation } = await supabase
    .from('conversations')
    .insert({ session_id: sessionId })
    .select()
    .single();

  return newConversation;
}
