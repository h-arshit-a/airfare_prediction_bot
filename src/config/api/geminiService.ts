import {
  API_KEYS,
  API_BASE_URLS,
  API_ENDPOINTS,
  IS_DEV,
  ENABLE_MOCKS,
} from "./apiKeys";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string;
  private responseCache: Map<string, string> = new Map();
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private useMocks: boolean;

  private constructor() {
    // Get API key from environment variables
    this.apiKey = API_KEYS.GEMINI;
    this.useMocks = ENABLE_MOCKS || (!this.apiKey && IS_DEV);

    if (!this.apiKey) {
      console.warn(
        "No Gemini API key found in environment variables. Using mock responses."
      );
      this.useMocks = true;
    }

    console.log(
      `GeminiService initialized with ${
        this.useMocks ? "MOCK" : "REAL"
      } responses`
    );
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      // Always use mocks if enabled or in development without API key
      if (this.useMocks) {
        console.log(
          "Using mock response because useMocks is true. API Key:",
          this.apiKey ? "Present" : "Missing"
        );
        return this.getMockResponse(prompt);
      }

      // Check cache for recent identical queries
      const cachedResponse = this.responseCache.get(prompt);
      const now = Date.now();
      if (cachedResponse && now - this.lastRequestTime < 5000) {
        console.log("Using cached response for recent query");
        return cachedResponse;
      }

      // Basic rate limiting
      if (now - this.lastRequestTime < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.lastRequestTime = Date.now();
      this.requestCount++;

      console.log(
        `Making Gemini API request #${
          this.requestCount
        } with key: ${this.apiKey.substring(0, 5)}...`
      );

      try {
        const url = `${API_BASE_URLS.GEMINI}?key=${this.apiKey}`;
        console.log("API URL:", url);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
              stopSequences: ["\n\n", "END"],
              candidateCount: 1,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        });

        console.log("API Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error (${response.status}):`, errorText);

          if (response.status === 401) {
            console.error("Authentication failed. Invalid API key.");
            return "I'm having trouble accessing my language model. Please check that your Gemini API key is valid and has been set correctly.";
          }

          // Fall back to mock responses if API call fails
          console.log("Falling back to mock response due to API error");
          return this.getMockResponse(prompt);
        }

        const data: GeminiResponse = await response.json();
        console.log("API Response data:", data);

        if (
          !data.candidates ||
          data.candidates.length === 0 ||
          !data.candidates[0].content ||
          !data.candidates[0].content.parts ||
          data.candidates[0].content.parts.length === 0
        ) {
          console.error("Invalid response structure from API");
          return this.getMockResponse(prompt);
        }

        const generatedText =
          data.candidates[0].content.parts[0].text?.trim() || "";

        if (!generatedText) {
          console.error("Empty response from API");
          return this.getMockResponse(prompt);
        }

        this.responseCache.set(prompt, generatedText);
        setTimeout(() => this.responseCache.delete(prompt), 5000);

        return generatedText;
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        return this.getMockResponse(prompt);
      }
    } catch (error) {
      console.error("Error in generateContent:", error);
      return this.getMockResponse(prompt);
    }
  }

  private getMockResponse(prompt: string): string {
    const lowercasePrompt = prompt.toLowerCase();

    // Greeting detection
    if (lowercasePrompt.includes("hello") || lowercasePrompt.includes("hi")) {
      return "Hello! I'm Flight Friend, your AI travel assistant. How can I help you plan your travels today?";
    }

    // Thank you detection
    if (
      lowercasePrompt.includes("thank") ||
      lowercasePrompt.includes("thanks") ||
      lowercasePrompt.includes("thx") ||
      lowercasePrompt.includes("bye")
    ) {
      const thankYouResponses = [
        "You're welcome! I wish you a happy and safe journey! ✈️",
        "Glad I could help! Have a wonderful and safe trip! 🌟",
        "You're welcome! Wishing you smooth skies and a fantastic journey! 🛫",
        "Anytime! I hope you have a safe and enjoyable flight! 🛬",
        "You're welcome! May your journey be as smooth as possible! ✈️",
        "Glad to help! Wishing you a safe and pleasant travel experience! 🌍",
      ];
      return thankYouResponses[
        Math.floor(Math.random() * thankYouResponses.length)
      ];
    }

    // Flight search query detection
    if (
      lowercasePrompt.includes("flight") ||
      lowercasePrompt.includes("from") ||
      lowercasePrompt.includes("to") ||
      lowercasePrompt.includes("travel") ||
      lowercasePrompt.includes("book")
    ) {
      return "I'd be happy to help you find flights! Just tell me your departure city, destination, and when you'd like to travel.";
    }

    // Airline information
    if (
      lowercasePrompt.includes("airline") ||
      lowercasePrompt.includes("indigo") ||
      lowercasePrompt.includes("air india") ||
      lowercasePrompt.includes("vistara")
    ) {
      return "That airline operates flights on many routes across India. Their fares depend on the route, time of booking, and season. Would you like me to help you search for flights with them?";
    }

    // Travel tips
    if (
      lowercasePrompt.includes("tip") ||
      lowercasePrompt.includes("advice") ||
      lowercasePrompt.includes("recommend") ||
      lowercasePrompt.includes("suggest")
    ) {
      const tips = [
        "For domestic flights in India, try booking 4-6 weeks in advance for the best deals.",
        "Weekday flights (especially Tuesday and Wednesday) are typically cheaper than weekend flights.",
        "Consider early morning or late night flights for better prices.",
        "Setting up price alerts can help you catch sudden flight deals.",
        "Being flexible with your travel dates can often save you money.",
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }

    // Questions about prices
    if (
      lowercasePrompt.includes("price") ||
      lowercasePrompt.includes("cost") ||
      lowercasePrompt.includes("cheap") ||
      lowercasePrompt.includes("expensive")
    ) {
      return "Flight prices vary based on several factors including how far in advance you book, the season, day of the week, and demand. I can help you find the best deals if you let me know your travel plans.";
    }

    // Questions about locations
    if (
      lowercasePrompt.includes("where") ||
      lowercasePrompt.includes("place") ||
      lowercasePrompt.includes("destination") ||
      lowercasePrompt.includes("city")
    ) {
      return "India has many popular travel destinations including Delhi, Mumbai, Bangalore, Goa, Jaipur, and Kerala. Where are you interested in traveling to?";
    }

    // Default varied responses
    const defaultResponses = [
      "I'm your flight assistant, and I can help you find flights, compare prices, and provide travel tips. What would you like to know?",
      "I can help you search for flights, find the best deals, and provide information about airlines. What are your travel plans?",
      "Looking for flights? I can help you find the best options for your travel needs. Just let me know your departure, destination, and dates.",
      "I'm here to make your travel planning easier. Ask me about flights, destinations, or travel tips!",
      "How can I assist with your travel plans today? I can help you find flights, compare prices, or answer travel questions.",
    ];

    return defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
  }

  clearCache(): void {
    this.responseCache.clear();
    console.log("Cache cleared");
  }
}
