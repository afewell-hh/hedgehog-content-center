import pandas as pd
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
import os
from datetime import datetime
from dotenv import load_dotenv
import re
import argparse

# Load environment variables
load_dotenv()

# Define the prompt template
TRANSFORM_PROMPT = """You are an expert technical educator creating glossary entries for Hedgehog's (githedgehog.com) knowledge base. Your goal is to make complex cloud infrastructure concepts clear and engaging while maintaining technical credibility.

AUDIENCE:
- Technical professionals in the IT industry
- May include both engineers and non-engineering roles (managers, architects, etc.)
- Familiar with common technical terms (e.g., GPU, API, cloud) but may not know specialized terminology
- Values substance and accuracy over marketing language

STYLE REQUIREMENTS:
- Length: Each paragraph should be 2-3 sentences, focused and impactful.
- Tone: Professional, educational, and subtly authoritative.
- Technical Level: 
  * Use common technical terms freely (e.g., GPU, API, container)
  * Avoid specialized jargon unless absolutely necessary
  * If mentioning advanced technologies, describe their benefits rather than naming them
- Impact: Help readers understand the technology's significance without overselling it

STRUCTURAL REQUIREMENTS:
1. First Paragraph (Definition):
   - Provide a vendor-neutral, technically accurate definition
   - Focus on helping readers understand the concept's role and importance
   - Target: ~50 words

2. Second Paragraph (Hedgehog Context):
   - Must be based on factual information from the provided Hedgehog context
   - Focus on substantive technical relationships between Hedgehog and the topic
   - If the relationship is tangential, be honest and concise rather than exaggerating
   - Highlight innovation through specific technical details, not marketing language
   - Target: ~50 words

3. Optional footnotes for technical details (if needed)

CONTENT GUIDELINES:
- Maintain the integrity of a knowledge base entry - this is not marketing content
- Make Hedgehog look good through substance and technical credibility
- When describing Hedgehog's capabilities:
  * Use specific, verifiable technical details from the context provided
  * Focus on how the technology is actually used or implemented
  * Avoid generic marketing phrases like "comprehensive set of tools" or "unlock the full potential"

SEO OPTIMIZATION:
- Include 2-3 high-value technical keywords naturally
- Use search phrases that technical professionals would use when researching this specific technology
- Consider technical problems or implementation challenges that would lead someone to search for this term

EXAMPLE OF IDEAL STYLE AND SUBSTANCE:
Term: VXLAN

VXLAN (Virtual Extensible LAN) represents the evolution of network virtualization, enabling organizations to create sophisticated logical Layer 2 networks that span across Layer 3 infrastructure. This powerful technology breaks through traditional networking limitations, allowing isolated network segments to extend seamlessly across dispersed locations.

Hedgehog implements VXLAN technology to provide isolated network environments for cloud workloads, with specific optimizations for AI and machine learning use cases. This implementation enables high-throughput, low-latency communication between distributed compute resources while maintaining strict workload isolation.

Context about Hedgehog's implementation: {hedgehog_context}

Now, create a fresh entry following these guidelines:
Term: {title}
Reference Content (Use as background knowledge only):
Current Body: {current_body}
Current Subtitle: {current_subtitle}

Context about Hedgehog: {hedgehog_context}

Previous Attempt Feedback: {verification_feedback}

Important: 
- Focus on technical substance over marketing language
- Use only verifiable information about Hedgehog from the provided context
- Provide only the two paragraphs in your response, no titles or formatting
- Each paragraph should be complete but concise
- If feedback was provided, carefully address those specific issues

Format your response exactly like this:
<entry_start>
[First paragraph text only, no title or formatting]

[Second paragraph text only, no title or formatting]

<footnotes>
[Optional: Additional technical details or explanations]
</footnotes>
<entry_end>"""

WRITER_PROMPT = """You are a technical writer creating glossary entries for Hedgehog's (githedgehog.com) knowledge base. Your goal is to explain complex concepts clearly while maintaining technical accuracy.

STYLE REQUIREMENTS:
- Length: Each paragraph should be 2-3 sentences, focused and impactful.
- Tone: Professional, educational, and subtly authoritative.
- Technical Level: 
  * Use common technical terms freely (e.g., GPU, API, container)
  * Avoid specialized jargon unless absolutely necessary
  * If mentioning advanced technologies, describe their benefits rather than naming them
- Impact: Help readers understand the technology's significance without overselling it

STRUCTURAL REQUIREMENTS:
1. First Paragraph (Definition):
   - Provide a vendor-neutral, technically accurate definition
   - Focus on helping readers understand the concept's role and importance
   - Target: ~50 words

2. Second Paragraph (Hedgehog Context):
   - Must be based on factual information from the provided Hedgehog context
   - Focus on substantive technical relationships between Hedgehog and the topic
   - If the relationship is tangential, be honest and concise rather than exaggerating
   - Target: ~50 words

Previous Editor Feedback: {editor_feedback}

Create your entry now:
Term: {title}
Reference Content:
{current_body}
{current_subtitle}

Hedgehog Context: {hedgehog_context}

Format your response exactly like this:
<entry_start>
[First paragraph text only]

[Second paragraph text only]

<footnotes>
[Optional: Additional technical details]
</footnotes>
<entry_end>"""

