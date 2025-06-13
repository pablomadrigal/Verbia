import { NextResponse } from 'next/server';

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
    compatibility: 'strict',
});


function extraerTextoDelCliente(transcripcion: string, cliente = "Cliente") {
    return transcripcion
        .split("\n")
        .filter(linea => linea.includes(`${cliente}:`))
        .map(linea => linea.split(`${cliente}:`)[1].trim())
        .join(" ");
}

function promptGPT(textoCliente: string) {
    console.log('Generating prompt for text:', textoCliente.substring(0, 100) + '...');
    const executiveSummaryPrompt = `You are an expert business analyst and design consultant. Your task is to review a transcript of a call between a designer and a client and extract the core needs, design preferences, and brand identity discussed. The summary must be concise, highlighting the most important points for a design project.

Focus on identifying:
- **Client's Core Needs:** What problem are they trying to solve with this design? What functionalities are essential?
- **Desired Design Type:** Is it a website, mobile app, a specific kind of interface (e.g., e-commerce, portfolio, informational)?
- **Color Palette Preferences:** Any explicit or implicit mentions of colors, moods associated with colors, or existing brand colors.
- **Brand Identity & Tone:** What is the brand's personality? Is it modern, classic, playful, professional, minimalist, bold? What feeling should the design evoke?
- **Target Audience:** Who is the design for?

The output should be a clear, executive summary in the original language of the transcript. Do not include any conversational filler, just the distilled information.
The output should be in markdown format.

---
${textoCliente}`.trim();
    return executiveSummaryPrompt;
}

function promptGenerateHtml(executiveSummary: string) {
    return `You are an expert, friendly, and highly creative UX/Product designer specialized in generating cutting-edge web and mobile interfaces using HTML and CSS. Your designs are always modern, user-centric, and aesthetically pleasing, ensuring a seamless user experience.

## Context for Design Generation:
${executiveSummary}

## Design Request:
Based on the executive summary provided above, your task is to generate the HTML and CSS code for the requested web or mobile interface(s). Prioritize clean, semantic HTML5 and modern, responsive CSS3. Focus on delivering the best possible design aesthetics and user experience given the client's needs and brand identity.

### Key Guidelines:
1.  **Platform Determination:** Analyze the context to determine if the client primarily needs a **mobile-first design** (for native mobile apps or mobile web) or a **desktop-first design** (for web apps/websites). Generate accordingly. If not explicitly clear, default to a **responsive web design** that adapts well to both.
2.  **Single vs. Multiple Screens:** If the context suggests a single, focused screen (e.g., a landing page, a login screen), generate just that one screen. If it indicates multiple distinct functional areas (e.g., product listing, product detail, checkout), generate up to a maximum of **3 screens**. For multiple screens, ensure each screen is distinct and serves a clear purpose, reflecting the client's needs.
3.  **Aesthetics and Branding:** Incorporate the specified or inferred color palettes, brand identity, and tone directly into the design. Use appropriate typography, spacing, and visual hierarchy to enhance usability and reflect the brand.
4.  **No Clarifications:** You cannot ask for any clarifications. Generate the best possible design based *solely* on the provided executive summary.
5.  **Output:** Provide the complete HTML and CSS for each screen generated. Each screen's code should be clearly separated. Do not include JavaScript unless absolutely necessary for a core UI element (e.g., a simple tab switch, but avoid complex interactions that require extensive JS logic).
6.  **Summary of Generated Screens:** After generating the code, provide a brief, bullet-point summary of each screen, describing its purpose and key design elements.
7.  **Output Format:** Provide only a json file with the following structure:
{
    "title": "Title of the project",
    "description": "Description of the project",
    "colorPalette": "Color palette of the project",
    "brandIdentity": "Brand identity of the project",
    "targetAudience": "Target audience of the project",
    "summary": "Summary of the project",
    "generalCss": "General CSS code for the project",
    "screens": [
        {
            "name": "Screen Name",
            "html": "HTML Code",
            "css": "CSS Code"
        }
    ]
}

---
`
}

