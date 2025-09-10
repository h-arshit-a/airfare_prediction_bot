import { v4 as uuidv4 } from "uuid";
import { Message } from "@/components/ChatMessage";
import { Flight, FlightSearchParams, searchFlights } from "./flightService";
import { format } from "date-fns";
import { GeminiService } from "../config/api/geminiService";

// For more conversational and personalized responses
const conversationContext = {
  lastTopic: "",
  userPreferences: {
    preferredAirlines: [] as string[],
    pricePreference: "", // 'budget', 'value', 'premium'
    travelDate: null as Date | null,
  },
  // Track conversation to avoid repetition
  mentionedCities: new Set<string>(),
  mentionedAirlines: new Set<string>(),
  // Track if user is first-time visitor
  isFirstTimeUser: true,
  // Track if query questions have been shown
  queryQuestionsShown: false,
};

// Function to generate responses using Gemini API for more varied replies
const getGeminiResponse = async (
  userMessage: string,
  context: string
): Promise<string | null> => {
  try {
    const geminiService = GeminiService.getInstance();
    
    // Enhanced prompt for more human-like responses
    const prompt = `
You are Flight Friend, a warm, friendly, and highly helpful flight assistant. Your goal is to make finding flight information easy and pleasant. 
Respond conversationally to the user's message about flights, travel, or related topics. Avoid overly robotic language. Use contractions where appropriate (like "I'm", "you're", "it's").
Keep your responses helpful and relatively concise, but feel free to add a touch of personality.

Current context of our chat: ${context}

User's message: "${userMessage}"

Your friendly response:
`;

    console.log("Sending enhanced prompt to Gemini API");
    const response = await geminiService.generateContent(prompt);
    
    if (!response || response.trim() === "") {
      console.warn("Received empty response from Gemini API");
      return null;
    }
    
    console.log("Received valid response from Gemini API");
    return response.trim(); // Trim whitespace
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    return null;
  }
};

