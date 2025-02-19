<paused>need to expose the article url field on the kb new/edit pages. I asked the agent before to have the llm generate the url and I gave it instructions, I think it may have implemented at least partially but I dont know for sure, I should check the database directly to determine if its working and just not exposed on the form. 

The interactive chat feature on the kb edit page is currently returning body field responses using different formatting and html tags than when you use quick update, and its only returning the responses in the interactive prompt window and not updating the fields directly. Need to fix this and afterward, update the quick update on the kb new/edit page to match the interactive chat response format.


need to migrate faq pages and logic to conform to the new kb structure

need to create a separate table for the original final immutable rfp_qa entries to keep record of the exact final responses that were approved and sent in the final rfp response. And then have a separate for mutable versions that can be updated to remain current, so as to be more useful in assisting with future rfp responses and also any other places we can use these for, such as deriving faq's or providing a knowledge source for llm's.