export async function POST(request: Request) {
    console.log('Received preview generation request');
    console.log("Vercel API Key:", process.env.VERCEL_API_KEY);
    console.log("OpenAI API Key:", process.env.OPENAI_API_KEY);
    try {
        const { transcription, cliente } = await request.json();
        console.log('Received transcription:', transcription.substring(0, 100) + '...');

        const textoCliente = cliente ? extraerTextoDelCliente(transcription, cliente) : transcription;
        const systemPrompt = promptGPT(textoCliente);
        console.log('Generated system prompt');

        console.log('Calling OpenAI to generate executive summary...');
        const { text: summaryResponse } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: systemPrompt,
            temperature: 0.7,
            maxTokens: 500,
        });
        console.log('OpenAI response received:', summaryResponse.substring(0, 100) + '...');

        const executiveSummary = summaryResponse.trim() || '';

        const htmlPrompt = promptGenerateHtml(executiveSummary);

        console.log('Calling OpenAI to generate HTML...');
        const { text: htmlResponse } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: htmlPrompt,
            temperature: 0.7,
            maxTokens: 2000,
        });
        console.log('Successfully generated preview');
        return NextResponse.json({ ui: htmlResponse, executiveSummary });
    } catch (error: any) {
        console.error('Error in preview generation:', error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}

export async function GET() {
    console.log("GET request received, returning mock data");
    const mockData = {
        "ui": "```json\n{\n    \"title\": \"Eco-Friendly E-Commerce Platform\",\n    \"description\": \"A user-friendly e-commerce website designed for eco-conscious consumers, focusing on sustainability and ease of navigation.\",\n    \"colorPalette\": \"Soft earth tones with greens and browns to evoke calmness and sustainability.\",\n    \"brandIdentity\": \"Modern and eco-conscious, professional yet approachable, focusing on trust and warmth.\",\n    \"targetAudience\": \"Environmentally conscious shoppers aged 25-45 who value quality and sustainability.\",\n    \"summary\": \"This project aims to create a responsive e-commerce platform that enhances user engagement through a seamless shopping experience, showcasing products effectively while integrating social media.\",\n    \"screens\": [\n        {\n            \"name\": \"Home Page\",\n            \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">\\n    <link rel=\\\"stylesheet\\\" href=\\\"styles.css\\\">\\n    <title>Eco-Friendly Shop</title>\\n</head>\\n<body>\\n    <header>\\n        <h1>Eco-Friendly Shop</h1>\\n        <nav>\\n            <ul>\\n                <li><a href=\\\"#products\\\">Products</a></li>\\n                <li><a href=\\\"#about\\\">About Us</a></li>\\n                <li><a href=\\\"#contact\\\">Contact</a></li>\\n                <li><a href=\\\"#cart\\\">Cart</a></li>\\n            </ul>\\n        </nav>\\n    </header>\\n    <main>\\n        <section id=\\\"hero\\\">\\n            <h2>Shop Sustainably</h2>\\n            <p>Discover eco-friendly products that make a difference.</p>\\n            <a href=\\\"#products\\\" class=\\\"btn\\\">Shop Now</a>\\n        </section>\\n        <section id=\\\"products\\\">\\n            <h3>Featured Products</h3>\\n            <div class=\\\"product-list\\\">\\n                <div class=\\\"product-item\\\">\\n                    <img src=\\\"product1.jpg\\\" alt=\\\"Product 1\\\">\\n                    <h4>Product 1</h4>\\n                    <p>$29.99</p>\\n                    <button>Add to Cart</button>\\n                </div>\\n                <div class=\\\"product-item\\\">\\n                    <img src=\\\"product2.jpg\\\" alt=\\\"Product 2\\\">\\n                    <h4>Product 2</h4>\\n                    <p>$39.99</p>\\n                    <button>Add to Cart</button>\\n                </div>\\n                <div class=\\\"product-item\\\">\\n                    <img src=\\\"product3.jpg\\\" alt=\\\"Product 3\\\">\\n                    <h4>Product 3</h4>\\n                    <p>$49.99</p>\\n                    <button>Add to Cart</button>\\n                </div>\\n            </div>\\n        </section>\\n    </main>\\n    <footer>\\n        <p>&copy; 2023 Eco-Friendly Shop. All rights reserved.</p>\\n    </footer>\\n</body>\\n</html>\",\n            \"css\": \"body {\\n    font-family: Arial, sans-serif;\\n    margin: 0;\\n    padding: 0;\\n    background-color: #f9f9f9;\\n    color: #333;\\n}\\nheader {\\n    background-color: #6b8e23;\\n    color: white;\\n    padding: 1rem;\\n}\\nnav ul {\\n    list-style-type: none;\\n    padding: 0;\\n}\\nnav ul li {\\n    display: inline;\\n    margin-right: 15px;\\n}\\nnav ul li a {\\n    color: white;\\n    text-decoration: none;\\n}\\n#hero {\\n    text-align: center;\\n    padding: 50px 20px;\\n    background-color: #d9e2c7;\\n}\\n.btn {\\n    background-color: #8fbc8f;\\n    color: white;\\n    padding: 10px 20px;\\n    text-decoration: none;\\n}\\n.product-list {\\n    display: flex;\\n    justify-content: space-around;\\n    padding: 20px;\\n}\\n.product-item {\\n    text-align: center;\\n    background-color: white;\\n    box-shadow: 0 4px 8px rgba(0,0,0,0.1);\\n    padding: 20px;\\n    margin: 10px;\\n    border-radius: 8px;\\n}\\nfooter {\\n    background-color: #6b8e23;\\n    color: white;\\n    text-align: center;\\n    padding: 1rem;\\n    position: relative;\\n    bottom: 0;\\n    width: 100%;\\n}\"\n        },\n        {\n            \"name\": \"Product Detail Page\",\n            \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">\\n    <link rel=\\\"stylesheet\\\" href=\\\"styles.css\\\">\\n    <title>Product Detail</title>\\n</head>\\n<body>\\n    <header>\\n        <h1>Eco-Friendly Shop</h1>\\n        <nav>\\n            <ul>\\n                <li><a href=\\\"#home\\\">Home</a></li>\\n                <li><a href=\\\"#products\\\">Products</a></li>\\n                <li><a href=\\\"#about\\\">About Us</a></li>\\n                <li><a href=\\\"#contact\\\">Contact</a></li>\\n                <li><a href=\\\"#cart\\\">Cart</a></li>\\n            </ul>\\n        </nav>\\n    </header>\\n    <main>\\n        <section id=\\\"product-detail\\\">\\n            <img src=\\\"product1.jpg\\\" alt=\\\"Product 1\\\">\\n            <h2>Product 1</h2>\\n            <p>Description of Product 1. This product is made from sustainable materials and is designed to last.</p>\\n            <p>Price: $29.99</p>\\n            <button>Add to Cart</button>\\n        </section>\\n    </main>\\n    <footer>\\n        <p>&copy; 2023 Eco-Friendly Shop. All rights reserved.</p>\\n    </footer>\\n</body>\\n</html>\",\n            \"css\": \"body {\\n    font-family: Arial, sans-serif;\\n    margin: 0;\\n    padding: 0;\\n    background-color: #f9f9f9;\\n    color: #333;\\n}\\nheader {\\n    background-color: #6b8e23;\\n    color: white;\\n    padding: 1rem;\\n}\\n#product-detail {\\n    text-align: center;\\n    padding: 50px 20px;\\n}\\nfooter {\\n    background-color: #6b8e23;\\n    color: white;\\n    text-align: center;\\n    padding: 1rem;\\n    position: relative;\\n    bottom: 0;\\n    width: 100%;\\n}\"\n        },\n        {\n            \"name\": \"Checkout Page\",\n            \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">\\n    <link rel=\\\"stylesheet\\\" href=\\\"styles.css\\\">\\n    <title>Checkout</title>\\n</head>\\n<body>\\n    <header>\\n        <h1>Eco-Friendly Shop</h1>\\n        <nav>\\n            <ul>\\n                <li><a href=\\\"#home\\\">Home</a></li>\\n                <li><a href=\\\"#products\\\">Products</a></li>\\n                <li><a href=\\\"#about\\\">About Us</a></li>\\n                <li><a href=\\\"#contact\\\">Contact</a></li>\\n                <li><a href=\\\"#cart\\\">Cart</a></li>\\n            </ul>\\n        </nav>\\n    </header>\\n    <main>\\n        <section id=\\\"checkout\\\">\\n            <h2>Checkout</h2>\\n            <form>\\n                <label for=\\\"name\\\">Name:</label>\\n                <input type=\\\"text\\\" id=\\\"name\\\" name=\\\"name\\\" required>\\n                <label for=\\\"address\\\">Address:</label>\\n                <input type=\\\"text\\\" id=\\\"address\\\" name=\\\"address\\\" required>\\n                <label for=\\\"payment\\\">Payment Method:</label>\\n                <select id=\\\"payment\\\" name=\\\"payment\\\">\\n                    <option value=\\\"credit\\\">Credit Card</option>\\n                    <option value=\\\"paypal\\\">PayPal</option>\\n                </select>\\n                <button type=\\\"submit\\\">Complete Purchase</button>\\n            </form>\\n        </section>\\n    </main>\\n    <footer>\\n        <p>&copy; 2023 Eco-Friendly Shop. All rights reserved.</p>\\n    </footer>\\n</body>\\n</html>\"\n        }\n    ]\n}```",
        "executiveSummary": "# Executive Summary of Client-Designer Call\n\n## Client's Core Needs\n- The client aims to improve user engagement on their platform.\n- Essential functionalities include easy navigation, user-friendly interface, and a responsive design that works on both desktop and mobile.\n\n## Desired Design Type\n- The project is focused on developing a responsive website that serves as an e-commerce platform.\n\n## Color Palette Preferences\n- The client prefers a vibrant color palette that includes shades of blue and green, associated with feelings of trust and freshness.\n- They have an existing brand color scheme that should be integrated into the new design.\n\n## Brand Identity & Tone\n- The brand personality is described as modern and approachable, with a playful yet professional tone.\n- The design should evoke feelings of reliability and excitement, appealing to a younger demographic.\n\n## Target Audience\n- The primary target audience includes tech-savvy millennials and Gen Z consumers looking for trendy and reliable products online."
    };

    return NextResponse.json(mockData);
} 