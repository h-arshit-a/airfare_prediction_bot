// API Keys and Configurations
export const API_KEYS = {
  GEMINI: import.meta.env.VITE_GEMINI_API_KEY || "",
  AVIATIONSTACK: import.meta.env.VITE_AVIATIONSTACK_API_KEY || "",
};

// Development mode detection
export const IS_DEV = import.meta.env.DEV || false;
export const ENABLE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === "true";

// Log environment configuration
console.log("Environment Configuration:", {
  IS_DEV,
  ENABLE_MOCKS,
  GEMINI_API_KEY: API_KEYS.GEMINI ? "Present" : "Missing",
  AVIATIONSTACK_API_KEY: API_KEYS.AVIATIONSTACK ? "Present" : "Missing",
  VITE_ENABLE_MOCKS: import.meta.env.VITE_ENABLE_MOCKS,
});

// API Base URLs
export const API_BASE_URLS = {
  GEMINI:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  AVIATIONSTACK: "http://api.aviationstack.com/v1",
  LOCAL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
};

// API Endpoints
export const API_ENDPOINTS = {
  GEMINI: {
    GENERATE_CONTENT: "",
  },
  AVIATIONSTACK: {
    FLIGHTS: "/flights",
    AIRPORTS: "/airports",
    AIRLINES: "/airlines",
  },
};