// Function to generate chatbot responses
export const generateChatbotResponse = async (
  userMessage: string,
  searchParams?: FlightSearchParams,
  flights?: Flight[]
): Promise<string> => {
  console.log(
    "Generating chatbot response for:",
    userMessage || "flight results"
  );
  
  // Simulate API delay (can be removed in production)
  await new Promise((resolve) => setTimeout(resolve, 300)); // Slightly reduced delay

  // Function to format price to INR
  const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

  // --- Check if the message is unrelated to flights (non-flight queries) ---
  // This needs to be done early, before any other processing
  const flightRelatedTerms = [
    'flight', 'fly', 'travel', 'airline', 'plane', 'trip', 'route', 'journey', 'ticket',
    'departure', 'arrival', 'airport', 'book', 'fare', 'price', 'schedule', 'timing',
    'layover', 'direct', 'nonstop', 'connecting', 'one-way', 'round-trip', 'search',
    'destination', 'baggage', 'passenger', 'boarding', 'landing', 'domestic', 'international',
    'economy', 'business', 'first class', 'cheap', 'expensive', 'delay', 'cancel',
    'indigo', 'air india', 'spicejet', 'vistara', 'airasia', 'goair', 'lufthansa', 'delta',
    'etihad', 'emirates', 'jet', 'kingfisher', 'qatar', 'thai', 'singapore',
  ];
  
  const commonCities = [
    "delhi",
    "mumbai",
    "bangalore",
    "kolkata",
    "chennai",
    "hyderabad",
    "pune",
    "ahmedabad",
    "jaipur",
    "ranchi",
    "patna",
    "lucknow",
    "goa",
    "kochi",
    "guwahati",
    "bhubaneswar",
  ];
  
  // Only perform the check if we have a user message to analyze
  // Skip the check for direct flight result displays (when no user message is present)
  if (userMessage && userMessage.trim() !== '') {
    const containsFlightRelatedTerms = flightRelatedTerms.some(term => 
      userMessage.toLowerCase().includes(term)
    );
    
    // Also check if the message mentions common Indian cities (likely for flight routes)
    const containsCommonCities = commonCities.some(city =>
      userMessage.toLowerCase().includes(city)
    );
    
    // Allow basic conversational responses (greetings, thanks)
    const isBasicConversation = userMessage.toLowerCase().match(/^(hi|hello|hey|greetings)\b/) ||
                              userMessage.toLowerCase().match(/\b(thank|thanks|thx)\b/);
    
    if (!containsFlightRelatedTerms && !containsCommonCities && !isBasicConversation) {
      // Message is not related to flights, greetings, or thank you messages
      const errorResponses = [
        "I'm sorry, but I can only provide assistance with flight-related queries. Please ask me about finding flights, checking prices, or sorting flight options by distance and price.",
        "I apologize, but I'm designed specifically to help with flight information. Could you ask me about flights instead?",
        "I can't provide information about that topic. I'm specialized in helping you find and sort flights by distance and price. Please ask me about flights instead.",
        "Sorry, but that's outside my area of expertise. I can only help with flight-related questions. Feel free to ask me about finding flights or comparing flight options!",
      ];
      return errorResponses[Math.floor(Math.random() * errorResponses.length)];
    }
  }

  // --- Build Conversation Context ---
  let currentContext = "User initiated interaction.";
  if (conversationContext.lastTopic) {
    currentContext += ` Last topic discussed: ${conversationContext.lastTopic}.`;
  }
  if (searchParams) {
    currentContext += ` User searched for flights from ${
      searchParams.source
    } to ${searchParams.destination} on ${searchParams.date.toDateString()}.`;
    conversationContext.mentionedCities.add(searchParams.source);
    conversationContext.mentionedCities.add(searchParams.destination);
    conversationContext.userPreferences.travelDate = searchParams.date;
  }
  
  // Detect cities and airlines mentioned
  commonCities.forEach((city) => {
    if (userMessage && userMessage.toLowerCase().includes(city)) {
      conversationContext.mentionedCities.add(city);
    }
  });
  const commonAirlines = [
    "indigo",
    "air india",
    "vistara",
    "spicejet",
    "goair",
    "airasia",
  ];
  commonAirlines.forEach((airline) => {
    if (userMessage && userMessage.toLowerCase().includes(airline)) {
      conversationContext.mentionedAirlines.add(airline);
      currentContext += ` User mentioned ${airline}.`;
    }
  });

  if (
    userMessage && (
    userMessage.toLowerCase().includes("cheap") ||
    userMessage.toLowerCase().includes("budget")
    )
  ) {
    conversationContext.userPreferences.pricePreference = "budget";
    currentContext += " User seems budget-conscious.";
  } else if (
    userMessage && (
    userMessage.toLowerCase().includes("premium") ||
    userMessage.toLowerCase().includes("business")
    )
  ) {
    conversationContext.userPreferences.pricePreference = "premium";
    currentContext += " User might prefer premium options.";
  }

  currentContext += ` Known mentioned cities: ${
    Array.from(conversationContext.mentionedCities).join(", ") || "None"
  }.`;
  currentContext += ` Known mentioned airlines: ${
    Array.from(conversationContext.mentionedAirlines).join(", ") || "None"
  }.`;

  // --- Handle Follow-up Responses for Partial Flight Searches ---
  if (userMessage && (
      conversationContext.lastTopic === "asking_for_source" || 
      conversationContext.lastTopic === "asking_for_destination" || 
      conversationContext.lastTopic === "asking_for_locations")) {
    
    // Extract city names from the message
    const cityMap: { [key: string]: { code: string; fullName: string } } = {
      delhi: { code: "DEL", fullName: "Delhi" },
      "new delhi": { code: "DEL", fullName: "Delhi" },
      mumbai: { code: "BOM", fullName: "Mumbai" },
      bombay: { code: "BOM", fullName: "Mumbai" },
      bangalore: { code: "BLR", fullName: "Bangalore" },
      bengaluru: { code: "BLR", fullName: "Bangalore" },
      hyderabad: { code: "HYD", fullName: "Hyderabad" },
      chennai: { code: "MAA", fullName: "Chennai" },
      madras: { code: "MAA", fullName: "Chennai" },
      kolkata: { code: "CCU", fullName: "Kolkata" },
      calcutta: { code: "CCU", fullName: "Kolkata" },
      ahmedabad: { code: "AMD", fullName: "Ahmedabad" },
      pune: { code: "PNQ", fullName: "Pune" },
      jaipur: { code: "JAI", fullName: "Jaipur" },
      ranchi: { code: "IXR", fullName: "Ranchi" },
      patna: { code: "PAT", fullName: "Patna" },
      lucknow: { code: "LKO", fullName: "Lucknow" },
      guwahati: { code: "GAU", fullName: "Guwahati" },
      bhubaneswar: { code: "BBI", fullName: "Bhubaneswar" },
      goa: { code: "GOI", fullName: "Goa (Mopa/Dabolim)" },
      varanasi: { code: "VNS", fullName: "Varanasi" },
      srinagar: { code: "SXR", fullName: "Srinagar" },
      coimbatore: { code: "CJB", fullName: "Coimbatore" },
      trivandrum: { code: "TRV", fullName: "Trivandrum" },
      thiruvananthapuram: { code: "TRV", fullName: "Trivandrum" },
      indore: { code: "IDR", fullName: "Indore" },
      nagpur: { code: "NAG", fullName: "Nagpur" },
      chandigarh: { code: "IXC", fullName: "Chandigarh" },
      amritsar: { code: "ATQ", fullName: "Amritsar" },
      raipur: { code: "RPR", fullName: "Raipur" },
      visakhapatnam: { code: "VTZ", fullName: "Visakhapatnam" },
      vizag: { code: "VTZ", fullName: "Visakhapatnam" },
      bhopal: { code: "BHO", fullName: "Bhopal" },
      udaipur: { code: "UDR", fullName: "Udaipur" },
      kochi: { code: "COK", fullName: "Kochi" },
      cochin: { code: "COK", fullName: "Kochi" },
    };

    const cityPattern = Object.keys(cityMap).join("|");
    const citiesInMessage = userMessage
      .toLowerCase()
      .match(new RegExp(`\\b(${cityPattern})\\b`, "gi"));
    
    if (!citiesInMessage || citiesInMessage.length === 0) {
      // No valid city found in message
      return "I didn't recognize a valid city in your message. Could you please specify a major city in India? For example: Delhi, Mumbai, Bangalore, etc.";
    }
    
    // For simplicity, use the first city mentioned
    const city = citiesInMessage[0].toLowerCase();
    const cityInfo = cityMap[city];
    
    // If we're asking for the source
    if (conversationContext.lastTopic === "asking_for_source") {
      // We already have destination stored in the context
      const destination = Array.from(conversationContext.mentionedCities).find(
        city => city !== citiesInMessage[0].toLowerCase()
      );
      
      if (!destination) {
        return "I seem to have lost track of your destination. Can you please tell me both the departure and destination cities?";
      }
      
      const sourceInfo = cityInfo;
      const destInfo = cityMap[destination as keyof typeof cityMap] || { 
        code: destination.slice(0, 3).toUpperCase(), 
        fullName: destination.charAt(0).toUpperCase() + destination.slice(1) 
      };
      
      // Now we have both source and destination, generate the flight search
      const flightDate = new Date();
      flightDate.setDate(flightDate.getDate() + 1); // Default to tomorrow
      const isoDateString = flightDate.toISOString();
      
      conversationContext.lastTopic = "flight_search_initiated";
      
      return `Great! Searching for flights from ${sourceInfo.fullName} (${
        sourceInfo.code
      }) to ${destInfo.fullName} (${
        destInfo.code
      }) for tomorrow. One moment... ✈️\n\n<flight-search source="${sourceInfo.code}" destination="${destInfo.code}" date="${isoDateString}" />`;
    } 
    // If we're asking for the destination
    else if (conversationContext.lastTopic === "asking_for_destination") {
      // We already have source stored in the context
      const source = Array.from(conversationContext.mentionedCities).find(
        city => city !== citiesInMessage[0].toLowerCase()
      );
      
      if (!source) {
        return "I seem to have lost track of your departure city. Can you please tell me both the departure and destination cities?";
      }
      
      const sourceInfo = cityMap[source as string] || { 
        code: source.slice(0, 3).toUpperCase(), 
        fullName: source.charAt(0).toUpperCase() + source.slice(1) 
      };
      const destInfo = cityInfo;
      
      // Now we have both source and destination, generate the flight search
      const flightDate = new Date();
      flightDate.setDate(flightDate.getDate() + 1); // Default to tomorrow
      const isoDateString = flightDate.toISOString();
      
      conversationContext.lastTopic = "flight_search_initiated";
      
      return `Perfect! Searching for flights from ${sourceInfo.fullName} (${
        sourceInfo.code
      }) to ${destInfo.fullName} (${
        destInfo.code
      }) for tomorrow. One moment... ✈️\n\n<flight-search source="${sourceInfo.code}" destination="${destInfo.code}" date="${isoDateString}" />`;
    }
    // If we're asking for both locations
    else if (conversationContext.lastTopic === "asking_for_locations") {
      // We need to extract both cities if available, or ask for the missing one
      if (citiesInMessage.length >= 2) {
        // Have multiple cities, use first two distinct ones
        const uniqueCities = [...new Set(citiesInMessage.map(c => c.toLowerCase()))];
        const source = uniqueCities[0];
        const destination = uniqueCities[1];
        
        const sourceInfo = cityMap[source];
        const destInfo = cityMap[destination];
        
        // Now we have both source and destination, generate the flight search
        const flightDate = new Date();
        flightDate.setDate(flightDate.getDate() + 1); // Default to tomorrow
        const isoDateString = flightDate.toISOString();
        
        conversationContext.lastTopic = "flight_search_initiated";
        
        return `Great! Searching for flights from ${sourceInfo.fullName} (${
          sourceInfo.code
        }) to ${destInfo.fullName} (${
          destInfo.code
        }) for tomorrow. One moment... ✈️\n\n<flight-search source="${sourceInfo.code}" destination="${destInfo.code}" date="${isoDateString}" />`;
      } else {
        // Only have one city, need to ask for the other one
        // Assume we got the source, ask for destination for simplicity
        const source = citiesInMessage[0].toLowerCase();
        conversationContext.mentionedCities.add(source);
        conversationContext.lastTopic = "asking_for_destination";
        
        return `Got it, you're departing from ${cityInfo.fullName}. Where would you like to fly to?`;
      }
    }
  }

  // --- Handle Greetings ---
  if (userMessage.toLowerCase().match(/^(hi|hello|hey|greetings)\b/)) {
    console.log("Detected greeting, attempting Gemini response first.");
    const geminiResponse = await getGeminiResponse(userMessage, currentContext);
    if (geminiResponse) return geminiResponse;
    
    console.log("Falling back to friendly hardcoded greeting");
    const greetings = [
      "Hey there! 👋 I'm Flight Friend. Ready to find some amazing flight deals for you?",
      "Hello! Your friendly flight assistant, Flight Friend, reporting for duty! How can I help with your travel plans today?",
      "Hi! I'm Flight Friend. Need help searching for flights or need some travel tips? Just ask!",
      "Welcome! I'm Flight Friend, here to make your flight planning a breeze. What trip are you dreaming of?",
    ];
    conversationContext.lastTopic = "greeting";
    // Mark user as no longer first-time after greeting
    conversationContext.isFirstTimeUser = false;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // --- Handle Thank You Messages ---
  if (userMessage.toLowerCase().match(/\b(thank|thanks|thx)\b/)) {
    console.log("Detected thank you message, responding with travel wish");
    const thankYouResponses = [
      "You're welcome! I wish you a happy and safe journey! ✈️",
      "Glad I could help! Have a wonderful and safe trip! 🌟",
      "You're welcome! Wishing you smooth skies and a fantastic journey! 🛫",
      "Anytime! I hope you have a safe and enjoyable flight! 🛬",
      "You're welcome! May your journey be as smooth as possible! ✈️",
      "Glad to help! Wishing you a safe and pleasant travel experience! 🌍",
    ];
    conversationContext.lastTopic = "thank_you";
    return thankYouResponses[
      Math.floor(Math.random() * thankYouResponses.length)
    ];
  }

  // --- Handle Flight Search Queries ---
  const searchKeywords = [
    "find",
    "search",
    "look for",
    "flight",
    "from",
    "show me",
    "book",
    "travel",
    "trip",
    "ticket",
  ];
  if (
    searchKeywords.some((keyword) =>
      userMessage.toLowerCase().includes(keyword)
    )
  ) {
    console.log("Potential flight search query detected:", userMessage);

    // Improved pattern matching (keeping existing logic but refining extraction)
    let source: string | undefined, destination: string | undefined;
    let sourceMatch = false, destMatch = false;

    // Pattern 1: Standard "from X to Y"
    const fromToRegex =
      /(?:from|departing|leaving)\s+([A-Za-z\s]+?)\s+(?:to|towards|for)\s+([A-Za-z\s]+?)(?:$|\s+on|\s+around|\s+near)/i;
    const fromToMatch = userMessage.match(fromToRegex);
    if (fromToMatch) {
      source = fromToMatch[1].trim();
      destination = fromToMatch[2].trim();
      console.log(`Found 'from X to Y' pattern: ${source} -> ${destination}`);
      sourceMatch = destMatch = true;
    } else {
      // Pattern 2: Direct "X to Y"
      const directCitiesRegex =
        /\b([A-Za-z\s]{2,})\s+(?:to|and|->|—|–|-)\s+([A-Za-z\s]{2,})\b/i;
      const directMatch = userMessage.match(directCitiesRegex);
      if (directMatch) {
        source = directMatch[1].trim();
        destination = directMatch[2].trim();
        console.log(
          `Found direct 'X to Y' pattern: ${source} -> ${destination}`
        );
        sourceMatch = destMatch = true;
      } else {
        // Pattern 3: Simple two city extraction (more robust)
        const cityMap: { [key: string]: string } = {
          delhi: "DEL",
          mumbai: "BOM",
          bangalore: "BLR",
          bengaluru: "BLR",
          hyderabad: "HYD",
          chennai: "MAA",
          kolkata: "CCU",
          ahmedabad: "AMD",
          pune: "PNQ",
          jaipur: "JAI",
          ranchi: "IXR",
          patna: "PAT",
          lucknow: "LKO",
          guwahati: "GAU",
          bhubaneswar: "BBI",
          goa: "GOI",
          varanasi: "VNS",
          srinagar: "SXR",
          coimbatore: "CJB",
          trivandrum: "TRV",
          thiruvananthapuram: "TRV",
          indore: "IDR",
          nagpur: "NAG",
          chandigarh: "IXC",
          amritsar: "ATQ",
          raipur: "RPR",
          visakhapatnam: "VTZ",
          vizag: "VTZ",
          bhopal: "BHO",
          udaipur: "UDR",
          kochi: "COK",
          cochin: "COK",
        };
        const cityPattern = Object.keys(cityMap).join("|");
        const citiesInMessage = userMessage
          .toLowerCase()
          .match(new RegExp(`\\b(${cityPattern})\\b`, "gi"));

        if (citiesInMessage && citiesInMessage.length >= 2) {
          // Use the first two distinct found cities
          const uniqueCities = [...new Set(citiesInMessage)];
          if (uniqueCities.length >= 2) {
            source = uniqueCities[0];
            destination = uniqueCities[1];
            console.log(
              `Found two distinct cities: ${source} -> ${destination}`
            );
            sourceMatch = destMatch = true;
          }
        } else if (citiesInMessage && citiesInMessage.length === 1) {
          // Only one city detected - need to determine if it's source or destination
          const singleCity = citiesInMessage[0];
          
          const fromIndicators = ["from", "departing", "leaving", "starting"];
          const toIndicators = ["to", "towards", "for", "arriving", "destination", "bound"];
          
          let isSourceCity = false;
          let isDestCity = false;
          
          // Try to determine if the city is being mentioned as source or destination
          for (const indicator of fromIndicators) {
            if (userMessage.toLowerCase().includes(`${indicator} ${singleCity}`)) {
              isSourceCity = true;
              break;
            }
          }
          
          for (const indicator of toIndicators) {
            if (userMessage.toLowerCase().includes(`${indicator} ${singleCity}`)) {
              isDestCity = true;
              break;
            }
          }
          
          // If we can't tell, default to asking for destination
          if (isSourceCity && !isDestCity) {
            source = singleCity;
            sourceMatch = true;
          } else {
            destination = singleCity;
            destMatch = true;
          }
          
          console.log(`Found only one city: ${singleCity}, source: ${sourceMatch}, dest: ${destMatch}`);
        }
      }
    }

    // --- Date Extraction --- (Keeping existing logic, potentially enhance later if needed)
    let flightDate = new Date();
    flightDate.setDate(flightDate.getDate() + 1); // Default to tomorrow

    // Combined regex for various date formats and keywords
    const dateKeywords = ["on", "for", "around", "near", "date", "dated"];
    const datePattern = `(?:${dateKeywords.join(
      "|"
    )})\\s+(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|[0-1]?\\d)(?:\\s+\\d{4})?|\\d{1,2}[-/]\\d{1,2}(?:[-/]\\d{2,4})?|tomorrow|today|next\\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))`;
    const simpleDatePattern = `\\b(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?|\\d{1,2}[-/]\\d{1,2}(?:[-/]\\d{2,4})?|tomorrow|today|next\\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\\b`;

    const dateMatch =
      userMessage.match(new RegExp(datePattern, "i")) ||
      userMessage.match(new RegExp(simpleDatePattern, "i"));

    if (dateMatch) {
      const dateStr = dateMatch[1].toLowerCase();
      console.log("Found date string:", dateStr);
      try {
        if (dateStr === "tomorrow") {
          // Already default
        } else if (dateStr === "today") {
          flightDate = new Date();
        } else if (dateStr.startsWith("next")) {
          // Basic handling for "next week/day" - set to 7 days or specific day next week
          const dayOfWeek = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const targetDay = dayOfWeek.indexOf(dateStr.split(" ")[1]);
          if (targetDay !== -1) {
            const currentDay = flightDate.getDay();
            const daysToAdd = ((targetDay - currentDay + 7) % 7) + 7; // Add days to get to next instance
            flightDate.setDate(flightDate.getDate() + daysToAdd);
          } else {
            // next week
            flightDate.setDate(flightDate.getDate() + 7);
          }
        } else {
          // Use a robust date parser library in production (e.g., date-fns parse)
          // Simple parsing for now:
          let parsedDate = new Date(dateStr.replace(/(st|nd|rd|th)/, "")); // Remove ordinals for basic parsing
          if (isNaN(parsedDate.getTime())) {
            // Try MM/DD or DD/MM formats - ambiguous, assumes MM/DD first
            const parts = dateStr.match(
              /(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/
            );
            if (parts) {
              const year = parts[3]
                ? parts[3].length === 2
                  ? parseInt("20" + parts[3])
                  : parseInt(parts[3])
                : new Date().getFullYear();
              parsedDate = new Date(
                year,
                parseInt(parts[1]) - 1,
                parseInt(parts[2])
              ); // Assume MM/DD first
              // Rudimentary check if day > 12, might be DD/MM
              if (isNaN(parsedDate.getTime()) || parseInt(parts[1]) > 12) {
                parsedDate = new Date(
                  year,
                  parseInt(parts[2]) - 1,
                  parseInt(parts[1])
                ); // Try DD/MM
              }
            }
          }
          if (!isNaN(parsedDate.getTime())) {
            // Ensure the parsed date isn't in the past relative to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (parsedDate >= today) {
              flightDate = parsedDate;
            } else {
              // If parsed date is in the past, maybe it's for next year?
              parsedDate.setFullYear(parsedDate.getFullYear() + 1);
              if (parsedDate >= today) {
                flightDate = parsedDate;
              } else {
                console.warn(
                  "Parsed date is still in the past, defaulting to tomorrow."
                );
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse date, defaulting to tomorrow", e);
      }
    }
    console.log(`Using flight date: ${flightDate.toDateString()}`);

    // --- Handle Partial Flight Search Information ---
    // Check if we need to ask for more information before starting search
    if (!sourceMatch && !destMatch) {
      conversationContext.lastTopic = "asking_for_locations";
      return "I'd be happy to find flights for you! Could you please let me know both your departure and destination cities? For example: 'Delhi to Mumbai'";
    } else if (!sourceMatch) {
      conversationContext.lastTopic = "asking_for_source";
      return `I can help you find flights to ${destination}! Could you please tell me which city you'll be departing from?`;
    } else if (!destMatch) {
      conversationContext.lastTopic = "asking_for_destination";
      return `I can help you find flights from ${source}! Could you please tell me which city you'd like to fly to?`;
    }

    // --- Continue with Validate Cities and Generate Search Command ---
    if (source && destination) {
      console.log(
        `Attempting search for: ${source} -> ${destination} on ${flightDate.toDateString()}`
      );

      // Simplified City Validation/Code Mapping (using the map defined earlier)
      const cityMap: { [key: string]: { code: string; fullName: string } } = {
        delhi: { code: "DEL", fullName: "Delhi" },
        "new delhi": { code: "DEL", fullName: "Delhi" },
        mumbai: { code: "BOM", fullName: "Mumbai" },
        bombay: { code: "BOM", fullName: "Mumbai" },
        bangalore: { code: "BLR", fullName: "Bangalore" },
        bengaluru: { code: "BLR", fullName: "Bangalore" },
        hyderabad: { code: "HYD", fullName: "Hyderabad" },
        chennai: { code: "MAA", fullName: "Chennai" },
        madras: { code: "MAA", fullName: "Chennai" },
        kolkata: { code: "CCU", fullName: "Kolkata" },
        calcutta: { code: "CCU", fullName: "Kolkata" },
        ahmedabad: { code: "AMD", fullName: "Ahmedabad" },
        pune: { code: "PNQ", fullName: "Pune" },
        jaipur: { code: "JAI", fullName: "Jaipur" },
        ranchi: { code: "IXR", fullName: "Ranchi" },
        patna: { code: "PAT", fullName: "Patna" },
        lucknow: { code: "LKO", fullName: "Lucknow" },
        guwahati: { code: "GAU", fullName: "Guwahati" },
        bhubaneswar: { code: "BBI", fullName: "Bhubaneswar" },
        goa: { code: "GOI", fullName: "Goa (Mopa/Dabolim)" }, // Specify both airports or handle later
        varanasi: { code: "VNS", fullName: "Varanasi" },
        srinagar: { code: "SXR", fullName: "Srinagar" },
        coimbatore: { code: "CJB", fullName: "Coimbatore" },
        trivandrum: { code: "TRV", fullName: "Trivandrum" },
        thiruvananthapuram: { code: "TRV", fullName: "Trivandrum" },
        indore: { code: "IDR", fullName: "Indore" },
        nagpur: { code: "NAG", fullName: "Nagpur" },
        chandigarh: { code: "IXC", fullName: "Chandigarh" },
        amritsar: { code: "ATQ", fullName: "Amritsar" },
        raipur: { code: "RPR", fullName: "Raipur" },
        visakhapatnam: { code: "VTZ", fullName: "Visakhapatnam" },
        vizag: { code: "VTZ", fullName: "Visakhapatnam" },
        bhopal: { code: "BHO", fullName: "Bhopal" },
        udaipur: { code: "UDR", fullName: "Udaipur" },
        kochi: { code: "COK", fullName: "Kochi" },
        cochin: { code: "COK", fullName: "Kochi" },
        // Add more cities/codes as needed
      };

      const getCityInfo = (name: string) => {
        const normalized = name.toLowerCase().trim();
        return (
          cityMap[normalized] || {
            code: normalized.slice(0, 3).toUpperCase(), // Fallback code
            fullName:
              name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), // Fallback name
          }
        );
      };

      const sourceInfo = getCityInfo(source);
      const destInfo = getCityInfo(destination);

      if (sourceInfo.code === destInfo.code) {
        return "It looks like the departure and destination cities are the same. Could you please provide different cities for your flight search?";
      }

      console.log(
        `Mapped cities: ${sourceInfo.fullName} (${sourceInfo.code}) -> ${destInfo.fullName} (${destInfo.code})`
      );
      conversationContext.lastTopic = "flight_search_initiated";
      // Mark user as no longer first-time after they search for flights
      conversationContext.isFirstTimeUser = false;

      const responses = [
        `Alright! Searching for flights from ${sourceInfo.fullName} (${
          sourceInfo.code
        }) to ${destInfo.fullName} (${
          destInfo.code
        }) for ${flightDate.toLocaleDateString()}. Give me just a moment... ✈️`,
        `Okay, looking up flights from ${sourceInfo.fullName} to ${
          destInfo.fullName
        } departing on ${flightDate.toLocaleDateString()}. I'll be right back with the options!`,
        `Got it! Let's find the best flights between ${sourceInfo.fullName} (${
          sourceInfo.code
        }) and ${destInfo.fullName} (${
          destInfo.code
        }) on ${flightDate.toLocaleDateString()}. Searching now...`,
        `Perfect! I'm on the hunt for flights from ${sourceInfo.fullName} to ${
          destInfo.fullName
        } for ${flightDate.toLocaleDateString()}. Please wait while I gather the details.`,
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      // Ensure date is in YYYY-MM-DDTHH:mm:ss.sssZ format for consistency
      const isoDateString = flightDate.toISOString();

      return `${randomResponse}\n\n<flight-search source="${sourceInfo.code}" destination="${destInfo.code}" date="${isoDateString}" />`;
    }

    // --- If search details are incomplete ---
    console.log("Flight search query details incomplete.");
    conversationContext.lastTopic = "clarification_needed";
    const geminiResponse = await getGeminiResponse(
      userMessage,
      currentContext + " User's request for flights is incomplete."
    );
    if (geminiResponse) return geminiResponse;
    
    return "Happy to help you find flights! 😊 To get started, could you please tell me the departure city, destination city, and the date you'd like to travel? For example: 'Flights from Mumbai to Goa on 25th December'.";
  }

  // --- Handle Flight Search Results ---
  if (searchParams && flights) {
    // Determine the sort criteria used based on the searchParams
    const sortCriteria = searchParams.sort === "duration" ? "duration" : "price";
    
    // Set conversation topic based on sort parameter
    if (sortCriteria === "duration") {
      conversationContext.lastTopic = "sorted_by_duration";
    } else {
      conversationContext.lastTopic = "sorted_by_price";
    } 
    
    const dateString = searchParams.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (flights.length > 0) {
      console.log(
        `Generating response for ${flights.length} flights found (sorted by ${sortCriteria}): ${searchParams.source} -> ${searchParams.destination}`
      );

      // We still need calculateDuration for the summary text
      const calculateDuration = (flight: Flight): number => {
        try {
          const depTime = new Date(flight.departure_time);
          const arrTime = new Date(flight.arrival_time);
          if (isNaN(depTime.getTime()) || isNaN(arrTime.getTime())) return Infinity;
          return Math.floor((arrTime.getTime() - depTime.getTime()) / (1000 * 60));
        } catch (e) {
          console.error("Error calculating duration for summary:", e);
          return Infinity;
        }
      };
      
      // Find cheapest/fastest from the already sorted list (if needed for summary)
      const cheapestFlight = [...flights].sort((a, b) => a.price - b.price)[0]; 
      const fastestFlight = [...flights].sort((a, b) => calculateDuration(a) - calculateDuration(b))[0];
    
      const durationMinutes = calculateDuration(cheapestFlight);
      const hours =
        durationMinutes !== Infinity ? Math.floor(durationMinutes / 60) : 0;
      const minutes = durationMinutes !== Infinity ? durationMinutes % 60 : 0;

      const flightsToShow = flights.slice(0, 5); // Limit results display from the already sorted list

      // Construct intro based on filters and sort criteria
      let specialIntro = "";
      let filterDescription = "";
      
      // Add filter description
      if (searchParams.filter === "non-stop") {
        specialIntro = "non-stop ";
        filterDescription = " (showing non-stop flights only)";
      }
      
      // Add airline filter description
      if (searchParams.airline) {
        const airlineName = searchParams.airline.charAt(0).toUpperCase() + searchParams.airline.slice(1);
        specialIntro = `${airlineName} `;
        filterDescription = ` (showing ${airlineName} flights only)`;
      }

      const intros = [
        `Great news! I found ${flights.length} ${specialIntro}flights from ${searchParams.source} to ${
          searchParams.destination
        } for ${dateString}. Sorted by ${sortCriteria}${filterDescription}, here are the top ${
          flightsToShow.length
        }:`,
        `Success! ✨ I discovered ${flights.length} ${specialIntro}flight option${
          flights.length > 1 ? "s" : ""
        } for your trip from ${searchParams.source} to ${
          searchParams.destination
        } on ${dateString}. Here they are, sorted by ${sortCriteria}${filterDescription}:`,
        `Okay, I've got ${flights.length} ${specialIntro}flight${
          flights.length > 1 ? "s" : ""
        } ready for you from ${searchParams.source} to ${
          searchParams.destination
        } on ${dateString}. Displaying the top ${
          flightsToShow.length
        } sorted by ${sortCriteria}${filterDescription}:`,
      ];
      const randomIntro = intros[Math.floor(Math.random() * intros.length)];
    
      let flightResultsXml = "";
      flightsToShow.forEach((flight) => {
      const depTime = new Date(flight.departure_time);
      const arrTime = new Date(flight.arrival_time);
        const flightDuration = calculateDuration(flight);
        const flightHours =
          flightDuration !== Infinity ? Math.floor(flightDuration / 60) : 0;
        const flightMinutes =
          flightDuration !== Infinity ? flightDuration % 60 : 0;

        // Add full ISO timestamps for more detailed display
        flightResultsXml += `\n<flight>
<airline>${flight.airline || "Unknown Airline"}</airline>
<flight_number>${flight.flight_number || "Unknown"}</flight_number> 
<departure_time>${format(depTime, "HH:mm")}</departure_time>
<arrival_time>${format(arrTime, "HH:mm")}</arrival_time>
<departure_iso>${depTime.toISOString()}</departure_iso> 
<arrival_iso>${arrTime.toISOString()}</arrival_iso>
<duration>${
          flightHours > 0 ? `${flightHours}h ` : ""
        }${flightMinutes}m</duration>
<price>${formatPrice(flight.price)}</price>
</flight>`;
    });
    
      console.log(`Generated flight XML for ${flightsToShow.length} flights.`);

      // Always mention the cheapest, even if sorted by duration
      const summary = `The absolute cheapest option is with ${
        cheapestFlight.airline
      } for ${formatPrice(cheapestFlight.price)} (${
        hours > 0 ? `${hours}h ` : ""
      }${minutes}m flight time).`;
      const fastestSummary =
        sortCriteria === "price" && fastestFlight
          ? ` The fastest is ${calculateDuration(fastestFlight)}m with ${
              fastestFlight.airline
            } for ${formatPrice(fastestFlight.price)}.`
          : ""; // Only show if sorted by price

      const followUpOptions = [
        sortCriteria === "price"
          ? "2. Sort by shortest duration?"
          : "2. Sort by lowest price?",
        "3. Look for a specific airline?",
        "4. Keep an eye on prices for this route?",
      ];

      // Add query questions for first-time users
      let queryQuestions = "";
      if (conversationContext.isFirstTimeUser && !conversationContext.queryQuestionsShown) {
        conversationContext.queryQuestionsShown = true;
        queryQuestions = `\n\n💡 **Quick Questions to Help You Better:**
        
1. **What's your preferred departure time?** (Early morning, afternoon, evening, or late night?)
2. **Any specific airline preferences?** (IndiGo, Air India, Vistara, SpiceJet, etc.)
3. **Are you looking for the cheapest or fastest option?**
4. **Do you need any special assistance or have dietary requirements?**
5. **Would you like me to track price changes for this route?**

Just answer any of these questions and I'll help you find the perfect flight! 😊`;
      }

      const followUp = `\n\nHow do these look? I can also help you:\n1. Filter these results (e.g., non-stop only).\n${followUpOptions.join(
        "\n"
      )}\n\nJust let me know!`;

      return `${randomIntro}\n\n<flight-results>${flightResultsXml}\n</flight-results>\n\n${summary}${fastestSummary}${queryQuestions}${followUp}`;
    } else {
      // --- Handle No Flights Found ---
      console.log(
        `No flights found for ${searchParams.source} -> ${searchParams.destination} on ${dateString}`
      );
      conversationContext.lastTopic = "no_flights_found";
      const noFlightsResponses = [
        `Hmm, it seems there are no direct flights available from ${searchParams.source} to ${searchParams.destination} on ${dateString}. 😕 Would you like to try searching for flights on a different date or maybe check nearby airports?`,
        `Unfortunately, I couldn't find any flights matching your search from ${searchParams.source} to ${searchParams.destination} for ${dateString}. Sometimes changing the date slightly can help. Want to try another date?`,
        `It looks like flights are scarce for ${searchParams.source} to ${searchParams.destination} on ${dateString}. Perhaps try searching on adjacent dates or explore alternative routes?`,
      ];
      return noFlightsResponses[
        Math.floor(Math.random() * noFlightsResponses.length)
      ];
    }
  }

  // --- Handle Explicit Sorting Requests (AFTER results or BEFORE general fallback) ---
  // Check if the user is asking to sort the results *after* they've been shown
  if (
    conversationContext.lastTopic === "flight_results_presented" ||
    conversationContext.lastTopic === "sorted_by_price" ||
    conversationContext.lastTopic === "sorted_by_duration" ||
    conversationContext.lastTopic === "asked_filter_nonstop" ||
    conversationContext.lastTopic === "asked_filter_airline" ||
    conversationContext.lastTopic === "set_price_alert"
  ) {
    // Check if user is selecting an option by number (1, 2, 3, 4) from the follow-up options
    const numberMatch = userMessage.match(/^\s*([1-4])\s*$/);
    const selectedNumber = numberMatch ? parseInt(numberMatch[1]) : null;
    
    // Handle filter request (option 1)
    if (selectedNumber === 1 || 
        userMessage.toLowerCase().includes("filter") || 
        userMessage.toLowerCase().includes("non-stop") || 
        userMessage.toLowerCase().includes("nonstop")) {
      conversationContext.lastTopic = "asked_filter_nonstop";
      
      if (searchParams) {
        return `I'll filter those results to show non-stop flights only. One moment...\n\n<flight-search source="${
          searchParams.source
        }" destination="${
          searchParams.destination
        }" date="${searchParams.date.toISOString()}" filter="non-stop" />`;
      } else {
        return "I can filter for non-stop flights. Which route were you looking at?";
      }
    }
    
    // Handle sort by duration request (option 2)
    if (
      selectedNumber === 2 ||
      userMessage.toLowerCase().includes("sort by duration") ||
      userMessage.toLowerCase().includes("fastest") ||
      userMessage.toLowerCase().includes("shortest") ||
      userMessage.toLowerCase().includes("duration")
    ) {
      // Set context for the *next* response generation to actually sort and display.
      conversationContext.lastTopic = "asked_sort_duration";
      // Use the original search parameters to trigger a re-fetch/re-display in the next turn
      if (searchParams) {
        return `Okay, sorting those results by the shortest duration. One moment...\n\n<flight-search source="${
          searchParams.source
        }" destination="${
          searchParams.destination
        }" date="${searchParams.date.toISOString()}" sort="duration" />`;
      } else {
        return "Okay, I can sort by duration. Please remind me which flight route you were looking at?";
      }
    }

    // Handle sort by price request (option 2 alternative)
    if (
      userMessage.toLowerCase().includes("sort by price") ||
      userMessage.toLowerCase().includes("cheapest") ||
      userMessage.toLowerCase().includes("lowest price")
    ) {
      conversationContext.lastTopic = "asked_sort_price"; // Price is default, but acknowledge request
      if (searchParams) {
        return `Sure thing! Let me sort those flight results by the lowest price for you.\n\n<flight-search source="${
          searchParams.source
        }" destination="${
          searchParams.destination
        }" date="${searchParams.date.toISOString()}" sort="price" />`;
      } else {
        return "Sure thing, I can sort by price. Which flight search should I re-sort?";
      }
    }
    
    // Handle specific airline request (option 3)
    if (selectedNumber === 3 || 
        userMessage.toLowerCase().includes("airline") || 
        userMessage.toLowerCase().match(/\b(indigo|air india|vistara|spicejet|goair|airasia)\b/i)) {
      
      // Try to extract the airline name from the message
      let airlineName = "";
      const commonAirlineNames = ["indigo", "air india", "vistara", "spicejet", "goair", "airasia"];
      
      for (const airline of commonAirlineNames) {
        if (userMessage.toLowerCase().includes(airline)) {
          airlineName = airline;
          break;
        }
      }
      
      if (airlineName) {
        conversationContext.lastTopic = "asked_filter_airline";
        
        if (searchParams) {
          return `I'll filter the results to show only ${airlineName.charAt(0).toUpperCase() + airlineName.slice(1)} flights. One moment...\n\n<flight-search source="${
            searchParams.source
          }" destination="${
            searchParams.destination
          }" date="${searchParams.date.toISOString()}" airline="${airlineName}" />`;
        } else {
          return `I'd be happy to show you ${airlineName.charAt(0).toUpperCase() + airlineName.slice(1)} flights. Which route are you interested in?`;
        }
      } else {
        // If no airline was specified but option 3 was selected
        conversationContext.lastTopic = "asked_which_airline";
        return "Which airline would you like to see flights for? Some popular options are IndiGo, Air India, Vistara, SpiceJet, GoAir, and AirAsia.";
      }
    }
    
    // Handle price alert request (option 4)
    if (selectedNumber === 4 || 
        (userMessage.toLowerCase().includes("price") && 
         (userMessage.toLowerCase().includes("alert") || 
          userMessage.toLowerCase().includes("track") || 
          userMessage.toLowerCase().includes("monitor") || 
          userMessage.toLowerCase().includes("eye") || 
          userMessage.toLowerCase().includes("watch") || 
          userMessage.toLowerCase().includes("notify")))) {
      
      conversationContext.lastTopic = "set_price_alert";
      
      if (searchParams) {
        // In a real app, this would save the alert to a database
        return `Great! I've set up a price alert for flights from ${searchParams.source} to ${
          searchParams.destination
        } on ${searchParams.date.toLocaleDateString()}. I'll notify you if the prices change significantly! Is there anything else you'd like to know about this route?`;
      } else {
        return "I'd be happy to set up a price alert for you. Could you remind me which route you were interested in?";
      }
    }
  }
  
  // Handle response after user specifies airline when prompted
  if (conversationContext.lastTopic === "asked_which_airline") {
    // Try to extract the airline name from the message
    let airlineName = "";
    const commonAirlineNames = ["indigo", "air india", "vistara", "spicejet", "goair", "airasia"];
    
    for (const airline of commonAirlineNames) {
      if (userMessage.toLowerCase().includes(airline)) {
        airlineName = airline;
        break;
      }
    }
    
    if (airlineName && searchParams) {
      conversationContext.lastTopic = "asked_filter_airline";
      return `I'll filter the results to show only ${airlineName.charAt(0).toUpperCase() + airlineName.slice(1)} flights. One moment...\n\n<flight-search source="${
        searchParams.source
      }" destination="${
        searchParams.destination
      }" date="${searchParams.date.toISOString()}" airline="${airlineName}" />`;
    } else if (airlineName) {
      return `I'd be happy to show you ${airlineName.charAt(0).toUpperCase() + airlineName.slice(1)} flights. Could you please tell me which route you're interested in?`;
    } else {
      return "I didn't recognize that airline. Could you try one of these: IndiGo, Air India, Vistara, SpiceJet, GoAir, or AirAsia?";
    }
  }

  // --- Handle Query Questions Responses ---
  if (conversationContext.queryQuestionsShown && conversationContext.isFirstTimeUser) {
    // Handle departure time preferences
    if (userMessage.toLowerCase().match(/\b(early morning|morning|afternoon|evening|late night|night|departure time|time preference)\b/)) {
      conversationContext.lastTopic = "departure_time_preference";
      const timeResponses = [
        "Great! I'll keep that in mind for future searches. Early morning flights are often more punctual and can be cheaper too!",
        "Perfect! I'll prioritize flights around that time for you. Morning flights also tend to have better on-time performance.",
        "Noted! I'll look for flights that match your preferred departure time. This helps avoid rush hour traffic to the airport too!",
        "Excellent choice! I'll remember your preference and suggest flights that work best with your schedule.",
      ];
      return timeResponses[Math.floor(Math.random() * timeResponses.length)];
    }
    
    // Handle airline preferences
    if (userMessage.toLowerCase().match(/\b(indigo|air india|vistara|spicejet|goair|airasia|airline preference|preferred airline)\b/)) {
      conversationContext.lastTopic = "airline_preference";
      const airlineResponses = [
        "Perfect! I'll prioritize that airline for your searches. They're known for good service and competitive prices!",
        "Great choice! I'll keep an eye out for the best deals with that airline for your future searches.",
        "Excellent! I'll filter results to show that airline first. They often have great offers and good connectivity.",
        "Noted! I'll remember your preference and suggest flights from that airline whenever possible.",
      ];
      return airlineResponses[Math.floor(Math.random() * airlineResponses.length)];
    }
    
    // Handle cheapest vs fastest preference
    if (userMessage.toLowerCase().match(/\b(cheapest|cheap|budget|fastest|fast|quick|duration|price)\b/)) {
      conversationContext.lastTopic = "price_vs_duration_preference";
      if (userMessage.toLowerCase().match(/\b(cheapest|cheap|budget|price)\b/)) {
        conversationContext.userPreferences.pricePreference = "budget";
        return "Perfect! I'll prioritize the most affordable options for you. Budget-friendly flights can save you money for your destination activities! 💰";
      } else if (userMessage.toLowerCase().match(/\b(fastest|fast|quick|duration)\b/)) {
        conversationContext.userPreferences.pricePreference = "premium";
        return "Great! I'll focus on the fastest routes for you. Sometimes paying a bit more for a shorter flight is worth the time saved! ⚡";
      }
    }
    
    // Handle special assistance queries
    if (userMessage.toLowerCase().match(/\b(special assistance|wheelchair|mobility|dietary|meal|vegetarian|vegan|assistance)\b/)) {
      conversationContext.lastTopic = "special_assistance";
      return "I understand you may need special assistance. Most airlines offer excellent support for passengers with special requirements. I'd recommend contacting the airline directly when booking to ensure all your needs are accommodated. They can arrange wheelchair assistance, special meals, and other services! 🤝";
    }
    
    // Handle price tracking requests
    if (userMessage.toLowerCase().match(/\b(track|monitor|alert|notify|price changes|price drop|watch)\b/)) {
      conversationContext.lastTopic = "price_tracking";
      return "Excellent idea! I can set up price alerts for this route. I'll monitor the prices and notify you if there are significant changes. This way you can book at the best time! 📈";
    }
  }

  // --- Handle Baggage Allowance Queries ---
  if (userMessage.toLowerCase().match(/\b(baggage|luggage|bag limit|allowance)\b/)) {
    console.log("Detected baggage query");
    
    // Try to identify mentioned airline
    let mentionedAirline = "";
    for (const airline of commonAirlines) {
      if (userMessage.toLowerCase().includes(airline)) {
        mentionedAirline = airline.charAt(0).toUpperCase() + airline.slice(1);
        break;
      }
    }
    
    conversationContext.lastTopic = "baggage_info";
    const responseBase = "Baggage allowances vary significantly between airlines, fare types (economy, business), and routes (domestic vs. international). ";
    if (mentionedAirline) {
      return `${responseBase}For ${mentionedAirline}, it's best to check their official website for the most accurate and up-to-date information regarding checked and carry-on baggage limits based on your specific ticket.`;
    } else {
      return `${responseBase}Generally, domestic economy flights in India have a checked baggage limit (often 15kg) and a cabin bag limit (often 7kg), but you should always check the specific airline's website for details about your fare.`;
    }
  }

  // --- Handle Check-in Queries ---
  if (userMessage.toLowerCase().match(/\b(check in|check-in|boarding pass)\b/)) {
    console.log("Detected check-in query");
    
    // Try to identify mentioned airline
    let mentionedAirline = "";
    for (const airline of commonAirlines) {
      if (userMessage.toLowerCase().includes(airline)) {
        mentionedAirline = airline.charAt(0).toUpperCase() + airline.slice(1);
        break;
      }
    }
    
    conversationContext.lastTopic = "checkin_info";
    const responseBase = "Check-in procedures and timings can differ. ";
    if (mentionedAirline) {
      return `${responseBase}For ${mentionedAirline}, you can usually check in online via their website or app starting 24-48 hours before departure. Airport check-in counters typically close 45-60 minutes before domestic flights. Please verify the exact timings on their official website.`;
    } else {
      return `${responseBase}Most airlines allow online check-in starting 24-48 hours before the flight via their website or app. For domestic flights in India, it's generally recommended to arrive at the airport 1.5-2 hours before departure, and check-in counters often close 45-60 minutes prior. Always confirm with your specific airline.`;
    }
  }

  // --- Handle Specific Topics (Airline Info, Tips, etc.) ---
  // Using Gemini first for these is often better for natural language
  console.log("Attempting Gemini response for general query/topic.");
  
  const geminiGeneralResponse = await getGeminiResponse(
    userMessage,
    currentContext
  );
  if (geminiGeneralResponse) return geminiGeneralResponse;

  // --- Fallback Logic if Gemini Fails or for Specific Keywords ---
  console.log(
    "Gemini failed or query matched specific keywords, using fallback logic."
  );
  conversationContext.lastTopic = "fallback_response";

  if (
    commonAirlines.some((airline) =>
      userMessage.toLowerCase().includes(airline)
    )
  ) {
    const mentioned =
      commonAirlines.find((airline) =>
        userMessage.toLowerCase().includes(airline)
      ) || "the airline";
    return `${
      mentioned.charAt(0).toUpperCase() + mentioned.slice(1)
    } is a popular choice! They fly many routes. To get specific prices and schedules, it's best to search for your exact trip details. Want me to search flights for ${mentioned}?`;
  }

  if (userMessage.toLowerCase().match(/\b(tip|advice|hack)s?\b/)) {
    const tips = [
      "Sure! One tip for finding cheaper flights in India is to be flexible with your travel dates. Flying mid-week (Tuesday or Wednesday) is often less expensive than on weekends.",
      "Happy to share a tip! Consider booking flights about 4-6 weeks in advance for domestic Indian travel – that's often the sweet spot for pricing.",
      "Here's a piece of advice: Sign up for airline newsletters! They sometimes send out exclusive deals or announce sales early.",
      "Travel tip! Check prices for nearby airports if possible. Sometimes flying into or out of a slightly less convenient airport can save you a good amount.",
      "Budget tip: Early morning or late-night 'red-eye' flights can sometimes be significantly cheaper if your schedule allows!",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  if (
    userMessage
      .toLowerCase()
      .match(/\b(alert|notify|notification|price drop)s?\b/)
  ) {
    return "I can definitely help keep an eye on prices for you! Once you search for a specific flight route and date, just ask me to set up a price alert, and I'll let you know if the fare changes.";
  }

  // --- Generic Fallback Responses ---
  const defaultResponses = [
    "I'm here to help with all things flights! Feel free to ask me to search for a specific route, like 'flights Delhi to Bangalore tomorrow'.",
    "Hmm, I'm not quite sure how to answer that specifically. I'm best at finding flights, providing travel tips, and giving airline info. Could you try rephrasing?",
    "I can search for flights if you tell me the origin, destination, and date. For example: 'Find flights from Chennai to Hyderabad next Friday'.",
    "Let's get your travel planning started! What flight route are you interested in?",
    "I'm ready to assist! Ask me about flight prices, schedules, or general travel advice.",
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Function to reset conversation context (useful for new sessions)
export const resetConversationContext = () => {
  conversationContext.lastTopic = "";
  conversationContext.userPreferences = {
    preferredAirlines: [],
    pricePreference: "",
    travelDate: null,
  };
  conversationContext.mentionedCities.clear();
  conversationContext.mentionedAirlines.clear();
  conversationContext.isFirstTimeUser = true;
  conversationContext.queryQuestionsShown = false;
};

// --- Initial Messages --- (Refreshed slightly)
export const getInitialMessages = (): Message[] => {
  const greetings = [
    "Hi there! I'm Flight Friend, your AI travel buddy. Let's find you some great flights! Where are you thinking of going?",
    "Hello! Flight Friend here. I can help search for flights, track prices, or give travel advice. How can I assist you today? 😊",
    "Welcome to Flight Friend! Ready to plan your next adventure? Tell me your route and dates!",
    "Hey! 👋 Your AI flight assistant is ready. Ask me anything about flights!",
  ];
  
  return [
    {
      id: uuidv4(),
      content: greetings[Math.floor(Math.random() * greetings.length)],
      type: "bot",
      timestamp: new Date(),
    },
  ];
};

// --- Parse Flight Search Command --- (Ensure tag names match generation)
export const parseFlightSearchCommand = (
  message: string
): FlightSearchParams | null => {
  console.log("Parsing flight search command from:", message);
  
  // Updated to optionally capture filter, airline, and sort parameters with better regex pattern
  const searchMatch = message.match(
    /<flight-search\s+source="([^\"]+)"\s+destination="([^\"]+)"\s+date="([^\"]+)"(?:\s+filter="([^\"]+)")?(?:\s+airline="([^\"]+)")?(?:\s+sort="([^\"]+)")?\s*\/?>/
  );
  
  if (searchMatch) {
    console.log("Flight search match found with groups:", searchMatch.length);
    const [fullMatch, source, destination, dateStr, filter, airline, sort] = searchMatch;
    console.log(`Extracted: source=${source}, dest=${destination}, date=${dateStr}, filter=${filter || 'none'}, airline=${airline || 'none'}, sort=${sort || 'price'}`);
    
    // Attempt to parse the ISO date string
    let date: Date;
    try {
      date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        console.error(`Failed to parse date from flight-search tag: ${dateStr}`);
        return null; // Invalid date
      }
    } catch (error) {
      console.error(`Error parsing date from flight-search tag: ${dateStr}`, error);
      return null;
    }

    console.log(
      `Parsed flight search command: ${source} -> ${destination} on ${date.toISOString()}${filter ? ', filter: ' + filter : ''}${airline ? ', airline: ' + airline : ''}${sort ? ', sort: ' + sort : ''}`
    );
    
    // Return with optional filter, airline, and sort parameters
    const result: FlightSearchParams = { 
      source, 
      destination, 
      date,
    };
    
    // Only add optional parameters if they're defined
    if (filter) result.filter = filter;
    if (airline) result.airline = airline;
    if (sort) result.sort = sort;
    
    return result;
  } else {
    console.log("No flight search command found in message");
  }
  
  return null;
};
