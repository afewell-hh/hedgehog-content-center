// app/api/llm/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { mode, question, answer, userInput, currentFaq } = await req.json();

    if (mode === "generate") {
      // Initial FAQ Generation
      const prompt = `
        You are a helpful assistant that generates user-friendly, public-facing FAQs from RFP (Request for Proposal) documents. Your goal is to create FAQ entries that are informative, concise, and suitable for a general audience interested in Hedgehog's products and services.

        **Important Considerations:**

        *   **Confidentiality:** RFP responses often contain sensitive information, including customer names and proprietary details. **Do not include any customer-specific information or proprietary details in the FAQ entries.** Focus on the general capabilities and features of the Hedgehog platform.
        *   **Target Audience:** The FAQs are intended for a public audience, including potential customers who may not be familiar with all technical jargon. Explain concepts clearly and avoid overly technical language when possible.
        *   **Format:** Rephrase the RFP requirement as a question and provide a clear, concise answer. You can reference product documentation if appropriate.
        *   **Example:**
            *   **RFP Requirement (T-Mobile RFP Overlay General Function OGF 1.2):** "The solution shall support a Virtual Private Cloud (VPC) like construct where an application can define their own network IPv6 address range and subnet size."
            *   **FAQ Question:** "Does Hedgehog support a VPC (Virtual Private Cloud) construct where an application can define their own network IPv6 address range and subnet size?"
            *   **FAQ Answer:** "Hedgehog supports a VPC (Virtual Private Cloud) abstraction where an application can use our API to provision and manage their own IP address range and subnet size. The Hedgehog VPC API includes a VPCSpec argument where applications can specify a list of IP namespaces with IPv4 address ranges. The API will support IPv6 address ranges in a CY 2025 release. Please contact Hedgehog if you want to prioritize IPv6 for an upcoming release."

        **Task:**

        Generate a FAQ entry (question and answer) based on the following RFP question and answer:

        Question: ${question}
        Answer: ${answer}
      `;

      const functions = [
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

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "" },
        ],
        functions: functions,
        function_call: { name: "return_faq" },
        max_tokens: 250,
        temperature: 0.7,
      });

      const faqArgs = response.choices[0].message.function_call?.arguments;

      if (faqArgs) {
        const parsedFaq = JSON.parse(faqArgs);
        const newQuestion = parsedFaq.question;
        const newAnswer = parsedFaq.answer;

        return NextResponse.json({ question: newQuestion, answer: newAnswer });
      } else {
        console.error("Failed to get function call arguments.");
        return NextResponse.json(
          { error: "Failed to generate FAQ." },
          { status: 500 }
        );
      }
    } else if (mode === "dialogue") {
      // Interactive Dialogue
      const functions = [
        {
          name: "update_faq",
          description: "Updates the proposed FAQ entry with new values",
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

      const messages = [
        {
          role: "system",
          content: `You are a helpful assistant that is having a conversation with a user to refine a FAQ. 
            The current proposed FAQ is: 
            Question: ${currentFaq.question}
            Answer: ${currentFaq.answer}
            
            When the user is satisfied with the FAQ, use the update_faq function to return the updated FAQ.`,
        },
        {
          role: "user",
          content: userInput,
        },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        functions: functions,
        function_call: "auto",
        max_tokens: 250,
        temperature: 0.7,
      });

      const message = response.choices[0].message;

      if (message.function_call) {
        const functionName = message.function_call.name;
        if (functionName === "update_faq") {
          const functionArgs = JSON.parse(message.function_call.arguments || "{}");
          return NextResponse.json({
            question: functionArgs.question,
            answer: functionArgs.answer,
            functionCall: "update_faq",
          });
        } else {
          console.error("Function call was made but the function does not exist");
          return NextResponse.json(
            { error: "Failed to process request." },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json({
          message: message.content
        });
      }
    } else {
      return NextResponse.json(
        { error: "Invalid mode specified." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error calling LLM API:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}