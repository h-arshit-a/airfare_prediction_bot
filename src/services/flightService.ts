import { v4 as uuidv4 } from "uuid";
import { AviationstackService } from "../config/api/aviationstackService";
import { API_KEYS, ENABLE_MOCKS, IS_DEV } from "../config/api/apiKeys";

// Types
export interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  currency: string;
  duration_minutes?: number;
  non_stop?: boolean;
}

export interface FlightSearchParams {
  source: string;
  destination: string;
  date: Date;
}

export interface FlightDeal {
  id: string;
  source: string;
  destination: string;
  price: number;
  oldPrice?: number;
  currency: string;
  date: string;
  airline: string;
}

// Mock airlines and data
const mockAirlines = [
  "Air India",
  "IndiGo",
  "SpiceJet",
  "Vistara",
  "GoAir",
  "AirAsia India",
];
const mockFlightNumbers = [
  "AI2014",
  "IG3456",
  "SG7890",
  "UK4567",
  "G82345",
  "I57891",
];
const mockAirlineCodes = ["AI", "IG", "SG", "UK", "G8", "I5"];

// Helper to generate random flights
const generateMockFlights = (
  params: FlightSearchParams,
  count = 8
): Flight[] => {
  const flights: Flight[] = [];
  const basePrice = Math.floor(Math.random() * 3000) + 3000; // Random base price between 3000 and 6000

  const formattedDate = params.date.toISOString().split("T")[0];

  for (let i = 0; i < count; i++) {
    const airlineIndex = Math.floor(Math.random() * mockAirlines.length);
    const airline = mockAirlines[airlineIndex];
    const flightNumber = mockFlightNumbers[airlineIndex];

    // Generate random departure and arrival times
    const departureHour = Math.floor(Math.random() * 14) + 6; // 6 AM to 8 PM
    const durationMinutes = Math.floor(Math.random() * 120) + 60; // 1-3 hour flight

    const departureTime = new Date(
      `${formattedDate}T${departureHour
        .toString()
        .padStart(2, "0")}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}:00`
    );
    const arrivalTime = new Date(
      departureTime.getTime() + durationMinutes * 60000
    );

    const flight: Flight = {
      id: uuidv4(),
      airline,
      flight_number: flightNumber,
      departure_airport: params.source,
      arrival_airport: params.destination,
      departure_time: departureTime.toISOString(),
      arrival_time: arrivalTime.toISOString(),
      price: basePrice + Math.floor(Math.random() * 2000) - 1000, // Add some variance
      currency: "INR",
      duration_minutes: durationMinutes,
      non_stop: true,
    };

    flights.push(flight);
  }

  // Sort by price
  return flights.sort((a, b) => a.price - b.price);
};

// Convert Aviationstack flight data to our Flight format
const convertAviationstackFlights = (
  data: any,
  source: string,
  destination: string
): Flight[] => {
  if (!data || !data.data || !Array.isArray(data.data)) {
    console.error("Invalid flight data format from Aviationstack");
    return [];
  }

  return data.data
    .map((flightData: any) => {
      // Calculate duration in minutes
      const departureTime = new Date(flightData.departure.scheduled);
      const arrivalTime = new Date(flightData.arrival.scheduled);
      const durationMinutes = Math.round(
        (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60)
      );

      // Generate a random price since Aviationstack doesn't provide prices
      const basePrice = Math.floor(Math.random() * 3000) + 3000;

      return {
        id: uuidv4(),
        airline: flightData.airline.name,
        flight_number: flightData.flight.iata,
        departure_airport: source,
        arrival_airport: destination,
        departure_time: flightData.departure.scheduled,
        arrival_time: flightData.arrival.scheduled,
        price: basePrice + Math.floor(Math.random() * 2000) - 1000,
        currency: "INR",
        duration_minutes: durationMinutes,
        non_stop: true,
      };
    })
    .sort((a, b) => a.price - b.price);
};

// Flight search function that uses AviationstackService when available
export const searchFlights = async (
  params: FlightSearchParams
): Promise<Flight[]> => {
  console.log(
    `Searching flights from ${params.source} to ${
      params.destination
    } on ${params.date.toLocaleDateString()}`
  );

  try {
    // Check if we should use real API or mocks
    const useRealApi = !ENABLE_MOCKS && !IS_DEV && API_KEYS.AVIATIONSTACK;

    if (useRealApi) {
      console.log("Using Aviationstack API for flight search");
      const aviationstackService = AviationstackService.getInstance();

      // Format date for API (YYYY-MM-DD)
      const formattedDate = params.date.toISOString().split("T")[0];

      // Search for flights
      const response = await aviationstackService.getFlights({
        departure_iata: params.source,
        arrival_iata: params.destination,
        limit: 10,
      });

      // Convert response to our Flight format
      const flights = convertAviationstackFlights(
        response,
        params.source,
        params.destination
      );
      console.log(`Found ${flights.length} flights from Aviationstack API`);
      return flights;
    } else {
      console.log("Using mock flight data");
      // Generate mock flights
      const flights = generateMockFlights(params);
      console.log(
        `Found ${flights.length} flights for ${params.source} to ${params.destination}`
      );
      return flights;
    }
  } catch (error) {
    console.error("Error searching flights:", error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

// Simulated function to get flight deals
export const getFlightDeals = async (
  params: FlightSearchParams
): Promise<FlightDeal | null> => {
  try {
    // Check if we should use real API or mocks
    const useRealApi = !ENABLE_MOCKS && !IS_DEV && API_KEYS.AVIATIONSTACK;

    if (useRealApi) {
      console.log("Using Aviationstack API for flight deals");
      const aviationstackService = AviationstackService.getInstance();

      // Format date for API (YYYY-MM-DD)
      const formattedDate = params.date.toISOString().split("T")[0];

      // Search for flights
      const response = await aviationstackService.getFlights({
        departure_iata: params.source,
        arrival_iata: params.destination,
        limit: 1,
      });

      if (!response || !response.data || response.data.length === 0) {
        console.log("No flights found from Aviationstack API");
        return null;
      }

      // Get the first flight
      const flightData = response.data[0];

      // Calculate a discounted price
      const basePrice = Math.floor(Math.random() * 3000) + 3000;
      const discountedPrice =
        basePrice - Math.floor(basePrice * (Math.random() * 0.3 + 0.1)); // 10-40% discount

      const deal: FlightDeal = {
        id: uuidv4(),
        source: params.source,
        destination: params.destination,
        price: discountedPrice,
        oldPrice: basePrice,
        currency: "INR",
        date: params.date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        airline: flightData.airline.name,
      };

      return deal;
    } else {
      console.log("Using mock flight deal data");
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const basePrice = Math.floor(Math.random() * 3000) + 3000;
      const discountedPrice =
        basePrice - Math.floor(basePrice * (Math.random() * 0.3 + 0.1)); // 10-40% discount

      const airlineIndex = Math.floor(Math.random() * mockAirlines.length);

      const deal: FlightDeal = {
        id: uuidv4(),
        source: params.source,
        destination: params.destination,
        price: discountedPrice,
        oldPrice: basePrice,
        currency: "INR",
        date: params.date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        airline: mockAirlines[airlineIndex],
      };

      return deal;
    }
  } catch (error) {
    console.error("Error getting flight deals:", error);
    return null;
  }
};
