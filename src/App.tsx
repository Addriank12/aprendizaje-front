import { useState } from "react";
import "./App.css";
import Productos from "./pages/Productos";
import Chat from "./pages/Chat";

function App() {
  const [currentView, setCurrentView] = useState<"productos" | "chat">(
    "productos"
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Sistema de Gestión de Inventarios
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView("productos")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === "productos"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📦 Productos
              </button>
              <button
                onClick={() => setCurrentView("chat")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === "chat"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                💬 Chat
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-4">
        {currentView === "productos" ? <Productos /> : <Chat />}
      </div>
    </div>
  );
}

export default App;
