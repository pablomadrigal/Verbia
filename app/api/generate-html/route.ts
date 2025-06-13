import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface HtmlScreen {
    name: string;
    html: string;
    css: string;
}

export interface HtmlResponse {
    screens: HtmlScreen[];
}

const systemPrompt = `
You are a senior front-end developer and UI specialist. Based on a project description, you will generate complete, responsive HTML and CSS for each screen listed, using PicoCSS and semantic HTML.
`;

const userPrompt = `
You are a senior web developer specialized in semantic HTML and responsive design using the PicoCSS framework.

Your task is to generate a set of screens (pages) for a prototype design based on a project description. Each screen must be returned as an object with:

- "name": name of the screen
- "html": the full HTML of the page, using the PicoCSS skeleton below
- "css": specific page CSS inside a <style> block or empty string if unnecessary

Each screen must follow this HTML skeleton, and all output must be complete and standalone:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PAGE_TITLE}}</title>
    <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css">
    <style>
      {{PAGE_SPECIFIC_CSS}}
    </style>
  </head>
  <body>
    <main class="container">
      <header>
        <h1>{{HEADER}}</h1>
      </header>
      <section>
        {{CONTENT}}
      </section>
      <footer>
        <small>Generated with AI</small>
      </footer>
    </main>
  </body>
</html>
\`\`\`

---

### Use the following PicoCSS components when appropriate:

**1. Input Field**
\`\`\`html
<label for="email">Email</label>
<input type="email" id="email" name="email" placeholder="you@example.com" required>
\`\`\`

**2. Button**
\`\`\`html
<button type="submit">Submit</button>
\`\`\`

**3. Card-like Container**
\`\`\`html
<article>
  <header>
    <h2>Card Title</h2>
    <p class="secondary">Subheading</p>
  </header>
  <p>Main content here.</p>
  <footer><button>Action</button></footer>
</article>
\`\`\`

**4. Grid Layout**
\`\`\`html
<div class="grid">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
\`\`\`

**5. Navigation Bar**
\`\`\`html
<nav class="container-fluid">
  <ul>
    <li><strong>Brand</strong></li>
  </ul>
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
  </ul>
</nav>
\`\`\`

**6. Modal**
Please use the HTML5 <dialog> element styled by Pico CSS for modal dialogs.

- To open the modal, call ".showModal()" on the dialog element by its ID.
- Structure the modal content inside a <form method="dialog">.
- Use buttons inside a <menu> with 'value="cancel"' or 'value="confirm"' to close the modal.
- The backdrop (overlay behind the modal) can be styled using 'dialog::backdrop'.
- You may add simple CSS to customize the modal size, padding, and border-radius for better presentation.

Example modal code snippet:

\`\`\`html
<button onclick="document.getElementById('modal-example').showModal()">Open Modal</button>

<dialog id="modal-example">
  <form method="dialog">
    <h2>Modal Title</h2>
    <p>This is a simple modal dialog using Pico CSS styling.</p>
    <menu>
      <button value="cancel">Cancel</button>
      <button value="confirm">Confirm</button>
    </menu>
  </form>
</dialog>

<style>
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
  dialog {
    border-radius: 8px;
    padding: 1.5rem;
    width: 90%;
    max-width: 400px;
  }
</style>
\`\`\`
Make sure the modal is accessible and functional on all screen sizes.

Use this pattern whenever you need modals for alerts, forms, confirmations, or additional info in the generated HTML pages.

You must use semantic and accessible HTML.

---

### Input:
You will receive a JSON with the following structure:

- title: The name of the project
- description: A paragraph describing what the design is for
- designType: The type of product (e.g., web app, mobile UI, portfolio, e-commerce)
- colorPalette: Any colors mentioned or inferred
- brandIdentity: What the brand feels like (e.g., modern, playful)
- screens: A list of screen names and a summary of what should go into each

---

### Output:
Return only a JSON object with this format:

\`\`\`json
{
  "screens": [
    {
      "name": "Screen Name",
      "html": "<!DOCTYPE html>...full page here...",
      "css": "/* page specific CSS */"
    }
  ]
}
\`\`\`

Use clean, minimal styling. Prioritize layout, clarity, and responsiveness. Avoid using any JavaScript. The output HTML must be renderable directly in a browser and inside a Next.js "dangerouslySetInnerHTML".

Make sure all placeholders ({{...}}) are replaced.

---

PROJECT DATA:
`;

