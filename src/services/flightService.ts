import { v4 as uuidv4 } from 'uuid';

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
const mockAirlines = ['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'GoAir', 'AirAsia India'];
const mockFlightNumbers = ['AI2014', 'IG3456', 'SG7890', 'UK4567', 'G82345', 'I57891'];
const mockAirlineCodes = ['AI', 'IG', 'SG', 'UK', 'G8', 'I5'];

// Helper to generate random flights
const generateMockFlights = (params: FlightSearchParams, count = 8): Flight[] => {
  const flights: Flight[] = [];
  const basePrice = Math.floor(Math.random() * 3000) + 3000; // Random base price between 3000 and 6000
  
  const formattedDate = params.date.toISOString().split('T')[0];
  
  for (let i = 0; i < count; i++) {
    const airlineIndex = Math.floor(Math.random() * mockAirlines.length);
    const airline = mockAirlines[airlineIndex];
    const flightNumber = mockFlightNumbers[airlineIndex];
    
    // Generate random departure and arrival times
    const departureHour = Math.floor(Math.random() * 14) + 6; // 6 AM to 8 PM
    const durationMinutes = Math.floor(Math.random() * 120) + 60; // 1-3 hour flight
    
    const departureTime = new Date(`${formattedDate}T${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`);
    const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60000);
    
    const flight: Flight = {
      id: uuidv4(),
      airline,
      flight_number: flightNumber,
      departure_airport: params.source,
      arrival_airport: params.destination,
      departure_time: departureTime.toISOString(),
      arrival_time: arrivalTime.toISOString(),
      price: basePrice + Math.floor(Math.random() * 2000) - 1000, // Add some variance
      currency: 'INR',
      duration_minutes: durationMinutes,
      non_stop: true,
    };
    
    flights.push(flight);
  }
  
  // Sort by price
  return flights.sort((a, b) => a.price - b.price);
};

// Simulated flight search function
export const searchFlights = async (params: FlightSearchParams): Promise<Flight[]> => {
  console.log(`Searching flights from ${params.source} to ${params.destination} on ${params.date.toLocaleDateString()}`);
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock flights
    const flights = generateMockFlights(params);
    console.log(`Found ${flights.length} flights for ${params.source} to ${params.destination}`);
    return flights;
  } catch (error) {
    console.error('Error searching flights:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

// Simulated function to get flight deals
export const getFlightDeals = async (params: FlightSearchParams): Promise<FlightDeal | null> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const basePrice = Math.floor(Math.random() * 3000) + 3000;
    const discountedPrice = basePrice - Math.floor(basePrice * (Math.random() * 0.3 + 0.1)); // 10-40% discount
    
    const airlineIndex = Math.floor(Math.random() * mockAirlines.length);
    
    const deal: FlightDeal = {
      id: uuidv4(),
      source: params.source,
      destination: params.destination,
      price: discountedPrice,
      oldPrice: basePrice,
      currency: 'INR',
      date: params.date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      airline: mockAirlines[airlineIndex],
    };
    
    return deal;
  } catch (error) {
    console.error('Error getting flight deals:', error);
    return null;
  }
};
