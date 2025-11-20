import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "OpenCode Full-Stack App" },
    { name: "description", content: "Welcome to OpenCode with React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OpenCode Full-Stack Application
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Development with React Router & Hono
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* AI Chat Card */}
          <a
            href="/chat"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-3xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              AI Chat
            </h2>
            <p className="text-gray-600">
              Chat with OpenCode AI assistant to get help with code, architecture, and more.
            </p>
            <div className="mt-4 text-blue-600 font-medium">
              Start Chatting →
            </div>
          </a>

          {/* Tasks Card */}
          <a
            href="/tasks"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-3xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tasks
            </h2>
            <p className="text-gray-600">
              Manage your tasks with a full-featured API backend powered by Hono.
            </p>
            <div className="mt-4 text-blue-600 font-medium">
              View Tasks →
            </div>
          </a>

          {/* API Docs Card */}
          <a
            href="http://localhost:9999/reference"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-3xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              API Documentation
            </h2>
            <p className="text-gray-600">
              Interactive OpenAPI documentation for the Hono backend API.
            </p>
            <div className="mt-4 text-blue-600 font-medium">
              View Docs →
            </div>
          </a>
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚀 Tech Stack
          </h3>
          <ul className="space-y-1 text-blue-800">
            <li>• OpenCode AI - AI-powered code assistance</li>
            <li>• React Router 7 - Modern React framework with SSR</li>
            <li>• Hono - Ultrafast web framework with OpenAPI</li>
            <li>• PostgreSQL 16 - Production database</li>
            <li>• TailwindCSS 4 - Utility-first CSS</li>
            <li>• TypeScript - End-to-end type safety</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