EDITOR_PROMPT = """You are a senior technical editor reviewing glossary entries for Hedgehog's knowledge base. Your role is to ensure:

1. Technical Accuracy:
   - Verify all claims against provided context
   - Check for misuse of technical terms
   - Ensure appropriate technical depth

2. Content Quality:
   - Clear, educational tone
   - No marketing language
   - Appropriate for target audience
   - Proper two-paragraph structure

3. Hedgehog-specific Content:
   - Verify all Hedgehog-related claims against context
   - Ensure balanced, factual representation
   - Flag any unsubstantiated claims

Entry to review:
{entry}

Hedgehog Context:
{hedgehog_context}

Term: {title}

Provide your review in this format:
<review>
APPROVE/REVISE
[If REVISE, provide specific feedback and suggestions]
</review>
"""

class WriterAgent:
    def __init__(self, llm):
        self.llm = llm
        self.prompt = PromptTemplate(
            input_variables=["title", "current_body", "current_subtitle", "hedgehog_context", "editor_feedback"],
            template=WRITER_PROMPT  # We'll define this
        )
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

class EditorAgent:
    def __init__(self, llm):
        self.llm = llm
        self.prompt = PromptTemplate(
            input_variables=["entry", "hedgehog_context", "title"],
            template=EDITOR_PROMPT
        )
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

    def _parse_editor_response(self, response: str) -> tuple[bool, str]:
        """Parse editor's review response"""
        if '<review>' in response and '</review>' in response:
            review = response.split('<review>')[1].split('</review>')[0].strip()
            lines = review.split('\n')
            decision = lines[0].strip()
            feedback = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ""
            return (decision == "APPROVE", feedback)
        return (False, "Invalid review format")

    def review(self, entry: str, context: str, title: str) -> tuple[bool, str]:
        """Review entry and provide detailed feedback"""
        response = self.chain.run(
            entry=entry,
            hedgehog_context=context,
            title=title
        )
        return self._parse_editor_response(response)

