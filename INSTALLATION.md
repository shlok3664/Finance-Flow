# 🛠️ Setup and Installation

This project is a React application built with Vite, Tailwind CSS, and the Google Gemini API.

## 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 2. Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd finance-flow
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    You can get your key from [Google AI Studio](https://aistudio.google.com/).

## 3. Running the Application

- **Development server**:
  ```bash
  npm run dev
  ```
- **Build for production**:
  ```bash
  npm run build
  ```
- **Preview production build**:
  ```bash
  npm run preview
  ```

## 4. Project Structure

- `src/components/`: Modular UI components.
- `src/utils/`: Constants and helper functions.
- `src/types/`: TypeScript interface definitions.
- `src/App.tsx`: Main application logic.
