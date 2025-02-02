// app/api/llm/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function searchGitHedgehog(query: string): Promise<string> {
  try {
    const response = await fetch(`https://duckduckgo.com/html/?q=site:githedgehog.com ${encodeURIComponent(query)}`);
    if (!response.ok) {
      console.error('Search request failed:', response.statusText);
      return '';
    }
    const html = await response.text();
    
    // Basic parsing of search results - you might want to enhance this
    const results = html.match(/<a class="result__url".*?>(.*?)<\/a>/g) || [];
    const snippets = html.match(/<a class="result__snippet".*?>(.*?)<\/a>/g) || [];
    
    return results.concat(snippets).slice(0, 3).join('\n');
  } catch (error) {
    console.error('Search error:', error);
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mode, question, answer, userInput, currentFaq, faqId } = await req.json();

    // Validate required fields
    if (mode === "generate") {
      if (!question || !answer) {
        return NextResponse.json(
          { error: "Question and answer are required for FAQ generation." },
          { status: 400 }
        );
      }
    } else if (mode === "dialogue") {
      if (!userInput || !currentFaq) {
        return NextResponse.json(
          { error: "User input and current FAQ are required for dialogue." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid mode specified." },
        { status: 400 }
      );
    }

    if (mode === "generate") {
      // Initial FAQ Generation
      const prompt = `
        You are a helpful assistant that generates user-friendly, public-facing FAQs from RFP (Request for Proposal) documents. Your goal is to create FAQ entries that are informative, concise, and suitable for a general audience interested in Hedgehog's products and services.

        **Important Considerations:**

        *   **Confidentiality:** RFP responses often contain sensitive information, including customer names and proprietary details. **Do not include any customer-specific information or proprietary details in the FAQ entries.** Focus on the general capabilities and features of the Hedgehog platform.
        
        *   **Target Audience:** The FAQs are intended for a public audience, including potential customers who may not be familiar with all technical jargon. Explain concepts clearly and avoid overly technical language when possible.
        
        *   **Technical Accuracy:** Your primary goal is to ensure technical accuracy in the FAQ answers:
            1. First, analyze the provided RFP Q&A content to understand the technical details
            2. If you need to propose a broader or more general answer than what's in the RFP Q&A, you MUST verify technical accuracy
            3. Use the search_githedgehog function ONLY when you need to verify technical details not fully covered in the RFP Q&A
            4. Do not use web search if the RFP Q&A content provides sufficient detail for an accurate answer
        
        *   **Format:** Rephrase the RFP requirement as a question and provide a clear, concise answer that would be appropriate for a public FAQ about a commercial ethernet networking solution.
        
        *   **Example:**
            *   **RFP Requirement:** "The solution shall support a Virtual Private Cloud (VPC) like construct where an application can define their own network IPv6 address range and subnet size."
            *   **FAQ Question:** "Does Hedgehog support a VPC (Virtual Private Cloud) construct where an application can define their own network IPv6 address range and subnet size?"
            *   **FAQ Answer:** "Hedgehog supports a VPC (Virtual Private Cloud) abstraction where an application can use our API to provision and manage their own IP address range and subnet size. The Hedgehog VPC API includes a VPCSpec argument where applications can specify a list of IP namespaces with IPv4 address ranges. The API will support IPv6 address ranges in a CY 2025 release. Please contact Hedgehog if you want to prioritize IPv6 for an upcoming release."

        **Task:**

        Generate a FAQ entry (question and answer) based on the following RFP question and answer. Remember to:
        1. Evaluate if this content should be generalized for a public FAQ
        2. Only use web search if you need to verify technical details not covered in the RFP Q&A
        3. Ensure the answer is accurate and appropriate for the target audience

        Question: ${question}
        Answer: ${answer}
      `;

      const functions = [
        {
          name: "search_githedgehog",
          description: "Search githedgehog.com for technical information. Only use this when you need to verify technical details not fully covered in the RFP Q&A content.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to find relevant technical information",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "return_faq",
          description: "Returns the generated FAQ entry.",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "The generated FAQ question.",
              },
              answer: {
                type: "string",
                description: "The generated FAQ answer.",
              },
            },
            required: ["question", "answer"],
          },
        },
      ];

      let messages = [
        { role: "system", content: prompt },
        { role: "user", content: "" },
      ];

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages,
          functions: functions,
          function_call: { name: "return_faq" }, // Force the model to use return_faq
          max_tokens: 250,
          temperature: 0.7,
        });

        const message = response.choices[0].message;

        // Handle potential web search request
        if (message.function_call?.name === "search_githedgehog") {
          const searchArgs = JSON.parse(message.function_call.arguments || "{}");
          const searchResults = await searchGitHedgehog(searchArgs.query);
          
          // Add search results to conversation and get final FAQ
          messages.push({
            role: "assistant",
            content: null,
            function_call: {
              name: "search_githedgehog",
              arguments: message.function_call.arguments,
            },
          });
          messages.push({
            role: "function",
            name: "search_githedgehog",
            content: searchResults,
          });

          const finalResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            functions: functions,
            function_call: { name: "return_faq" }, // Force the model to use return_faq
            max_tokens: 250,
            temperature: 0.7,
          });

          const faqArgs = finalResponse.choices[0].message.function_call?.arguments;
          if (!faqArgs) {
            throw new Error("Failed to get FAQ arguments from LLM response");
          }
          const parsedFaq = JSON.parse(faqArgs);
          return NextResponse.json({
            question: parsedFaq.question,
            answer: parsedFaq.answer,
          });
        } else if (message.function_call?.name === "return_faq") {
          if (!message.function_call.arguments) {
            throw new Error("Failed to get FAQ arguments from LLM response");
          }
          const parsedFaq = JSON.parse(message.function_call.arguments);
          return NextResponse.json({
            question: parsedFaq.question,
            answer: parsedFaq.answer,
          });
        } else {
          // If we get here, something went wrong with function calling
          throw new Error("Unexpected LLM response format: Model did not use the required function");
        }
      } catch (error) {
        console.error("OpenAI API error:", error);
        return NextResponse.json(
          { error: "Failed to generate FAQ: " + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (mode === "dialogue") {
      // Interactive Dialogue
      const functions = [
        {
          name: "search_githedgehog",
          description: "Search githedgehog.com for technical information. Only use this when you need to verify technical details that come up during the dialogue.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to find relevant technical information",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "update_faq",
          description: "Updates the FAQ entry with new values",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "The updated FAQ question",
              },
              answer: {
                type: "string",
                description: "The updated FAQ answer",
              },
            },
            required: ["question", "answer"],
          },
        },
      ];

      // Fetch current FAQ data if faqId is provided
      let currentFaq = null;
      if (faqId) {
        const faqResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/faq/${faqId}`);
        if (faqResponse.ok) {
          currentFaq = await faqResponse.json();
        }
      }

      const systemPrompt = `You are a helpful assistant that is having a conversation with a user to refine a FAQ. 
        The current FAQ is: 
        Question: ${currentFaq?.question || ''}
        Answer: ${currentFaq?.answer || ''}
        
        **Important Guidelines:**
        1. Your primary goal is to help refine the FAQ while ensuring technical accuracy
        2. If the user's requests or questions require verification of technical details:
           - First, rely on your existing knowledge and the FAQ content
           - Use the search_githedgehog function ONLY when you need to verify new technical details
        3. When the user requests changes to the FAQ:
           - If they want to modify the question or answer, you MUST use the update_faq function to make the changes
           - The update_faq function will directly update the form fields in the UI
           - Always include both the question and answer in the update_faq function call, even if only one field is being modified
           - After using update_faq, inform the user that you've made the changes and they should review them
        4. If you're not making changes to the FAQ content, respond with a regular message
        5. Always maintain a helpful and professional tone while ensuring technical accuracy`;

      let messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userInput,
        },
      ];

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages,
          functions: functions,
          function_call: "auto",
          max_tokens: 250,
          temperature: 0.7,
        });

        const message = response.choices[0].message;

        // Handle potential web search request
        if (message.function_call?.name === "search_githedgehog") {
          const searchArgs = JSON.parse(message.function_call.arguments || "{}");
          const searchResults = await searchGitHedgehog(searchArgs.query);
          
          // Add search results to conversation and get final response
          messages.push({
            role: "assistant",
            content: null,
            function_call: {
              name: "search_githedgehog",
              arguments: message.function_call.arguments,
            },
          });
          messages.push({
            role: "function",
            name: "search_githedgehog",
            content: searchResults,
          });

          const finalResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            functions: functions,
            function_call: "auto",
            max_tokens: 250,
            temperature: 0.7,
          });

          const finalMessage = finalResponse.choices[0].message;
          
          if (finalMessage.function_call?.name === "update_faq") {
            const functionArgs = JSON.parse(finalMessage.function_call.arguments || "{}");
            console.log("LLM API: Returning update_faq response:", {
              question: functionArgs.question,
              answer: functionArgs.answer,
              functionCall: "update_faq"
            });

            // Update the FAQ in the database
            if (faqId) {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/faq/${faqId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  question: functionArgs.question,
                  answer: functionArgs.answer,
                }),
              });
            }

            return NextResponse.json({
              question: functionArgs.question,
              answer: functionArgs.answer,
              functionCall: "update_faq",
            });
          } else {
            console.log("LLM API: Returning message response:", {
              message: finalMessage.content
            });
            return NextResponse.json({
              message: finalMessage.content,
            });
          }
        } else if (message.function_call?.name === "update_faq") {
          const functionArgs = JSON.parse(message.function_call.arguments || "{}");
          console.log("LLM API: Returning update_faq response:", {
            question: functionArgs.question,
            answer: functionArgs.answer,
            functionCall: "update_faq"
          });

          // Update the FAQ in the database
          if (faqId) {
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/faq/${faqId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: functionArgs.question,
                answer: functionArgs.answer,
              }),
            });
          }

          return NextResponse.json({
            question: functionArgs.question,
            answer: functionArgs.answer,
            functionCall: "update_faq",
          });
        } else {
          console.log("LLM API: Returning message response:", {
            message: message.content
          });
          return NextResponse.json({
            message: message.content,
          });
        }
      } catch (error) {
        console.error("OpenAI API error:", error);
        return NextResponse.json(
          { error: "Failed to process dialogue: " + (error as Error).message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid mode specified." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in LLM API:", error);
    return NextResponse.json(
      { error: "Failed to process request: " + (error as Error).message },
      { status: 500 }
    );
  }
}