class KnowledgeBaseProcessor:
    def __init__(self, input_file: str, provider: str = 'openai'):
        self.input_file = input_file
        self.search = DuckDuckGoSearchAPIWrapper()
        self.df = pd.read_csv(input_file)
        
        # Initialize LLM based on provider
        self.llm = self._initialize_llm(provider)
        self.prompt = PromptTemplate(
            input_variables=["title", "current_body", "current_subtitle", "hedgehog_context", "verification_feedback"],
            template=TRANSFORM_PROMPT
        )
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
        
        # Add metadata columns
        self.df['processing_status'] = ''
        self.df['validation_issues'] = ''
        self.df['processing_timestamp'] = ''
        self.df['relevant_snippets'] = ''
        self.df['reference_urls'] = ''
        
        self.writer = WriterAgent(self.llm)
        self.editor = EditorAgent(self.llm)
    
    def _initialize_llm(self, provider: str):
        """Initialize the appropriate LLM based on provider"""
        if provider == 'openai':
            return ChatOpenAI(
                temperature=0.3,
                model="gpt-4o"
            )
        elif provider == 'anthropic':
            return ChatAnthropic(
                temperature=0.3,
                model="claude-3.5-haiku"
            )
        elif provider == 'google':
            return ChatGoogleGenerativeAI(
                temperature=0.3,
                model="gemini-pro"
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def extract_search_results(self, term: str) -> tuple[str, list[str]]:
        """Search and extract relevant snippets and URLs with verification"""
        try:
            # Search both docs and blog
            docs_results = self.search.run(f"site:docs.githedgehog.com {term}")
            blog_results = self.search.run(f"site:githedgehog.com/blog {term}")
            
            # Combine and process results
            all_results = f"{docs_results}\n{blog_results}"
            
            # Extract and verify relevant content
            sentences = re.split(r'[.!?]+\s+', all_results)
            relevant_snippets = []
            
            for sentence in sentences:
                sentence = sentence.strip()
                # Only include if it contains term OR hedgehog AND appears substantive
                if ((term.lower() in sentence.lower() or 'hedgehog' in sentence.lower()) and
                    len(sentence.split()) > 5):  # Basic check for substantive content
                    relevant_snippets.append(sentence)
            
            # Extract URLs, prioritizing docs
            doc_urls = re.findall(r'https?://(?:www\.)?docs\.githedgehog\.com[^\s]+', all_results)
            blog_urls = re.findall(r'https?://(?:www\.)?githedgehog\.com/blog[^\s]+', all_results)
            
            verified_snippets = " | ".join(relevant_snippets) if relevant_snippets else "No specific implementation details found."
            verified_urls = doc_urls + blog_urls
            
            return (verified_snippets, verified_urls)
        except Exception as e:
            return (f"Error fetching context: {str(e)}", [])

    def validate_entry(self, body: str) -> list:
        """Validate the transformed entry"""
        issues = []
        
        # Check for two paragraphs
        paragraphs = body.split('\n\n')
        if len(paragraphs) != 2:
            issues.append("Entry should have exactly 2 paragraphs")
            
        # Check for Hedgehog mention
        if 'hedgehog' not in body.lower():
            issues.append("Entry should mention Hedgehog")
            
        return issues

    def process_batch(self, start_idx: int, batch_size: int = 5):
        """Process a batch of entries with writer-editor collaboration"""
        end_idx = min(start_idx + batch_size, len(self.df))
        
        for idx in range(start_idx, end_idx):
            try:
                # Get current entry
                title = self.df.iloc[idx]['Article title']
                current_body = self.df.iloc[idx]['Article body']
                current_subtitle = self.df.iloc[idx]['Article subtitle']
                
                # Get Hedgehog context
                snippets, urls = self.extract_search_results(title)
                self.df.at[idx, 'relevant_snippets'] = snippets
                self.df.at[idx, 'reference_urls'] = '; '.join(urls)
                
                # Process with writer-editor collaboration
                final_content, issues = self.process_entry(
                    title=title,
                    current_body=current_body,
                    current_subtitle=current_subtitle,
                    context=snippets
                )
                
                if final_content:
                    # Extract main content and footnotes
                    parts = final_content.split('<footnotes>')
                    main_content = parts[0].strip()
                    footnotes = parts[1].strip() if len(parts) > 1 else ""
                    
                    # Update fields
                    self.df.at[idx, 'Article subtitle'] = main_content
                    self.df.at[idx, 'Article body'] = footnotes
                    self.df.at[idx, 'processing_status'] = 'processed'
                    self.df.at[idx, 'validation_issues'] = issues
                else:
                    self.df.at[idx, 'processing_status'] = 'failed'
                    self.df.at[idx, 'validation_issues'] = issues
                
                self.df.at[idx, 'processing_timestamp'] = datetime.now().isoformat()
                
            except Exception as e:
                self.df.at[idx, 'processing_status'] = 'error'
                self.df.at[idx, 'validation_issues'] = str(e)

    def save_results(self, output_file: str):
        """Save the processed results"""
        self.df.to_csv(output_file, index=False, quoting=1)  # QUOTE_ALL for consistent formatting

    def verify_response(self, response: str, context: str, title: str) -> tuple[bool, str, str]:
        """Verify response quality and accuracy"""
        verification_prompt = f"""Verify this glossary entry response for accuracy and quality:

Response to verify:
{response}

Context about Hedgehog:
{context}

Verify the following:
1. Does it follow the two-paragraph structure?
2. Is the first paragraph a clear, jargon-free definition?
3. Is the second paragraph's claims about Hedgehog supported by the context?
4. Are there any marketing-style claims without technical substance?
5. Is the technical level appropriate for the target audience?

If any issues are found, provide a specific correction. Otherwise, confirm it's good.

Format your response as:
<verification>
PASS/FAIL
[Issue description and correction if FAIL]
</verification>"""

        # Get verification result
        result = self.llm.predict(verification_prompt)
        
        # Parse result
        if '<verification>' in result and '</verification>' in result:
            result = result.split('<verification>')[1].split('</verification>')[0].strip()
            status = result.split('\n')[0].strip()
            issues = '\n'.join(result.split('\n')[1:]).strip() if len(result.split('\n')) > 1 else ""
            return (status == "PASS", status, issues)
        return (False, "ERROR", "Failed to verify response")

    def process_entry(self, title: str, current_body: str, current_subtitle: str, context: str) -> tuple[str, str]:
        """Process a single entry with writer-editor collaboration"""
        max_iterations = 3
        editor_feedback = ""

        for iteration in range(max_iterations):
            # Get writer's draft
            draft = self.writer.chain.run(
                title=title,
                current_body=current_body,
                current_subtitle=current_subtitle,
                hedgehog_context=context,
                editor_feedback=editor_feedback
            )

            # Get editor's review
            approved, feedback = self.editor.review(draft, context, title)
            
            if approved:
                return draft, ""
            
            editor_feedback = feedback
            if iteration == max_iterations - 1:
                return draft, f"Max iterations reached. Last feedback: {feedback}"

        return None, "Failed to produce acceptable entry"

def main():
    parser = argparse.ArgumentParser(description='Process knowledge base entries with different LLM providers')
    parser.add_argument('input_file', help='Input CSV file')
    parser.add_argument('output_file', help='Output CSV file')
    parser.add_argument('-p', '--provider', 
                       choices=['openai', 'anthropic', 'google'],
                       default='openai',
                       help='LLM provider to use (default: openai)')
    
    args = parser.parse_args()
    
    # Initialize processor with specified provider
    processor = KnowledgeBaseProcessor(args.input_file, args.provider)
    
    # Process test batch
    processor.process_batch(0, 3)
    
    # Save results
    processor.save_results(args.output_file)

if __name__ == "__main__":
    main() 