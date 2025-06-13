import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface StructureScreen {
    name: string;
    description: string;
}

export interface StructureResponse {
    title: string;
    description: string;
    designType: string;
    colorPalette: string;
    brandIdentity: string;
    summary: string;
    screens: StructureScreen[];
}

const systemPrompt = `
You are a senior UX researcher and product strategist. 
Your task is to analyze the following transcript of a design conversation and generate a structured JSON summary of the project. 
This transcript is from a real-time meeting between a designer and a client.
Do not generate any HTML or CSS in this step.
Only generate the JSON structure, do not include any other text and only 1 project per call.
`;

const userPrompt = `
## Transcript Format

Each line follows this format:
[00:00:00] Speaker Name: Sentence spoken

Your goal is to extract the essential information from the conversation and organize it in the following JSON schema:

\`\`\`json
{
  "title": "Short project title based on what the client is building",
  "description": "Brief explanation of the client's idea, needs, and key functionality",
  "designType": "Type of interface or product (e.g. website, mobile app, e-commerce dashboard)",
  "colorPalette": "List of mentioned or inferred colors (or moods that map to colors)",
  "brandIdentity": "Adjectives and tone implied by the brand, e.g., playful, minimalist, modern",
  "summary": 
    "A markdown-formatted summary of the project and conversation, useful for documentation. Can be multiple paragraphs. Include bullet points when appropriate, and use emojis when appropriate, make it as detailed as possible including the designType, colorPalette, brandIdentity, and the screens.",
  "screens": [
    {
      "name": "Screen Name or Title (e.g. Home, Pricing Page, Login)",
      "description": "What the screen should contain or accomplish, this is going to be used by an LLM to generate the HTML and CSS for the screen so be as detailed as possible."
    }
  ]
}
\`\`\`

---

## Guidelines:

- Focus on intent: what the client wants, needs, or expects to see.
- Don't just summarize what was said—*interpret* design goals.
- Group similar ideas. Infer missing details when logical (e.g., if they mention 'signup form' assume a basic input layout).
- If they don't mention a screen name explicitly, you can propose names based on context.
- If no color is mentioned, infer based on brand tone (e.g., "calm" = soft blues, "bold" = strong primaries).
- The markdown summary must be clean, readable, and useful to share with team members.
- Prioritize creating a single page website, if there are things that can be used as modals in the same page, do it instead of creating a new page for that.
- We are delivering a maximum of 3 screens. If the client mentions more than 3 screens, you can infer the most important ones.

---

## Example Input (Transcript):
[00:00:01] Client1: I need a site for my new AI podcast.
[00:00:05] Designer: What should it have?
[00:00:07] Client2: Just a homepage with the latest episode, maybe a section for transcripts, and a way to subscribe.
[00:00:12] Designer: What kind of vibe are you going for?
[00:00:14] Client1: Something very modern, techy. Black and white mostly.

## Expected Output:
\`\`\`json
{
  "title": "AI Podcast Website",
  "description": "A simple website to showcase a podcast, with support for episodes, transcripts, and email subscriptions.",
  "designType": "Website",
  "colorPalette": ["black", "white"],
  "brandIdentity": "modern, techy, clean",
  "summary": "## Project Summary 🎙️\n\n### Overview\nA modern, tech-focused website for an AI podcast that aims to make content accessible and engaging. The design emphasizes clean aesthetics with a monochromatic color scheme.\n\n### Key Features ✨\n* 🎧 Latest episode showcase with embedded audio player\n* 📝 Searchable transcript library for accessibility\n* 📧 Email subscription system for updates\n\n### Design Elements 🎨\n* **Type**: Single-page website with smooth transitions\n* **Colors**: Black and white with subtle gradients\n* **Tone**: Modern, tech-forward, and professional\n\n### User Flow 🔄\n1. Visitors land on homepage with featured episode\n2. Can browse/search transcripts\n3. Subscribe via email for updates\n\n### Technical Considerations 💻\n* Responsive design for all devices\n* Fast loading audio player\n* SEO-optimized transcript pages",
  "generalCss": ":root { --font-family: 'Inter', sans-serif; --background-color: #fff; --text-color: #000; }",
  "screens": [
    {
      "name": "Homepage",
      "description": "Highlights latest episode with audio player, description, and call to action"
    },
    {
      "name": "Transcripts",
      "description": "List of episode transcripts with search functionality"
    },
    {
      "name": "Subscribe",
      "description": "Simple email signup form with confirmation message"
    }
  ]
}
\`\`\`

---

## TRANSCRIPT TO ANALYZE:
`;

export async function POST(req: NextRequest) {
    const body = await req.json();
    const transcript = body.transcript;

    if (!transcript || typeof transcript !== 'string') {
        return new Response('Missing or invalid transcript', { status: 400 });
    }


    console.log("generating structure");
    const { text } = await generateText({
        model: openai.chat('gpt-4o'),
        system: systemPrompt,
        prompt: userPrompt + transcript,
        temperature: 0.4,
        maxTokens: 2048,
    });

    console.log("structure generated");

    return NextResponse.json(text);
}

export async function GET() {
    const structureData = "```json\n{\n  \"title\": \"Sustainable Fashion E-commerce Platform\",\n  \"description\": \"An e-commerce platform dedicated to sustainable fashion, featuring a catalog with filtering options, user reviews, and a loyalty rewards system.\",\n  \"designType\": \"E-commerce Website\",\n  \"colorPalette\": [\"green\", \"brown\"],\n  \"brandIdentity\": \"trustworthy, eco-conscious, professional\",\n  \"summary\": \"## Project Summary 🌿\\n\\n### Overview\\nA modern e-commerce platform focused on sustainable fashion, designed to offer a professional and eco-conscious shopping experience. The platform will utilize natural colors to reflect its commitment to sustainability.\\n\\n### Key Features ✨\\n* 📚 Product catalog with advanced filtering options to help users find sustainable fashion items easily.\\n* ⭐ User reviews to build trust and provide feedback on products.\\n* 🎁 Loyalty rewards system to encourage repeat purchases and customer loyalty.\\n\\n### Design Elements 🎨\\n* **Type**: Multi-page e-commerce website\\n* **Colors**: Natural greens and browns to emphasize sustainability\\n* **Tone**: Trustworthy, eco-conscious, and professional\\n\\n### User Flow 🔄\\n1. Users browse the product catalog with filtering options.\\n2. Read and leave reviews for products.\\n3. Engage with the loyalty rewards system for discounts and offers.\\n\\n### Technical Considerations 💻\\n* Responsive design for all devices\\n* Secure payment gateway integration\\n* SEO-optimized product pages\",\n  \"screens\": [\n    {\n      \"name\": \"Product Catalog\",\n      \"description\": \"Displays a list of products with filtering options such as categories, price range, and sustainability ratings. Includes product images, brief descriptions, and price.\"\n    },\n    {\n      \"name\": \"Product Detail\",\n      \"description\": \"Shows detailed information about a selected product, including multiple images, detailed description, user reviews, and an option to add to cart.\"\n    },\n    {\n      \"name\": \"Loyalty Rewards\",\n      \"description\": \"Explains the loyalty program, displays user points, and offers available rewards. Includes a call to action to join or log into the loyalty program.\"\n    }\n  ]\n}\n```"
    return NextResponse.json(structureData);
}
