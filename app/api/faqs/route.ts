import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase.from('faqs').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: faqs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const categories = Array.from(new Set(faqs?.map((faq) => faq.category) || []));

    return NextResponse.json({
      faqs: faqs || [],
      categories,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
