import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/components/ChatMessage';
import { Flight, FlightSearchParams, searchFlights } from './flightService';
import { format } from 'date-fns';
import { GeminiService } from '../config/api/geminiService';

// For more conversational and personalized responses
const conversationContext = {
  lastTopic: '',
  userPreferences: {
    preferredAirlines: [] as string[],
    pricePreference: '', // 'budget', 'value', 'premium'
    travelDate: null as Date | null,
  },
  // Track conversation to avoid repetition
  mentionedCities: new Set<string>(),
  mentionedAirlines: new Set<string>(),
};

// Function to generate responses using Gemini API for more varied replies
const getGeminiResponse = async (userMessage: string, context: string): Promise<string | null> => {
  try {
    const geminiService = GeminiService.getInstance();
    
    // Create a prompt with context for better responses
    const prompt = `
You are a friendly and helpful flight assistant called Flight Friend. Respond to the following user message about flights, travel, or related topics.
Current context: ${context}

User message: "${userMessage}"

Provide a helpful, conversational response. Keep it concise.
`;

    console.log('Sending prompt to Gemini API with context');
    const response = await geminiService.generateContent(prompt);
    
    if (!response || response.trim() === '') {
      console.warn('Received empty response from Gemini API');
      return null;
    }
    
    console.log('Received valid response from Gemini API');
    return response;
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return null;
  }
};

