import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { summarizeConversation } from '@/lib/gemini';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        summary: 'No messages in conversation yet.',
      });
    }

    const summary = await summarizeConversation(messages);

    return NextResponse.json({
      summary,
      messageCount: messages.length,
      status: conversation.status,
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
