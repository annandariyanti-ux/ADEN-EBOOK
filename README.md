# Aden Generator Ebook AI

AI-powered eBook generator that creates complete, structured, and sellable eBooks in Indonesian.

## Deployment on Vercel

To deploy this project on Vercel, follow these steps:

1.  **Push the code to GitHub**: Create a new repository and push your code.
2.  **Connect to Vercel**: Go to [vercel.com](https://vercel.com) and import your repository.
3.  **Configure Environment Variables**:
    *   In the Vercel dashboard, go to your project's **Settings** > **Environment Variables**.
    *   Add a new variable:
        *   **Name**: `GEMINI_API_KEY`
        *   **Value**: Your Google Gemini API key.
4.  **Deploy**: Vercel will automatically detect the Vite project and deploy it.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env` file and add your `GEMINI_API_KEY`:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