// Function to generate chatbot responses
export const generateChatbotResponse = async (
  userMessage: string,
  searchParams?: FlightSearchParams,
  flights?: Flight[]
): Promise<string> => {
  console.log('Generating chatbot response for:', userMessage || 'flight results');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay

  // Function to format price to INR
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  // Update conversation context
  let currentContext = '';
  if (searchParams) {
    currentContext += `User was searching for flights from ${searchParams.source} to ${searchParams.destination}. `;
    conversationContext.mentionedCities.add(searchParams.source);
    conversationContext.mentionedCities.add(searchParams.destination);
    conversationContext.userPreferences.travelDate = searchParams.date;
  }
  
  // Detect cities in message for context
  const cities = ['delhi', 'mumbai', 'bangalore', 'kolkata', 'chennai', 'hyderabad', 'pune', 'ahmedabad', 'jaipur'];
  cities.forEach(city => {
    if (userMessage.toLowerCase().includes(city)) {
      conversationContext.mentionedCities.add(city);
    }
  });

  // Detect airlines in message for context
  const airlines = ['indigo', 'air india', 'vistara', 'spicejet', 'goair', 'airasia'];
  airlines.forEach(airline => {
    if (userMessage.toLowerCase().includes(airline)) {
      conversationContext.mentionedAirlines.add(airline);
      currentContext += `User mentioned ${airline}. `;
    }
  });

  // Detect price preferences
  if (userMessage.toLowerCase().includes('cheap') || userMessage.toLowerCase().includes('budget') || userMessage.toLowerCase().includes('low cost')) {
    conversationContext.userPreferences.pricePreference = 'budget';
    currentContext += 'User is looking for budget options. ';
  } else if (userMessage.toLowerCase().includes('premium') || userMessage.toLowerCase().includes('business') || userMessage.toLowerCase().includes('luxury')) {
    conversationContext.userPreferences.pricePreference = 'premium';
    currentContext += 'User is interested in premium options. ';
  }

  currentContext += `Previously mentioned cities: ${Array.from(conversationContext.mentionedCities).join(', ')}. `;
  
  // Initial greeting - use varied greetings
  if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
    console.log('Detected greeting, generating response');
    
    // Try to get a response from Gemini first
    const geminiResponse = await getGeminiResponse(userMessage, currentContext);
    if (geminiResponse) {
      console.log('Using Gemini response for greeting');
      return geminiResponse;
    }
    
    console.log('Falling back to hardcoded greeting response');
    // Fallback responses if Gemini fails
    const greetings = [
      "Hello! I'm Flight Friend, your AI travel assistant. How can I help you find the perfect flight today?",
      "Hi there! I'm your personal flight assistant. Looking for travel options, fare details, or flight information?",
      "Greetings! I'm Flight Friend, ready to assist with your travel plans. Where are you thinking of flying to?",
      "Welcome! I'm your AI flight companion. I can help with routes, prices, and travel recommendations. What's your destination?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Handle flight search queries with improved pattern matching
  if (userMessage.toLowerCase().includes('find') || 
      userMessage.toLowerCase().includes('search') || 
      userMessage.toLowerCase().includes('flight') || 
      userMessage.toLowerCase().includes('from') ||
      userMessage.toLowerCase().includes('show') ||
      userMessage.toLowerCase().includes('book') ||
      userMessage.toLowerCase().includes('travel') ||
      userMessage.toLowerCase().includes('trip')) {
        
    console.log('Detected flight search query:', userMessage);
    
    // Special case for "ranchi to kolkata"
    if (userMessage.toLowerCase().includes('ranchi') && userMessage.toLowerCase().includes('kolkata')) {
      console.log('Special case detected: Ranchi to Kolkata');
      // Default to tomorrow if no date is found
      let flightDate = new Date();
      flightDate.setDate(flightDate.getDate() + 1);
      
      // Try to detect date in the message
      const dateRegex = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i;
      const dateMatch = userMessage.match(dateRegex);
      
      if (dateMatch) {
        console.log('Date found in special case:', dateMatch[0]);
        try {
          const parsedDate = new Date(dateMatch[0] + ", " + new Date().getFullYear());
          if (!isNaN(parsedDate.getTime())) {
            flightDate = parsedDate;
          }
        } catch (e) {
          console.error('Error parsing date in special case:', e);
        }
      }
      
      console.log(`Using hardcoded IXR to CCU with date: ${flightDate.toDateString()}`);
      
      return `I'll find you flights from Ranchi (IXR) to Kolkata (CCU) on ${flightDate.toLocaleDateString()}. Hang tight!

<flight-search source="IXR" destination="CCU" date="${flightDate.toISOString()}" />`;
    }
    
    // Try to extract locations and date from message
    let sourceMatch, destMatch, source, destination;
    
    // Pattern 1: Standard "from X to Y" format
    const sourceRegex = /(?:from|origin|source|departing)\s+([A-Za-z\s]+?)(?:\s+to|\s+on|\s+for|\s+at|\s+by|\s+$)/i;
    const destRegex = /(?:to|destination|arriving at)\s+([A-Za-z\s]+?)(?:\s+on|\s+for|\s+at|\s+by|\s+$|\.)/i;
    
    sourceMatch = userMessage.match(sourceRegex);
    destMatch = userMessage.match(destRegex);
    
    console.log('Pattern 1 matches:', sourceMatch ? sourceMatch[1] : 'no match', destMatch ? destMatch[1] : 'no match');
    
    // Pattern 2: Direct city names format like "mumbai to delhi" without "from"
    if (!sourceMatch || !destMatch) {
      console.log('Trying alternate pattern: Direct city-to-city format');
      const directCitiesRegex = /\b([A-Za-z\s]{2,})\s+(?:to|and|->|—|–|-)\s+([A-Za-z\s]{2,})\b/i;
      const directMatch = userMessage.match(directCitiesRegex);
      
      if (directMatch) {
        source = directMatch[1].trim();
        destination = directMatch[2].trim();
        console.log(`Found direct format: ${source} to ${destination}`);
        sourceMatch = destMatch = true; // Set these to true to pass the check
      } else {
        // Try an even simpler pattern - just extract two cities directly
        console.log('Trying direct city extraction');
        
        // Define common cities that might be in the query
        const commonCities = [
          'ranchi', 'kolkata', 'mumbai', 'delhi', 'bangalore', 'chennai', 
          'hyderabad', 'pune', 'patna', 'lucknow', 'jaipur', 'goa', 'ahmedabad',
          'bhubaneswar', 'varanasi', 'nagpur', 'indore', 'kochi', 'guwahati'
        ];
        
        // Extract all cities from the message
        let foundCities = [];
        
        const normalizedMessage = ' ' + userMessage.toLowerCase() + ' ';
        
        for (const city of commonCities) {
          // Check if the city is in the message with word boundaries
          if (normalizedMessage.includes(` ${city} `) || 
              normalizedMessage.includes(` ${city}.`) || 
              normalizedMessage.includes(` ${city},`) ||
              normalizedMessage.includes(` ${city}\n`)) {
            foundCities.push(city);
            console.log(`Found city in message: ${city}`);
          }
        }
        
        // If we found at least 2 distinct cities, use them
        if (foundCities.length >= 2) {
          source = foundCities[0];
          destination = foundCities[1];
          console.log(`Using cities from direct extraction: ${source} to ${destination}`);
          sourceMatch = destMatch = true;
        } else {
          // If the direct extraction didn't work, continue with the regex approach
          console.log('Direct extraction failed, trying regex pattern');
          
          // Create a regex from our city map (continue with existing code)
          const cityMap: {[key: string]: string} = {
            'delhi': 'DEL',
            'mumbai': 'BOM',
            'bangalore': 'BLR',
            'bengaluru': 'BLR',
            'hyderabad': 'HYD',
            'chennai': 'MAA',
            'kolkata': 'CCU',
            'ahmedabad': 'AMD',
            'pune': 'PNQ',
            'jaipur': 'JAI',
            'ranchi': 'IXR',
            'patna': 'PAT',
            'lucknow': 'LKO',
            'guwahati': 'GAU',
            'bhubaneswar': 'BBI',
            'goa': 'GOI',
            'varanasi': 'VNS',
            'srinagar': 'SXR',
            'coimbatore': 'CJB',
            'trivandrum': 'TRV',
            'indore': 'IDR',
            'nagpur': 'NAG',
            'chandigarh': 'IXC',
            'amritsar': 'ATQ',
            'raipur': 'RPR',
            'visakhapatnam': 'VTZ',
            'vizag': 'VTZ',
            'bhopal': 'BHO',
            'udaipur': 'UDR',
            // Add more cities as needed
          };
          
          // Convert city names to regex pattern
          const cityPattern = Object.keys(cityMap).join('|');
          const simpleCityRegex = new RegExp(`\\b(${cityPattern})\\b.*?\\b(${cityPattern})\\b`, 'i');
          
          const simpleCityMatch = userMessage.toLowerCase().match(simpleCityRegex);
          if (simpleCityMatch) {
            // Make sure source and destination are different
            if (simpleCityMatch[1] !== simpleCityMatch[2]) {
              source = simpleCityMatch[1].trim();
              destination = simpleCityMatch[2].trim();
              console.log(`Found simple city match: ${source} to ${destination}`);
              sourceMatch = destMatch = true;
            } else {
              console.log('Source and destination are the same, ignoring match');
            }
          }
        }
      }
    } else {
      source = sourceMatch[1].trim();
      destination = destMatch[1].trim();
    }
    
    // Date extraction with enhanced patterns
    const dateRegex = /(?:on|for|at|date|dated|traveling on)\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|[0-1]?\d)(?:\s+\d{4})?|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/i;
    
    // Also try to find dates without explicit keywords
    const simpleDateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)\b/i;

    // If we found both cities
    if ((sourceMatch && destMatch) || (source && destination)) {
      console.log(`Found cities: ${source} to ${destination}`);
      
      // Default to tomorrow if no date specified
      let flightDate = new Date();
      flightDate.setDate(flightDate.getDate() + 1);
      
      const dateMatch = userMessage.match(dateRegex);
      if (dateMatch) {
        console.log('Found date:', dateMatch[1]);
        // Very simple date parsing, in production you'd want to use a better parser
        const dateStr = dateMatch[1];
        try {
          // Try different date formats
          let parsedDate;
          
          // Try direct parsing first
          parsedDate = new Date(dateStr);
          
          // If that fails, try with different formats
          if (isNaN(parsedDate.getTime())) {
            // Check for DD/MM/YYYY or DD-MM-YYYY format
            const dateFormatMatch = dateStr.match(/(\d{1,2})[-\/](\d{1,2})(?:[-\/](\d{2,4}))?/);
            if (dateFormatMatch) {
              const day = parseInt(dateFormatMatch[1]);
              const month = parseInt(dateFormatMatch[2]) - 1; // JavaScript months are 0-indexed
              const year = dateFormatMatch[3] ? parseInt(dateFormatMatch[3]) : new Date().getFullYear();
              // Adjust 2-digit years
              const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
              parsedDate = new Date(fullYear, month, day);
            } else {
              // Try to handle formats like "3rd Apr"
              const ordinalDateMatch = dateStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
              if (ordinalDateMatch) {
                const day = parseInt(ordinalDateMatch[1]);
                const monthStr = ordinalDateMatch[2].toLowerCase();
                const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const month = months.indexOf(monthStr.substr(0, 3).toLowerCase());
                const year = new Date().getFullYear();
                
                if (month !== -1) {
                  parsedDate = new Date(year, month, day);
                }
              }
            }
          }
          
          if (!isNaN(parsedDate.getTime())) {
            flightDate = parsedDate;
          }
        } catch (e) {
          console.error("Failed to parse date", e);
        }
      }
      
      // Validate city names and convert to airport codes
      function validateAndGetCode(cityName: string) {
        // Handle special cases explicitly
        const specialCases = {
          'ranchi': { code: 'IXR', fullName: 'Ranchi' },
          'kolkata': { code: 'CCU', fullName: 'Kolkata' },
          'calcutta': { code: 'CCU', fullName: 'Kolkata' },
          'delhi': { code: 'DEL', fullName: 'Delhi' },
          'new delhi': { code: 'DEL', fullName: 'Delhi' },
          'mumbai': { code: 'BOM', fullName: 'Mumbai' },
          'bombay': { code: 'BOM', fullName: 'Mumbai' },
          'bangalore': { code: 'BLR', fullName: 'Bangalore' },
          'bengaluru': { code: 'BLR', fullName: 'Bangalore' },
          'chennai': { code: 'MAA', fullName: 'Chennai' },
          'madras': { code: 'MAA', fullName: 'Chennai' },
          'hyderabad': { code: 'HYD', fullName: 'Hyderabad' },
          'ahmedabad': { code: 'AMD', fullName: 'Ahmedabad' },
          'pune': { code: 'PNQ', fullName: 'Pune' },
          'jaipur': { code: 'JAI', fullName: 'Jaipur' },
          'goa': { code: 'GOI', fullName: 'Goa' }
        };
        
        const normalizedCity = cityName.toLowerCase().trim();
        console.log(`Validating city: ${normalizedCity}`);
        
        // Direct check for special cases
        if (specialCases[normalizedCity]) {
          console.log(`Found exact match for special case: ${normalizedCity}`);
          return specialCases[normalizedCity];
        }
        
        // Check partial matches for special cases
        for (const [key, value] of Object.entries(specialCases)) {
          if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
            console.log(`Found partial match for special case: ${key}`);
            return value;
          }
        }
        
        // If no special case found, proceed with the standard mapping
        const cityMap: {[key: string]: string} = {
          'patna': 'PAT',
          'lucknow': 'LKO',
          'guwahati': 'GAU',
          'bhubaneswar': 'BBI',
          'varanasi': 'VNS',
          'srinagar': 'SXR',
          'coimbatore': 'CJB',
          'trivandrum': 'TRV',
          'thiruvananthapuram': 'TRV',
          'kochi': 'COK',
          'cochin': 'COK',
          'indore': 'IDR',
          'nagpur': 'NAG',
          'chandigarh': 'IXC',
          'amritsar': 'ATQ',
          'raipur': 'RPR',
          'visakhapatnam': 'VTZ',
          'vizag': 'VTZ',
          'bhopal': 'BHO',
          'udaipur': 'UDR',
          // Add more cities as needed
        };
        
        // Check if the city is in our map
        for (const [city, code] of Object.entries(cityMap)) {
          if (normalizedCity.includes(city) || city.includes(normalizedCity)) {
            console.log(`Matched city ${city} with code ${code}`);
            return { code, fullName: city.charAt(0).toUpperCase() + city.slice(1) };
          }
        }
        
        // If not found, just use the first 3 letters uppercased
        console.log(`No match found for ${normalizedCity}, using first 3 letters as code`);
        return { 
          code: normalizedCity.slice(0, 3).toUpperCase(), 
          fullName: normalizedCity.charAt(0).toUpperCase() + normalizedCity.slice(1).toLowerCase() 
        };
      }
      
      const sourceInfo = validateAndGetCode(source);
      const destInfo = validateAndGetCode(destination);
      
      const sourceCode = sourceInfo.code;
      const destCode = destInfo.code;
      const sourceName = sourceInfo.fullName;
      const destName = destInfo.fullName;
      
      console.log(`Creating flight search for ${sourceCode} to ${destCode} on ${flightDate.toLocaleDateString()}`);
      
      // Add variation to search response
      const responses = [
        `I'll find you flights from ${sourceName} (${sourceCode}) to ${destName} (${destCode}) on ${flightDate.toLocaleDateString()}. Hang tight!`,
        `Looking for flights from ${sourceName} to ${destName} on ${flightDate.toLocaleDateString()}. One moment please...`,
        `Searching for the best flight options from ${sourceName} to ${destName} for ${flightDate.toLocaleDateString()}. This will just take a moment.`,
        `I'll search for flights between ${sourceName} and ${destName} for ${flightDate.toLocaleDateString()}. Please wait a moment while I find the best options.`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return `${randomResponse}

<flight-search source="${sourceCode}" destination="${destCode}" date="${flightDate.toISOString()}" />`;
    }
    
    // Try getting a Gemini response for more natural handling of partial queries
    const geminiResponse = await getGeminiResponse(userMessage, currentContext);
    if (geminiResponse) return geminiResponse;
    
    return "I'd be happy to help you find flights! Could you please provide the departure city, destination, and travel date? For example: 'Find flights from Delhi to Mumbai on 15th July' or 'Show flights Mumbai to Delhi on 3rd Apr'";
  }

  // If we have flight search results
  if (searchParams && flights && flights.length > 0) {
    console.log(`Generating response for ${flights.length} flights from ${searchParams.source} to ${searchParams.destination}`);
    
    // Add cities to conversation context for future reference
    conversationContext.mentionedCities.add(searchParams.source);
    conversationContext.mentionedCities.add(searchParams.destination);
    conversationContext.lastTopic = 'flight_results';
    
    // Sort flights by price (cheapest first)
    const sortedFlights = [...flights].sort((a, b) => a.price - b.price);
    
    const cheapestFlight = sortedFlights[0];
    
    // Find fastest flight by calculating duration
    const fastestFlight = flights.reduce((prev, current) => {
      const prevDuration = new Date(prev.arrival_time).getTime() - new Date(prev.departure_time).getTime();
      const currDuration = new Date(current.arrival_time).getTime() - new Date(current.departure_time).getTime();
      return (prevDuration < currDuration) ? prev : current;
    });
    
    const departureTime = new Date(cheapestFlight.departure_time);
    const arrivalTime = new Date(cheapestFlight.arrival_time);

    const durationMinutes = Math.floor((arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    // Limit to 5 flights maximum to prevent overwhelming the UI
    const flightsToShow = sortedFlights.slice(0, 5);
    console.log(`Showing ${flightsToShow.length} flights in results`);

    // Add variation to the flight results intro
    const intros = [
      `Great news! I found ${flights.length} flights from ${searchParams.source} to ${searchParams.destination} on ${searchParams.date.toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'})}.`,
      `I've found ${flights.length} flight options for your trip from ${searchParams.source} to ${searchParams.destination} on ${searchParams.date.toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'})}.`,
      `Here are ${flights.length} flights available from ${searchParams.source} to ${searchParams.destination} on ${searchParams.date.toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'})}.`,
      `I've discovered ${flights.length} flights matching your search from ${searchParams.source} to ${searchParams.destination} on ${searchParams.date.toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'})}.`
    ];

    const randomIntro = intros[Math.floor(Math.random() * intros.length)];
    
    let flightResultsXml = '';
    
    // Create the flight results XML structure
    flightsToShow.forEach(flight => {
      const depTime = new Date(flight.departure_time);
      const arrTime = new Date(flight.arrival_time);
      const flightDuration = Math.floor((arrTime.getTime() - depTime.getTime()) / (1000 * 60));
      const flightHours = Math.floor(flightDuration / 60);
      const flightMinutes = flightDuration % 60;
      
      flightResultsXml += `
<flight>
<airline>${flight.airline}</airline>
<flight-number>${flight.flight_number}</flight-number>
<departure>${format(depTime, 'HH:mm')}</departure>
<arrival>${format(arrTime, 'HH:mm')}</arrival>
<duration>${flightHours}h ${flightMinutes}m</duration>
<price>${formatPrice(flight.price)}</price>
</flight>`;
    });
    
    console.log(`Generated ${flightResultsXml.length} characters of flight XML`);

    const response = `${randomIntro}

<flight-results>${flightResultsXml}
</flight-results>

The best deal I found is with ${cheapestFlight.airline} at ${formatPrice(cheapestFlight.price)}. This flight (${cheapestFlight.flight_number}) departs at ${departureTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} and arrives at ${arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}, with a total flight time of ${hours}h ${minutes}m.

Would you like me to:
1. Filter for non-stop flights only?
2. Sort by shortest duration?
3. Find flights with a specific airline?
4. Notify you if prices drop for this route?

Just let me know how I can refine these results for you.`;

    console.log(`Final response length: ${response.length}`);
    return response;
  }

  // For all other messages, try using Gemini for a more varied and contextual response
  console.log('Trying Gemini API for general response');
  try {
    const geminiResponse = await getGeminiResponse(userMessage, currentContext);
    if (geminiResponse) {
      console.log('Using Gemini response for general message');
      return geminiResponse;
    }
  } catch (error) {
    console.error('Error using Gemini API:', error);
  }
  
  console.log('Falling back to hardcoded general responses');
  // If Gemini fails, use fallback responses
  // If asking about specific airlines
  if (userMessage.toLowerCase().includes('indigo') || 
      userMessage.toLowerCase().includes('air india') ||
      userMessage.toLowerCase().includes('vistara')) {
    
    const airline = userMessage.toLowerCase().includes('indigo') ? 'IndiGo' : 
                   userMessage.toLowerCase().includes('air india') ? 'Air India' : 'Vistara';
    
    conversationContext.mentionedAirlines.add(airline.toLowerCase());
    conversationContext.lastTopic = 'airline_info';
                   
    return `${airline} operates multiple flights on many popular routes in India. Their typical fare range varies based on the route, time of booking, and season. For the most accurate pricing and availability, I recommend searching for your specific route and dates. Would you like me to help you search for ${airline} flights?`;
  }

  // If asking for travel tips
  if (userMessage.toLowerCase().includes('tip') || userMessage.toLowerCase().includes('advice')) {
    conversationContext.lastTopic = 'travel_tips';
    
    const tips = [
      "For domestic flights in India, try booking your flight 4-6 weeks in advance for the best deals.",
      "Tuesday, Wednesday, and Saturday are typically the cheapest days to fly within India, while Friday and Sunday are usually the most expensive.",
      "Setting up price alerts can help you catch sudden price drops for your desired route.",
      "Consider nearby airports for potentially better deals - for example, if flying to Mumbai, check both BOM and nearby options.",
      "The lowest airfares in India are typically found during the monsoon season (June to September) and during weekdays rather than weekends.",
      "Some credit cards offer special discounts on flight bookings - check if your bank has any ongoing offers.",
      "Booking very early morning or late night flights (red-eye flights) can often save you money as they're less popular time slots.",
      "Consider connecting flights if you're on a budget, as they're often cheaper than direct flights.",
      "If your travel dates are flexible, use the 'flexible dates' option when searching to find the cheapest days to fly.",
      "Many airlines offer lower fares if you book a round trip rather than two one-way tickets."
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // If asking about price alerts
  if (userMessage.toLowerCase().includes('alert') || userMessage.toLowerCase().includes('notify')) {
    conversationContext.lastTopic = 'price_alerts';
    
    return "I can notify you when prices drop for your preferred routes. Just search for a flight, and I'll monitor the prices for you and send you an alert when I find a good deal. To activate this feature, please search for your route first, and then I can set up alerts for you.";
  }

  // If asking about best time to book
  if (userMessage.toLowerCase().includes('when') && 
      (userMessage.toLowerCase().includes('book') || userMessage.toLowerCase().includes('buy'))) {
    conversationContext.lastTopic = 'booking_timing';
    
    return "The best time to book domestic flights in India is typically 4-6 weeks before your travel date. For international flights from India, booking 3-5 months in advance usually gets you the best rates. However, this can vary based on season and destination. Flash sales from airlines like IndiGo, SpiceJet, and Air India can offer significant discounts, so it's worth signing up for their newsletters.";
  }

  // Default responses - more varied
  const defaultResponses = [
    "I can help you find the best flight deals. Try asking me to search for flights between specific cities. For example: 'Find flights from Delhi to Mumbai on July 15th'.",
    "Looking for flight information? Just tell me where you want to go and when. For example: 'Search for flights from Bangalore to Kolkata next week'.",
    "Would you like me to provide some tips on finding the best airfare deals in India?",
    "I'm your AI flight assistant. I can help with flight searches, price monitoring, and travel tips for both domestic and international flights from India.",
    "Ask me to find flights for you! Just provide the departure city, destination, and travel date.",
    "I can find flights, provide travel recommendations, or share travel tips. What would you like to know?",
    "Looking to travel somewhere? I can help you find flights, compare prices, and get the best deals. Just let me know your destination!",
    "Need help planning your trip? I can search for flights, provide travel advice, or answer questions about airlines and destinations."
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Create a starting conversation
export const getInitialMessages = (): Message[] => {
  const greetings = [
    "Hi there! I'm Flight Friend, your AI travel assistant. I can help you find flights, monitor prices, and provide travel tips. What can I help you with today?",
    "Hello! I'm your Flight Friend assistant. I can help you search for flights, track prices, and offer travel advice. Where would you like to travel?",
    "Welcome to Flight Friend! I'm here to help with your travel needs. Ask me about flights, destinations, or travel tips. How can I assist you today?",
    "Greetings! I'm your AI travel companion. I can find flight options, answer travel questions, and provide recommendations. What are your travel plans?"
  ];
  
  return [
    {
      id: uuidv4(),
      content: greetings[Math.floor(Math.random() * greetings.length)],
      type: 'bot',
      timestamp: new Date(),
    }
  ];
};

// Parse special XML tags in bot messages and extract data
export const parseFlightSearchCommand = (message: string): FlightSearchParams | null => {
  const searchMatch = message.match(/<flight-search\s+source="([^"]+)"\s+destination="([^"]+)"\s+date="([^"]+)"\s*\/>/);
  
  if (searchMatch) {
    const [_, source, destination, dateStr] = searchMatch;
    const date = new Date(dateStr);
    
    return {
      source,
      destination,
      date
    };
  }
  
  return null;
};