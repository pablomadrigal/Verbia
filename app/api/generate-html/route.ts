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

const systemNewPrompt = "You are an expert AI front-end developer and UI/UX designer. Your specialty is creating visually stunning, production-ready, and responsive MVP applications using **Tailwind CSS, HTML, and vanilla JavaScript**. You are a master of modern design principles and create clean, efficient, and well-documented code by leveraging Tailwind's utility-first classes and adding interactivity where appropriate. You will receive a project brief in JSON format that details the specific components for each screen, and you will generate the complete application by following the provided blueprints precisely."

const systemPrompt = `
You are a senior front-end developer and UI specialist. Based on a project description, you will generate complete, responsive HTML and CSS for each screen listed, using PicoCSS and semantic HTML.
`;

const userNewPrompt = `
  "You are a senior front-end developer building a visually impressive and functional MVP using **Tailwind CSS and vanilla JavaScript**. Your response must be a single JSON object containing an array of screen objects, each with its name and complete HTML.

**Your task is to generate a set of screens based on a project description, following this HTML skeleton:**

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PAGE_TITLE}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 text-gray-800 antialiased">
    <!-- Generated Page Content Will Go Here -->
    {{CONTENT}}
  </body>
</html>
\`\`\`

---

### **Part 1: Core Blueprints (Inspired by Official Tailwind UI Patterns)**

For the following fundamental components, you MUST adhere to these detailed blueprints and their documented best practices.

**1. Header**
*   **Documentation:** A responsive navigation bar that's sticky to the top. It uses Flexbox ('flex', 'justify-between', 'items-center') for alignment. Navigation links are hidden on mobile ('hidden') and appear on medium screens and up ('md:flex').
*   **Blueprint:**
    \`\`\`html
    <header class="bg-white shadow-md sticky top-0 z-50">
      <nav class="container mx-auto px-6 py-4 flex justify-between items-center">
        <!-- Brand Logo -->
        <a href="#" class="text-2xl font-bold text-gray-800">{{BRAND_NAME}}</a>
        <!-- Primary Navigation (Desktop) -->
        <div class="hidden md:flex items-center space-x-6">
          <a href="#" class="text-gray-600 hover:text-blue-500 transition-colors">Features</a>
          <a href="#" class="text-gray-600 hover:text-blue-500 transition-colors">Pricing</a>
          <a href="#" class="text-gray-600 hover:text-blue-500 transition-colors">About</a>
        </div>
        <!-- CTA Button (Desktop) -->
        <a href="#" class="hidden md:block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Get Started</a>
        <!-- Mobile Menu Button would go here -->
      </nav>
    </header>
    \`\`\`

**2. Hero Section**
*   **Documentation:** A prominent section with a clear visual hierarchy. A 'max-w-' class is used on the paragraph to improve readability by limiting line length. 'mx-auto' centers the content block. Font sizes and weights ('text-6xl', 'font-extrabold', 'text-lg') create a clear distinction between the headline and sub-headline.
*   **Blueprint:**
    \`\`\`html
    <section class="py-20 md:py-32 bg-gray-100">
      <div class="container mx-auto text-center px-6">
        <h1 class="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">The Future of X is Here</h1>
        <p class="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">A compelling subheading that explains the value proposition clearly and concisely.</p>
        <a href="#" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all">Call to Action</a>
      </div>
    </section>
    \`\`\`

**3. Feature Section**
*   **Documentation:** Uses a responsive 'grid' layout. 'grid-cols-1' on mobile, stacking the features, and 'md:grid-cols-3' on medium screens and up. 'gap-8' provides consistent spacing between grid items. The icon is styled as a contained shape using Flexbox ('flex', 'items-center', 'justify-center') and a fixed size ('h-12', 'w-12').
*   **Blueprint:**
    \`\`\`html
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900">Why Our Product is a Game-Changer</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature Item -->
          <div class="text-center p-6">
            <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mx-auto mb-4">
              <!-- Heroicons SVG Placeholder -->
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Intuitive Interface</h3>
            <p class="text-gray-600">A user-friendly drag-and-drop builder that anyone can master.</p>
          </div>
          <!-- Repeat for other features -->
        </div>
      </div>
    </section>
    \`\`\`

**4. Buttons & Inputs**
*   **Documentation:** Buttons use 'hover:' states for visual feedback. 'transition-colors' makes the change smooth. Inputs use 'focus:' states ('focus:ring-2', 'focus:ring-blue-500') to provide a clear visual indicator for accessibility and better UX.
*   **Blueprint:**
    \`\`\`html
    <!-- Primary Button -->
    <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Primary Action</button>

    <!-- Input Field with Label -->
    <div class="mb-4">
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    </div>
    \`\`\`

---

### **Part 2: Additional Component Library**

This section contains other common components needed for building full pages.

**5. CTA (Call-to-Action) Banner**
*   **Description:** A high-visibility banner to prompt user action.
*   **Blueprint:**
    \`\`\`html
    <section class="bg-blue-600">
      <div class="container mx-auto px-6 py-12">
        <div class="flex flex-col md:flex-row justify-between items-center text-center md:text-left text-white">
          <h2 class="text-3xl font-extrabold">Ready to Dive In?</h2>
          <div class="mt-6 md:mt-0">
            <a href="#" class="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-lg shadow-lg">Sign Up Now</a>
          </div>
        </div>
      </div>
    </section>
    \`\`\`


**6. Pricing Section**
*   **Description:** Displays tiered pricing plans, one of which can be highlighted.
*   **Blueprint:**
    \`\`\`html
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-extrabold text-center mb-10">Pricing Title</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <!-- Standard Plan Card -->
          <div class="border rounded-lg p-6 flex flex-col bg-white shadow-lg">
            <h3 class="text-2xl font-bold text-center">Basic</h3>
            <p class="text-4xl font-extrabold text-center my-4">$10<span class="text-lg font-medium text-gray-500">/mo</span></p>
            <ul class="space-y-3 text-gray-600 mb-6 flex-grow">
              <li>Feature One</li>
            </ul>
            <button class="mt-auto w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Select Plan</button>
          </div>
          <!-- Highlighted Plan Card -->
          <div class="border-blue-500 ring-2 ring-blue-500 rounded-lg p-6 flex flex-col bg-white shadow-2xl transform scale-105">
            <h3 class="text-2xl font-bold text-center text-blue-600">Pro</h3>
            <p class="text-4xl font-extrabold text-center my-4">$25<span class="text-lg font-medium text-gray-500">/mo</span></p>
            <ul class="space-y-3 text-gray-600 mb-6 flex-grow">
              <li>All Basic Features</li>
              <li>Priority Support</li>
            </ul>
            <button class="mt-auto w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Choose Pro</button>
          </div>
        </div>
      </div>
    </section>
    \`\`\`

*   **7. Testimonial Section**
*   **Description:** A section to display quotes from customers for social proof.
*   **Blueprint:**
    \`\`\`html
    <section class="py-16 bg-gray-100">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl font-extrabold mb-10">What Our Customers Say</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <p class="text-gray-600 italic">"This is an amazing product that solved our problems."</p>
                    <p class="mt-4 font-bold">- Jane Doe, CEO of Innovate Inc.</p>
                </div>
            </div>
        </div>
    </section>
    \`\`\`
    
*   **8. Process Steps (Timeline Style)**
*   **Description:** A visual guide that breaks down a process into chronological steps.
*   **Blueprint:**
    \`\`\`html
    <section class="py-16">
      <div class="container mx-auto px-6">
        <h2 class="text-3xl font-extrabold text-center mb-12">How It Works</h2>
        <div class="relative wrap overflow-hidden">
          <div class="border-2-2 absolute border-opacity-20 border-gray-700 h-full border" style="left: 50%"></div>
          <!-- Step 1 -->
          <div class="mb-8 flex justify-between items-center w-full right-timeline">
            <div class="order-1 w-5/12"></div>
            <div class="z-20 flex items-center order-1 bg-gray-800 shadow-xl w-8 h-8 rounded-full">
              <h1 class="mx-auto font-semibold text-lg text-white">1</h1>
            </div>
            <div class="order-1 bg-blue-500 rounded-lg shadow-xl w-5/12 px-6 py-4">
              <h3 class="font-bold text-white text-xl">Step One</h3>
              <p class="text-sm text-blue-100">Details about the first step.</p>
            </div>
          </div>
          <!-- Step 2 -->
          <div class="mb-8 flex justify-between flex-row-reverse items-center w-full left-timeline">
            <div class="order-1 w-5/12"></div>
            <div class="z-20 flex items-center order-1 bg-gray-800 shadow-xl w-8 h-8 rounded-full">
              <h1 class="mx-auto text-white font-semibold text-lg">2</h1>
            </div>
            <div class="order-1 bg-gray-200 rounded-lg shadow-xl w-5/12 px-6 py-4">
              <h3 class="font-bold text-gray-800 text-xl">Step Two</h3>
              <p class="text-sm text-gray-600">Details about the second step.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    \`\`\`

**9. FAQ Section (Accordion)**
*   **Description:** A collapsible FAQ section that requires no JavaScript.
*   **Blueprint:**
    \`\`\`html
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-3xl">
        <h2 class="text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <details class="group bg-gray-50 p-6 rounded-lg">
            <summary class="font-semibold text-lg cursor-pointer">Question One?</summary>
            <p class="mt-4 text-gray-600">Answer to question one.</p>
          </details>
          <details class="group bg-gray-50 p-6 rounded-lg">
            <summary class="font-semibold text-lg cursor-pointer">Question Two?</summary>
            <p class="mt-4 text-gray-600">Answer to question two.</p>
          </details>
        </div>
      </div>
    </section>
    \`\`\`

**10. Portfolio Grid**
*   **Description:** A visual grid to showcase projects or work.
*   **Blueprint:**
    \`\`\`html
    <section class="py-16 bg-white">
      <div class="container mx-auto px-6">
        <h2 class="text-3xl font-extrabold text-center mb-12">Our Work</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white rounded-lg shadow-md overflow-hidden group">
            <img src="https://via.placeholder.com/600x400.png?text=Project+Image" alt="Project image" class="w-full h-48 object-cover">
            <div class="p-6">
              <h3 class="text-xl font-bold mb-2">Project Title</h3>
              <a href="#" class="font-semibold text-blue-600 hover:text-blue-500">View Details →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
    \`\`\`

**11. Stats / Metrics Section**
*   **Description:** A high-impact section to display key numbers.
*   **Blueprint:**
    \`\`\`html
    <section class="py-16 bg-blue-600 text-white">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p class="text-5xl font-extrabold">10K+</p>
            <p class="text-lg mt-1">Active Users</p>
          </div>
          <div>
            <p class="text-5xl font-extrabold">99.9%</p>
            <p class="text-lg mt-1">Uptime</p>
          </div>
          <div>
            <p class="text-5xl font-extrabold">500+</p>
            <p class="text-lg mt-1">Integrations</p>
          </div>
        </div>
      </div>
    </section>
    \`\`\`


*   **12. Modal/Dialog**
*   **Description:** A JavaScript-powered pop-up window.
*   **Blueprint:**
    \`\`\`html
    <!-- Modal Trigger Button -->
    <button onclick="document.getElementById('myModal').classList.remove('hidden')" class="bg-blue-600 text-white font-bold py-2 px-4 rounded">Open Modal</button>
    <!-- Modal Structure -->
    <div id="myModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Modal Title</h3>
          <button onclick="document.getElementById('myModal').classList.add('hidden')" class="text-gray-500 hover:text-gray-800">×</button>
        </div>
        <div>
          <p>Modal content goes here.</p>
        </div>
        <div class="text-right mt-6">
          <button onclick="document.getElementById('myModal').classList.add('hidden')" class="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded">Close</button>
        </div>
      </div>
    </div>
    \`\`\`

**13. Alerts / Banners**
*   **Description:** Contextual feedback messages.
*   **Blueprint:**
    \`\`\`html
    <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
      <p class="font-bold">Success:</p>
      <p>Your action was completed successfully.</p>
    </div>
    \`\`\`

**14. Login Form Section**
*   **Description:** A standard form for user authentication.
*   **Blueprint:**
    \`\`\`html
    <section class="bg-gray-50 flex items-center justify-center py-20">
      <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 class="text-2xl font-bold text-center mb-6">Sign In</h2>
        <form>
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="password" class="w-full px-4 py-2 border rounded-lg">
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Sign In</button>
        </form>
      </div>
    </section>
    \`\`\`

**15. Data Table**
*   **Description:** A responsive table for displaying structured data.
*   **Blueprint:**
    \`\`\`html
    <div class="w-full overflow-hidden rounded-lg shadow-xs">
      <div class="w-full overflow-x-auto">
        <table class="w-full whitespace-no-wrap">
          <thead>
            <tr class="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b bg-gray-50">
              <th class="px-4 py-3">Client</th>
              <th class="px-4 py-3">Amount</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y">
            <tr class="text-gray-700">
              <td class="px-4 py-3">
                <p class="font-semibold">John Doe</p>
              </td>
              <td class="px-4 py-3">$863.45</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 font-semibold leading-tight text-green-700 bg-green-100 rounded-full">Approved</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    \`\`\`

**16. Chart / Graph Placeholder**
*   **Description:** A container ready for a JavaScript charting library like Chart.js.
*   **Blueprint:**
    \`\`\`html
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <h3 class="text-xl font-bold mb-4">Analytics Overview</h3>
      <canvas id="myChart"></canvas>
    </div>
    <!-- This script MUST be placed at the end of the <body> tag -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      const ctx = document.getElementById('myChart');
      if (ctx) {
        new Chart(ctx, { type: 'bar', data: { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ label: 'Sales', data: }] } });
      }
    </script>
    \`\`\`


**2. Multi-Column Footer**
*   **Description:** A comprehensive footer with organized site navigation.
*   **Blueprint:**
    \`\`\`html
    <footer class="bg-gray-800 text-gray-300">
        <div class="container mx-auto px-6 py-12">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <!-- Column 1: Brand -->
                <div><h3 class="font-bold text-white text-lg mb-4">{{BRAND_NAME}}</h3><p class="text-gray-400">Our mission is to build the best products.</p></div>
                <!-- Column 2: Product Links -->
                <div><h3 class="font-bold text-white text-lg mb-4">Product</h3><ul class="space-y-2"><li><a href="#" class="hover:text-white">Features</a></li><li><a href="#" class="hover:text-white">Pricing</a></li></ul></div>
                <!-- Column 3: Company Links -->
                <div><h3 class="font-bold text-white text-lg mb-4">Company</h3><ul class="space-y-2"><li><a href="#" class="hover:text-white">About Us</a></li><li><a href="#" class="hover:text-white">Blog</a></li></ul></div>
                <!-- Column 4: Legal Links -->
                <div><h3 class="font-bold text-white text-lg mb-4">Legal</h3><ul class="space-y-2"><li><a href="#" class="hover:text-white">Privacy Policy</a></li><li><a href="#" class="hover:text-white">Terms of Service</a></li></ul></div>
            </div>
            <div class="mt-12 border-t border-gray-700 pt-8 flex justify-between items-center text-sm"><p class="text-gray-400">© {{YEAR}} {{BRAND_NAME}}. All rights reserved.</p></div>
        </div>
    </footer>
    \`\`\`

*(Note: The detailed blueprints for these additional components are omitted here for brevity but are assumed to be the same as in the previous version of the prompt you approved.)*

---

### **Component Interpretation Guide & Rules:**

*   **Interpretation:** The 'type' in the input JSON maps directly to a blueprint name from the library.
*   **Use Core Blueprints:** For Headers, Heros, Features, and Buttons/Inputs, you MUST use the high-fidelity patterns from Part 1.
*   **Modals over Pages:** Use a 'Modal' for simple, contextual actions (e.g., Contact Form, Login, Subscribe) instead of creating a new page, unless a dedicated page is explicitly requested.
*   **Interactivity:** Use vanilla JavaScript within '<script>' tags for interactivity as defined in the blueprints (e.g., modals, charts).

---

### **Input: Project Brief**

\`\`\`json
{
  "projectTitle": "SaaSify - Company Homepage",
  "brandName": "SaaSify",
  "screens": [
    {
      "name": "Homepage",
      "components": [
        { "type": "Header", "content": { "navLinks": ["Features", "Pricing", "About"] } },
        { "type": "Hero", "content": { "headline": "The Best SaaS Platform", "ctaButton": "Try for Free" } },
        { "type": "FeatureSection" },
        { "type": "StatsSection" },
        { "type": "TestimonialSection" },
        { "type": "PricingSection" },
        { "type": "FAQSection" },
        { "type": "CTABanner" },
        { "type": "MultiColumnFooter" }
      ]
    }
  ]
}
\`\`\`

---

### **Output: Final JSON Response**

Return *only* a valid JSON object. Do not add any text outside the JSON.

\`\`\`json
{
  "screens": [
    {
      "name": "Screen Name",
      "html": "<!DOCTYPE html>...full page using Tailwind CSS classes and <script> tags where appropriate..."
    }
  ]
}
\`\`\`

**Final Instructions:**
1.  **Adhere Strictly to Blueprints:** Build each component precisely as described in the library, paying special attention to the documented Core Blueprints.
2.  **Follow the 'components' Array:** The order and type of components in the input JSON must be followed exactly.
3.  **Use Tailwind CSS and JavaScript:** All styling must be with Tailwind utilities. Use vanilla JavaScript for interactivity as defined.
4.  **Responsiveness is Mandatory:** Ensure the layout is mobile-first and adapts flawlessly.
5.  **Replace Dynamic Content:** Replace placeholders like \`{{BRAND_NAME}}\`, \`{{YEAR}}\`, and content from the 'content' objects in the input JSON.

Now, generate the screens based on the provided project data.
`

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
  const htmlData = "\`\`\`json\n{\n  \"screens\": [\n    {\n      \"name\": \"Product Catalog\",\n      \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n  <head>\\n    <meta charset=\\\"UTF-8\\\" />\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\" />\\n    <title>Product Catalog</title>\\n    <link rel=\\\"stylesheet\\\" href=\\\"https://unpkg.com/@picocss/pico@latest/css/pico.min.css\\\">\\n    <style>\\n      .filter-bar {\\n        display: flex;\\n        justify-content: space-between;\\n        margin-bottom: 1rem;\\n      }\\n      .product-card {\\n        border: 1px solid #ccc;\\n        border-radius: 8px;\\n        padding: 1rem;\\n        background-color: #f9f9f9;\\n      }\\n    </style>\\n  </head>\\n  <body>\\n    <main class=\\\"container\\\">\\n      <header>\\n        <h1>Product Catalog</h1>\\n      </header>\\n      <section>\\n        <div class=\\\"filter-bar\\\">\\n          <label for=\\\"category\\\">Category</label>\\n          <select id=\\\"category\\\">\\n            <option value=\\\"all\\\">All</option>\\n            <option value=\\\"clothing\\\">Clothing</option>\\n            <option value=\\\"accessories\\\">Accessories</option>\\n          </select>\\n          <label for=\\\"price-range\\\">Price Range</label>\\n          <input type=\\\"range\\\" id=\\\"price-range\\\" name=\\\"price-range\\\" min=\\\"0\\\" max=\\\"500\\\">\\n          <label for=\\\"sustainability\\\">Sustainability</label>\\n          <select id=\\\"sustainability\\\">\\n            <option value=\\\"all\\\">All</option>\\n            <option value=\\\"high\\\">High</option>\\n            <option value=\\\"medium\\\">Medium</option>\\n            <option value=\\\"low\\\">Low</option>\\n          </select>\\n        </div>\\n        <div class=\\\"grid\\\">\\n          <article class=\\\"product-card\\\">\\n            <header>\\n              <h2>Product 1</h2>\\n              <p class=\\\"secondary\\\">$50</p>\\n            </header>\\n            <p>Brief description of the product.</p>\\n            <footer><button>View Details</button></footer>\\n          </article>\\n          <article class=\\\"product-card\\\">\\n            <header>\\n              <h2>Product 2</h2>\\n              <p class=\\\"secondary\\\">$75</p>\\n            </header>\\n            <p>Brief description of the product.</p>\\n            <footer><button>View Details</button></footer>\\n          </article>\\n          <!-- More products here -->\\n        </div>\\n      </section>\\n      <footer>\\n        <small>Generated with AI</small>\\n      </footer>\\n    </main>\\n  </body>\\n</html>\",\n      \"css\": \"\"\n    },\n    {\n      \"name\": \"Product Detail\",\n      \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n  <head>\\n    <meta charset=\\\"UTF-8\\\" />\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\" />\\n    <title>Product Detail</title>\\n    <link rel=\\\"stylesheet\\\" href=\\\"https://unpkg.com/@picocss/pico@latest/css/pico.min.css\\\">\\n    <style>\\n      .product-images {\\n        display: flex;\\n        gap: 1rem;\\n        margin-bottom: 1rem;\\n      }\\n      .product-images img {\\n        width: 100%;\\n        max-width: 150px;\\n        border-radius: 8px;\\n      }\\n      .review {\\n        border-top: 1px solid #ccc;\\n        padding-top: 1rem;\\n        margin-top: 1rem;\\n      }\\n    </style>\\n  </head>\\n  <body>\\n    <main class=\\\"container\\\">\\n      <header>\\n        <h1>Product Detail</h1>\\n      </header>\\n      <section>\\n        <div class=\\\"product-images\\\">\\n          <img src=\\\"image1.jpg\\\" alt=\\\"Product Image 1\\\">\\n          <img src=\\\"image2.jpg\\\" alt=\\\"Product Image 2\\\">\\n          <img src=\\\"image3.jpg\\\" alt=\\\"Product Image 3\\\">\\n        </div>\\n        <h2>Product Name</h2>\\n        <p>$100</p>\\n        <p>Detailed description of the product goes here. It includes all the important features and specifications.</p>\\n        <button>Add to Cart</button>\\n        <div class=\\\"reviews\\\">\\n          <h3>User Reviews</h3>\\n          <div class=\\\"review\\\">\\n            <p><strong>Reviewer Name</strong></p>\\n            <p>Great product! Highly recommend.</p>\\n          </div>\\n          <div class=\\\"review\\\">\\n            <p><strong>Reviewer Name</strong></p>\\n            <p>Very satisfied with the quality.</p>\\n          </div>\\n          <!-- More reviews here -->\\n        </div>\\n      </section>\\n      <footer>\\n        <small>Generated with AI</small>\\n      </footer>\\n    </main>\\n  </body>\\n</html>\",\n      \"css\": \"\"\n    },\n    {\n      \"name\": \"Loyalty Rewards\",\n      \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n  <head>\\n    <meta charset=\\\"UTF-8\\\" />\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\" />\\n    <title>Loyalty Rewards</title>\\n    <link rel=\\\"stylesheet\\\" href=\\\"https://unpkg.com/@picocss/pico@latest/css/pico.min.css\\\">\\n    <style>\\n      .rewards-info {\\n        margin-bottom: 1rem;\\n      }\\n      .points {\\n        font-size: 1.5rem;\\n        margin-bottom: 1rem;\\n      }\\n    </style>\\n  </head>\\n  <body>\\n    <main class=\\\"container\\\">\\n      <header>\\n        <h1>Loyalty Rewards</h1>\\n      </header>\\n      <section>\\n        <div class=\\\"rewards-info\\\">\\n          <p>Join our loyalty program to earn points on every purchase. Redeem points for discounts and special offers.</p>\\n          <p class=\\\"points\\\">Your Points: 120</p>\\n          <button>Join Now</button>\\n          <button>Log In</button>\\n        </div>\\n        <div class=\\\"grid\\\">\\n          <article>\\n            <header>\\n              <h2>Reward 1</h2>\\n              <p class=\\\"secondary\\\">100 Points</p>\\n            </header>\\n            <p>Get 10% off your next purchase.</p>\\n            <footer><button>Redeem</button></footer>\\n          </article>\\n          <article>\\n            <header>\\n              <h2>Reward 2</h2>\\n              <p class=\\\"secondary\\\">200 Points</p>\\n            </header>\\n            <p>Free shipping on your next order.</p>\\n            <footer><button>Redeem</button></footer>\\n          </article>\\n          <!-- More rewards here -->\\n        </div>\\n      </section>\\n      <footer>\\n        <small>Generated with AI</small>\\n      </footer>\\n    </main>\\n  </body>\\n</html>\",\n      \"css\": \"\"\n    }\n  ]\n}\n\`\`\`"
  return NextResponse.json(htmlData);
}