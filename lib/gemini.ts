import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, FAQ, Message } from "./supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateResponse(
  userMessage: string,
  conversationHistory: Message[],
  faqs: FAQ[]
): Promise<{ response: string; shouldEscalate: boolean; escalationReason?: string }> {
  // Use the Gemini 2.5 Flash model
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const faqContext = faqs
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}\nCategory: ${faq.category}`)
    .join("\n\n");

  const conversationContext = conversationHistory
    .slice(-10)
    .map((msg) => `${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const systemPrompt = `
You are a helpful customer support assistant. Your goal is to assist customers with their queries using the FAQ knowledge base provided.

IMPORTANT RULES:
1. Always be polite, professional, and empathetic.
2. Use the FAQ database to answer questions when relevant.
3. If you cannot confidently answer a question based on the FAQs or context, acknowledge this honestly.
4. For complex issues, billing problems, account issues, or when you're uncertain, indicate that the query should be escalated to a human agent.
5. Keep responses concise but informative.
6. Maintain context from previous messages in the conversation.

FAQ Knowledge Base:
${faqContext}

Previous Conversation:
${conversationContext}

Current Customer Query: ${userMessage}

If you need to escalate this query, start your response with "[ESCALATE]" followed by the reason, then provide a polite response to the customer.
Otherwise, provide a helpful response based on the available information.
`;

  try {
    // ✅ Correct method call for new Gemini SDK
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    // ✅ Proper way to extract text in Gemini 2.5
    const responseText = result.response?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      ?.join("")?.trim() || "";

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    if (responseText.startsWith("[ESCALATE]")) {
      const parts = responseText.split("[ESCALATE]")[1].split("\n");
      const escalationReason = parts[0].trim();
      const customerResponse = parts.slice(1).join("\n").trim();

      return {
        response:
          customerResponse ||
          "I understand this is an important matter. Let me connect you with a human support agent who can better assist you with this specific issue.",
        shouldEscalate: true,
        escalationReason,
      };
    }

    const confidenceCheck = await checkResponseConfidence(userMessage, responseText, faqs);

    if (!confidenceCheck.isConfident) {
      return {
        response:
          "I want to make sure you get accurate information. Let me connect you with a human support agent who can better assist you with this specific query.",
        shouldEscalate: true,
        escalationReason: confidenceCheck.reason,
      };
    }

    return {
      response: responseText,
      shouldEscalate: false,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      response:
        "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human agent who can help you immediately.",
      shouldEscalate: true,
      escalationReason: "Technical error in AI processing",
    };
  }
}

async function checkResponseConfidence(
  query: string,
  response: string,
  faqs: FAQ[]
): Promise<{ isConfident: boolean; reason: string }> {
  const queryLower = query.toLowerCase();
  const sensitiveKeywords = [
    "billing",
    "charge",
    "payment",
    "refund",
    "money",
    "account",
    "password",
    "security",
    "hack",
    "breach",
    "legal",
    "lawyer",
    "lawsuit",
    "complaint",
    "urgent",
    "emergency",
    "critical",
  ];

  const hasSensitiveKeyword = sensitiveKeywords.some((keyword) =>
    queryLower.includes(keyword)
  );

  if (hasSensitiveKeyword && response.length < 100) {
    return {
      isConfident: false,
      reason: "Sensitive topic requiring human expertise",
    };
  }

  const hasRelevantFAQ = faqs.some((faq) => {
    const questionSimilarity = calculateSimilarity(queryLower, faq.question.toLowerCase());
    const keywordMatch = faq.keywords?.some((keyword) =>
      queryLower.includes(keyword.toLowerCase())
    );
    return questionSimilarity > 0.5 || keywordMatch;
  });

  if (!hasRelevantFAQ && hasSensitiveKeyword) {
    return {
      isConfident: false,
      reason: "No relevant FAQ found for sensitive query",
    };
  }

  return { isConfident: true, reason: "" };
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter((word) => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

export async function summarizeConversation(messages: Message[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const conversation = messages
    .map((msg) => `${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const prompt = `Summarize the following customer support conversation in 2-3 sentences, highlighting the main issue and resolution status:\n\n${conversation}\n\nSummary:`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return (
      result.response?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        ?.join("")
        ?.trim() || "Unable to generate summary"
    );
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    return "Unable to generate summary";
  }
}

export async function suggestNextActions(messages: Message[]): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const conversation = messages
    .slice(-5)
    .map((msg) => `${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const prompt = `Based on this customer support conversation, suggest 3 relevant follow-up questions or topics the customer might ask about:\n\n${conversation}\n\nProvide exactly 3 short suggestions (max 10 words each), one per line:`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawText =
      result.response?.candidates?.[0]?.content?.parts?.map((p) => p.text)?.join("") || "";

    return rawText
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "").trim());
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}
