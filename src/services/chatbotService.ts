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
  commonCities.forEach((city) => {
    if (userMessage.toLowerCase().includes(city)) {
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
    if (userMessage.toLowerCase().includes(airline)) {
      conversationContext.mentionedAirlines.add(airline);
      currentContext += ` User mentioned ${airline}.`;
    }
  });

  if (
    userMessage.toLowerCase().includes("cheap") ||
    userMessage.toLowerCase().includes("budget")
  ) {
    conversationContext.userPreferences.pricePreference = "budget";
    currentContext += " User seems budget-conscious.";
  } else if (
    userMessage.toLowerCase().includes("premium") ||
    userMessage.toLowerCase().includes("business")
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
    let sourceMatch, destMatch;

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

    // --- Validate Cities and Generate Search Command ---
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
    conversationContext.lastTopic = "flight_results_presented";
    const dateString = searchParams.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // --- Sorting Logic ---
    let sortedFlights = [...flights];
    let sortCriteria = "price"; // Default sort

    // Check if user asked to sort by duration in the *previous* message
    // (A more robust solution would involve proper state management)
    if (conversationContext.lastTopic === "asked_sort_duration") {
      sortCriteria = "duration";
      console.log("Sorting by duration based on previous context.");
    } else if (
      userMessage.toLowerCase().includes("sort by duration") ||
      userMessage.toLowerCase().includes("fastest")
    ) {
      sortCriteria = "duration";
      console.log("Sorting by duration based on current message.");
    } else if (
      userMessage.toLowerCase().includes("sort by price") ||
      userMessage.toLowerCase().includes("cheapest")
    ) {
      sortCriteria = "price"; // Explicitly sort by price
      console.log("Sorting by price based on current message.");
    }

    // Function to calculate duration in minutes
    const calculateDuration = (flight: Flight): number => {
      try {
        const depTime = new Date(flight.departure_time);
        const arrTime = new Date(flight.arrival_time);
        if (isNaN(depTime.getTime()) || isNaN(arrTime.getTime()))
          return Infinity; // Handle invalid dates
        return Math.floor(
          (arrTime.getTime() - depTime.getTime()) / (1000 * 60)
        );
      } catch (e) {
        console.error("Error calculating duration:", e);
        return Infinity;
      }
    };

    if (sortCriteria === "duration") {
      sortedFlights.sort((a, b) => calculateDuration(a) - calculateDuration(b));
      conversationContext.lastTopic = "sorted_by_duration"; // Update context
    } else {
      // Default to price
      sortedFlights.sort((a, b) => a.price - b.price);
      conversationContext.lastTopic = "sorted_by_price"; // Update context
    }
    // --- End Sorting Logic ---

    if (flights.length > 0) {
      console.log(
        `Generating response for ${flights.length} flights found (${sortCriteria} sort): ${searchParams.source} -> ${searchParams.destination}`
      );

      const cheapestFlight = [...flights].sort((a, b) => a.price - b.price)[0]; // Always find the absolute cheapest for summary
      const fastestFlight = [...flights].sort(
        (a, b) => calculateDuration(a) - calculateDuration(b)
      )[0]; // Find the fastest

      const departureTime = new Date(cheapestFlight.departure_time);
      const arrivalTime = new Date(cheapestFlight.arrival_time);
      const durationMinutes = calculateDuration(cheapestFlight);
      const hours =
        durationMinutes !== Infinity ? Math.floor(durationMinutes / 60) : 0;
      const minutes = durationMinutes !== Infinity ? durationMinutes % 60 : 0;

      const flightsToShow = sortedFlights.slice(0, 5); // Limit results display based on current sort

      const intros = [
        `Great news! I found ${flights.length} flight${
          flights.length > 1 ? "s" : ""
        } from ${searchParams.source} to ${
          searchParams.destination
        } for ${dateString}. Sorted by ${sortCriteria}, here are the top ${
          flightsToShow.length
        }:`,
        `Success! ✨ I discovered ${flights.length} flight option${
          flights.length > 1 ? "s" : ""
        } for your trip from ${searchParams.source} to ${
          searchParams.destination
        } on ${dateString}. Here they are, sorted by ${sortCriteria}:`,
        `Okay, I've got ${flights.length} flight${
          flights.length > 1 ? "s" : ""
        } ready for you from ${searchParams.source} to ${
          searchParams.destination
        } on ${dateString}. Displaying the top ${
          flightsToShow.length
        } sorted by ${sortCriteria}:`,
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

      const followUp = `\n\nHow do these look? I can also help you:\n1. Filter these results (e.g., non-stop only).\n${followUpOptions.join(
        "\n"
      )}\n\nJust let me know!`;

      return `${randomIntro}\n\n<flight-results>${flightResultsXml}\n</flight-results>\n\n${summary}${fastestSummary}${followUp}`;
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
    conversationContext.lastTopic === "sorted_by_duration"
  ) {
    if (
      userMessage.toLowerCase().includes("sort by duration") ||
      userMessage.includes("fastest")
    ) {
      // Set context for the *next* response generation to actually sort and display.
      // We can't re-sort here directly as `flights` data isn't readily available in this context scope.
      conversationContext.lastTopic = "asked_sort_duration";
      // Use the original search parameters to trigger a re-fetch/re-display in the next turn
      if (searchParams) {
        return `Okay, sorting those results by the shortest duration. One moment...\n\n<flight-search source="${
          searchParams.source
        }" destination="${
          searchParams.destination
        }" date="${searchParams.date.toISOString()}" />`;
      } else {
        return "Okay, I can sort by duration. Please remind me which flight route you were looking at?";
      }
    }

    if (
      userMessage.toLowerCase().includes("sort by price") ||
      userMessage.includes("cheapest")
    ) {
      conversationContext.lastTopic = "asked_sort_price"; // Price is default, but acknowledge request
      if (searchParams) {
        return `Sure thing! Let me sort those flight results by the lowest price for you.\n\n<flight-search source="${
          searchParams.source
        }" destination="${
          searchParams.destination
        }" date="${searchParams.date.toISOString()}" />`;
      } else {
        return "Sure thing, I can sort by price. Which flight search should I re-sort?";
      }
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
  // Regex needs to match the tags generated in generateChatbotResponse
  const searchMatch = message.match(
    /<flight-search\s+source="([^\"]+)"\s+destination="([^\"]+)"\s+date="([^\"]+)"\s*\/?>/
  ); // Allow optional closing slash

  if (searchMatch) {
    const [_, source, destination, dateStr] = searchMatch;
    // Attempt to parse the ISO date string
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      console.error(`Failed to parse date from flight-search tag: ${dateStr}`);
      return null; // Invalid date
    }

    console.log(
      `Parsed flight search command: ${source} -> ${destination} on ${date.toISOString()}`
    );
    return { source, destination, date };
  }

  return null;
};
