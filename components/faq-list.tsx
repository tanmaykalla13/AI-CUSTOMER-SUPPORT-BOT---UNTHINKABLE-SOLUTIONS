'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { FAQ } from '@/lib/supabase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export function FAQList() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, [selectedCategory]);

  const loadFAQs = async () => {
    try {
      const url = selectedCategory
        ? `/api/faqs?category=${selectedCategory}`
        : '/api/faqs';
      const response = await fetch(url);
      const data = await response.json();
      setFaqs(data.faqs);
      setCategories(data.categories);
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left">
              <div className="flex items-start gap-2 flex-1">
                <span className="flex-1">{faq.question}</span>
                <Badge variant="secondary" className="ml-2">
                  {faq.category}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-gray-700 leading-relaxed">{faq.answer}</div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
