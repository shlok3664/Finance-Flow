# Setup and Installation

This project is a responsive React application. To run it, you'll need a standard React development environment.

## 1. Configure Your Project

**Create a Project:** Start a new React project using a tool like Create React App or Vite.

```bash
npx create-react-app finance-flow
# or
npm create vite@latest finance-flow -- --template react-ts
```

**Install Dependencies:** Navigate into your new project directory and install the necessary dependencies. This app uses `lucide-react` for icons, `recharts` for charts, and `tailwindcss` for styling.

```bash
cd finance-flow
npm install lucide-react recharts tailwindcss
```

**Configure Tailwind CSS:** If you're using Create React App or Vite, follow the official Tailwind CSS documentation to configure it for your project.

**Place the Code:** Replace the content of your main application file (e.g., `src/App.tsx`) with the code from this project's `src/App.tsx`. Place the `components` directory inside your `src` directory.

## 2. Set Up the Gemini API Key

The application requires a Google Gemini API key to power its AI features.

**Get Your Key:** Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

**Create a `.env` File:** In the root directory of your project, create a file named `.env`.

**Add Your API Key:** Inside the `.env` file, add your API key like this:

```
REACT_APP_GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

The application is already configured to read the API key from this environment variable, so no code changes are necessary.

## 3. Run the Application

Once everything is set up, you can run the application:

```bash
npm start   # For Create React App
# or
npm run dev # For Vite
```

Open your browser to the specified port (usually `http://localhost:3000` or `http://localhost:5173`).