export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.screens || !Array.isArray(body.screens)) {
        return new Response('Missing or invalid "screens" array', { status: 400 });
    }

    console.log("generating html");
    const { text } = await generateText({
        model: openai.chat('gpt-4o'),
        system: systemPrompt,
        prompt: userPrompt + JSON.stringify(body),
        temperature: 0.5,
        maxTokens: 4096,
    });
    console.log("html generated");

    return NextResponse.json(text);
}

export async function GET() {
    const htmlData = "```json\n{\n  \"screens\": [\n    {\n      \"name\": \"Product Catalog\",\n      \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n  <head>\\n    <meta charset=\\\"UTF-8\\\" />\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\" />\\n    <title>Product Catalog</title>\\n    <link rel=\\\"stylesheet\\\" href=\\\"https://unpkg.com/@picocss/pico@latest/css/pico.min.css\\\">\\n    <style>\\n      .filter-bar {\\n        display: flex;\\n        justify-content: space-between;\\n        margin-bottom: 1rem;\\n      }\\n      .product-card {\\n        border: 1px solid #ccc;\\n        border-radius: 8px;\\n        padding: 1rem;\\n        background-color: #f9f9f9;\\n      }\\n    </style>\\n  </head>\\n  <body>\\n    <main class=\\\"container\\\">\\n      <header>\\n        <h1>Product Catalog</h1>\\n      </header>\\n      <section>\\n        <div class=\\\"filter-bar\\\">\\n          <label for=\\\"category\\\">Category</label>\\n          <select id=\\\"category\\\">\\n            <option value=\\\"all\\\">All</option>\\n            <option value=\\\"clothing\\\">Clothing</option>\\n            <option value=\\\"accessories\\\">Accessories</option>\\n          </select>\\n          <label for=\\\"price-range\\\">Price Range</label>\\n          <input type=\\\"range\\\" id=\\\"price-range\\\" name=\\\"price-range\\\" min=\\\"0\\\" max=\\\"500\\\">\\n          <label for=\\\"sustainability\\\">Sustainability</label>\\n          <select id=\\\"sustainability\\\">\\n            <option value=\\\"all\\\">All</option>\\n            <option value=\\\"high\\\">High</option>\\n            <option value=\\\"medium\\\">Medium</option>\\n            <option value=\\\"low\\\">Low</option>\\n          </select>\\n        </div>\\n        <div class=\\\"grid\\\">\\n          <article class=\\\"product-card\\\">\\n            <header>\\n              <h2>Product 1</h2>\\n              <p class=\\\"secondary\\\">$50</p>\\n            </header>\\n            <p>Brief description of the product.</p>\\n            <footer><button>View Details</button></footer>\\n          </article>\\n          <article class=\\\"product-card\\\">\\n            <header>\\n              <h2>Product 2</h2>\\n              <p class=\\\"secondary\\\">$75</p>\\n            </header>\\n            <p>Brief description of the product.</p>\\n            <footer><button>View Details</button></footer>\\n          </article>\\n          <!-- More products here -->\\n        </div>\\n      </section>\\n      <footer>\\n        <small>Generated with AI</small>\\n      </footer>\\n    </main>\\n  </body>\\n</html>\",\n      \"css\": \"\"\n    },\n    {\n      \"name\": \"Product Detail\",\n      \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n  <head>\\n    <meta charset=\\\"UTF-8\\\" />\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\" />\\n    <title>Product Detail</title>\\n    <link rel=\\\"stylesheet\\\" href=\\\"https://unpkg.com/@picocss/pico@latest/css/pico.min.css\\\">\\n    <style>\\n      .product-images {\\n        display: flex;\\n        gap: 1rem;\\n        margin-bottom: 1rem;\\n      }\\n      .product-images img {\\n        width: 100%;\\n        max-width: 150px;\\n        border-radius: 8px;\\n      }\\n      .review {\\n        border-top: 1px solid #ccc;\\n        padding-top: 1rem;\\n        margin-top: 1rem;\\n      }\\n    </style>\\n  </head>\\n  <body>\\n    <main class=\\\"container\\\">\\n      <header>\\n        <h1>Product Detail</h1>\\n      </header>\\n      <section>\\n        <div class=\\\"product-images\\\">\\n          <img src=\\\"image1.jpg\\\" alt=\\\"Product Image 1\\\">\\n          <img src=\\\"image2.jpg\\\" alt=\\\"Product Image 2\\\">\\n          <img src=\\\"image3.jpg\\\" alt=\\\"Product Image 3\\\">\\n        </div>\\n        <h2>Product Name</h2>\\n        <p>$100</p>\\n        <p>Detailed description of the product goes here. It includes all the important features and specifications.</p>\\n        <button>Add to Cart</button>\\n        <div class=\\\"reviews\\\">\\n          <h3>User Reviews</h3>\\n          <div class=\\\"review\\\">\\n            <p><strong>Reviewer Name</strong></p>\\n            <p>Great product! Highly recommend.</p>\\n          </div>\\n          <div class=\\\"review\\\">\\n            <p><strong>Reviewer Name</strong></p>\\n            <p>Very satisfied with the quality.</p>\\n          </div>\\n          <!-- More reviews here -->\\n        </div>\\n      </section>\\n      <footer>\\n        <small>Generated with AI</small>\\n      </footer>\\n    </main>\\n  </body>\\n</html>\",\n      \"css\": \"\"\n    },\n    {\n      \"name\": \"Loyalty Rewards\",\n      \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n  <head>\\n    <meta charset=\\\"UTF-8\\\" />\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\" />\\n    <title>Loyalty Rewards</title>\\n    <link rel=\\\"stylesheet\\\" href=\\\"https://unpkg.com/@picocss/pico@latest/css/pico.min.css\\\">\\n    <style>\\n      .rewards-info {\\n        margin-bottom: 1rem;\\n      }\\n      .points {\\n        font-size: 1.5rem;\\n        margin-bottom: 1rem;\\n      }\\n    </style>\\n  </head>\\n  <body>\\n    <main class=\\\"container\\\">\\n      <header>\\n        <h1>Loyalty Rewards</h1>\\n      </header>\\n      <section>\\n        <div class=\\\"rewards-info\\\">\\n          <p>Join our loyalty program to earn points on every purchase. Redeem points for discounts and special offers.</p>\\n          <p class=\\\"points\\\">Your Points: 120</p>\\n          <button>Join Now</button>\\n          <button>Log In</button>\\n        </div>\\n        <div class=\\\"grid\\\">\\n          <article>\\n            <header>\\n              <h2>Reward 1</h2>\\n              <p class=\\\"secondary\\\">100 Points</p>\\n            </header>\\n            <p>Get 10% off your next purchase.</p>\\n            <footer><button>Redeem</button></footer>\\n          </article>\\n          <article>\\n            <header>\\n              <h2>Reward 2</h2>\\n              <p class=\\\"secondary\\\">200 Points</p>\\n            </header>\\n            <p>Free shipping on your next order.</p>\\n            <footer><button>Redeem</button></footer>\\n          </article>\\n          <!-- More rewards here -->\\n        </div>\\n      </section>\\n      <footer>\\n        <small>Generated with AI</small>\\n      </footer>\\n    </main>\\n  </body>\\n</html>\",\n      \"css\": \"\"\n    }\n  ]\n}\n```"
    return NextResponse.json(htmlData);
}