import {
  API_KEYS,
  API_BASE_URLS,
  API_ENDPOINTS,
  IS_DEV,
  ENABLE_MOCKS,
} from "./apiKeys";

interface FlightResponse {
  data: Array<{
    flight: {
      number: string;
      iata: string;
      icao: string;
    };
    departure: {
      airport: string;
      timezone: string;
      scheduled: string;
      estimated: string;
      actual: string | null;
      terminal: string | null;
      gate: string | null;
    };
    arrival: {
      airport: string;
      timezone: string;
      scheduled: string;
      estimated: string;
      actual: string | null;
      terminal: string | null;
      gate: string | null;
      baggage: string | null;
    };
    airline: {
      name: string;
      iata: string;
      icao: string;
    };
    aircraft: {
      registration: string | null;
      iata: string | null;
      icao: string | null;
      model: string | null;
    };
    status: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
}

interface AirportResponse {
  data: Array<{
    airport_name: string;
    iata_code: string;
    icao_code: string;
    latitude: number;
    longitude: number;
    geoname_id: number;
    timezone: string;
    gmt: string;
    phone_number: string | null;
    country_name: string;
    country_iso2: string;
    city_iata_code: string;
  }>;
}

interface AirlineResponse {
  data: Array<{
    airline_name: string;
    iata_code: string;
    icao_code: string;
    fleet_size: string;
    status: string;
  }>;
}

export class AviationstackService {
  private static instance: AviationstackService;
  private apiKey: string;
  private useMocks: boolean;

  private constructor() {
    this.apiKey = API_KEYS.AVIATIONSTACK;
    this.useMocks = ENABLE_MOCKS || (!this.apiKey && IS_DEV);

    if (!this.apiKey) {
      console.warn(
        "No AviationStack API key found in environment variables. Using mock responses."
      );
      this.useMocks = true;
    }

    console.log(
      `AviationStack service initialized with ${
        this.useMocks ? "MOCK" : "REAL"
      } responses`
    );
  }

  public static getInstance(): AviationstackService {
    if (!AviationstackService.instance) {
      AviationstackService.instance = new AviationstackService();
    }
    return AviationstackService.instance;
  }

  async getFlights(params: {
    flight_iata?: string;
    flight_icao?: string;
    airline_name?: string;
    airline_iata?: string;
    airline_icao?: string;
    flight_number?: string;
    departure_iata?: string;
    departure_icao?: string;
    arrival_iata?: string;
    arrival_icao?: string;
    flight_status?: string;
    min_delay_arr?: number;
    max_delay_arr?: number;
    min_delay_dep?: number;
    max_delay_dep?: number;
    limit?: number;
    offset?: number;
  }): Promise<FlightResponse> {
    try {
      // Use mock data if in development or no API key
      if (this.useMocks) {
        console.log(
          "Using mock flight data because useMocks is true. API Key:",
          this.apiKey ? "Present" : "Missing"
        );
        return this.getMockFlights(params);
      }

      const queryParams = new URLSearchParams();
      queryParams.append("access_key", this.apiKey);

      // Add all parameters to queryParams
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${API_BASE_URLS.AVIATIONSTACK}${API_ENDPOINTS.AVIATIONSTACK.FLIGHTS}?${queryParams}`;
      console.log("Making AviationStack API request to:", url);

      const response = await fetch(url);
      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `AviationStack API error (${response.status}):`,
          errorText
        );

        if (response.status === 401) {
          console.error("Authentication failed. Invalid API key.");
        }

        return this.getMockFlights(params);
      }

      const data = await response.json();
      console.log("API Response data:", data);
      return data;
    } catch (error) {
      console.error("Error in AviationStack API:", error);
      return this.getMockFlights(params);
    }
  }

  async getAirports(params: {
    country_iso2?: string;
    city_iata_code?: string;
    limit?: number;
    offset?: number;
  }): Promise<AirportResponse> {
    try {
      // Use mock data if in development or no API key
      if (this.useMocks) {
        console.log("Using mock airport data instead of API");
        return this.getMockAirports(params);
      }

      const queryParams = new URLSearchParams();
      queryParams.append("access_key", this.apiKey);

      // Add all parameters to queryParams
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${API_BASE_URLS.AVIATIONSTACK}${API_ENDPOINTS.AVIATIONSTACK.AIRPORTS}?${queryParams}`
      );

      if (!response.ok) {
        console.error(`AviationStack API error: ${response.statusText}`);
        return this.getMockAirports(params);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in AviationStack API:", error);
      return this.getMockAirports(params);
    }
  }

  async getAirlines(params: {
    country_iso2?: string;
    limit?: number;
    offset?: number;
  }): Promise<AirlineResponse> {
    try {
      // Use mock data if in development or no API key
      if (this.useMocks) {
        console.log("Using mock airline data instead of API");
        return this.getMockAirlines(params);
      }

      const queryParams = new URLSearchParams();
      queryParams.append("access_key", this.apiKey);

      // Add all parameters to queryParams
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${API_BASE_URLS.AVIATIONSTACK}${API_ENDPOINTS.AVIATIONSTACK.AIRLINES}?${queryParams}`
      );

      if (!response.ok) {
        console.error(`AviationStack API error: ${response.statusText}`);
        return this.getMockAirlines(params);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in AviationStack API:", error);
      return this.getMockAirlines(params);
    }
  }

  // Mock data generation functions
  private getMockFlights(params: any): FlightResponse {
    const flightData = [];
    const count = params.limit || 10;

    const airlines = [
      { name: "Air India", iata: "AI", icao: "AIC" },
      { name: "IndiGo", iata: "IG", icao: "IGO" },
      { name: "SpiceJet", iata: "SG", icao: "SEJ" },
      { name: "Vistara", iata: "UK", icao: "VTI" },
      { name: "GoAir", iata: "G8", icao: "GOW" },
    ];

    const cities = ["DEL", "BOM", "BLR", "CCU", "MAA", "HYD", "PNQ"];

    // Use provided departure and arrival if available
    const departure =
      params.departure_iata ||
      cities[Math.floor(Math.random() * cities.length)];
    const arrival =
      params.arrival_iata || cities[Math.floor(Math.random() * cities.length)];

    for (let i = 0; i < count; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const flightNumber = Math.floor(Math.random() * 9000) + 1000;

      // Create random scheduled times
      const now = new Date();
      const departureTime = new Date(
        now.getTime() + Math.random() * 24 * 60 * 60 * 1000
      );
      const arrivalTime = new Date(
        departureTime.getTime() + Math.random() * 5 * 60 * 60 * 1000
      );

      flightData.push({
        flight: {
          number: flightNumber.toString(),
          iata: `${airline.iata}${flightNumber}`,
          icao: `${airline.icao}${flightNumber}`,
        },
        departure: {
          airport: departure,
          timezone: "Asia/Kolkata",
          scheduled: departureTime.toISOString(),
          estimated: departureTime.toISOString(),
          actual: null,
          terminal: `T${Math.floor(Math.random() * 3) + 1}`,
          gate: `G${Math.floor(Math.random() * 20) + 1}`,
        },
        arrival: {
          airport: arrival,
          timezone: "Asia/Kolkata",
          scheduled: arrivalTime.toISOString(),
          estimated: arrivalTime.toISOString(),
          actual: null,
          terminal: `T${Math.floor(Math.random() * 3) + 1}`,
          gate: `G${Math.floor(Math.random() * 20) + 1}`,
          baggage: `B${Math.floor(Math.random() * 5) + 1}`,
        },
        airline: airline,
        aircraft: {
          registration: `VT-${String.fromCharCode(
            65 + Math.floor(Math.random() * 26)
          )}${String.fromCharCode(
            65 + Math.floor(Math.random() * 26)
          )}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          iata: "A320",
          icao: "A320",
          model: "Airbus A320",
        },
        status: "scheduled",
      });
    }

    return {
      data: flightData,
      pagination: {
        limit: count,
        offset: params.offset || 0,
        count: flightData.length,
        total: 100, // Mock total
      },
    };
  }

  private getMockAirports(params: any): AirportResponse {
    const airports = [
      {
        airport_name: "Indira Gandhi International Airport",
        iata_code: "DEL",
        icao_code: "VIDP",
        latitude: 28.5665,
        longitude: 77.1031,
        geoname_id: 1261481,
        timezone: "Asia/Kolkata",
        gmt: "+05:30",
        phone_number: null,
        country_name: "India",
        country_iso2: "IN",
        city_iata_code: "DEL",
      },
      {
        airport_name: "Chhatrapati Shivaji Maharaj International Airport",
        iata_code: "BOM",
        icao_code: "VABB",
        latitude: 19.0887,
        longitude: 72.8679,
        geoname_id: 1275339,
        timezone: "Asia/Kolkata",
        gmt: "+05:30",
        phone_number: null,
        country_name: "India",
        country_iso2: "IN",
        city_iata_code: "BOM",
      },
      {
        airport_name: "Kempegowda International Airport",
        iata_code: "BLR",
        icao_code: "VOBL",
        latitude: 13.1979,
        longitude: 77.7063,
        geoname_id: 1277333,
        timezone: "Asia/Kolkata",
        gmt: "+05:30",
        phone_number: null,
        country_name: "India",
        country_iso2: "IN",
        city_iata_code: "BLR",
      },
      {
        airport_name: "Chennai International Airport",
        iata_code: "MAA",
        icao_code: "VOMM",
        latitude: 12.9941,
        longitude: 80.1709,
        geoname_id: 1264527,
        timezone: "Asia/Kolkata",
        gmt: "+05:30",
        phone_number: null,
        country_name: "India",
        country_iso2: "IN",
        city_iata_code: "MAA",
      },
      {
        airport_name: "Netaji Subhas Chandra Bose International Airport",
        iata_code: "CCU",
        icao_code: "VECC",
        latitude: 22.6549,
        longitude: 88.4467,
        geoname_id: 1275004,
        timezone: "Asia/Kolkata",
        gmt: "+05:30",
        phone_number: null,
        country_name: "India",
        country_iso2: "IN",
        city_iata_code: "CCU",
      },
    ];

    // Filter by country if provided
    let filteredAirports = airports;
    if (params.country_iso2) {
      filteredAirports = airports.filter(
        (airport) => airport.country_iso2 === params.country_iso2
      );
    }

    // Filter by city if provided
    if (params.city_iata_code) {
      filteredAirports = filteredAirports.filter(
        (airport) => airport.city_iata_code === params.city_iata_code
      );
    }

    // Apply pagination
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const paginatedAirports = filteredAirports.slice(offset, offset + limit);

    return {
      data: paginatedAirports,
    };
  }

  private getMockAirlines(params: any): AirlineResponse {
    const airlines = [
      {
        airline_name: "Air India",
        iata_code: "AI",
        icao_code: "AIC",
        fleet_size: "127",
        status: "active",
      },
      {
        airline_name: "IndiGo",
        iata_code: "IG",
        icao_code: "IGO",
        fleet_size: "275",
        status: "active",
      },
      {
        airline_name: "SpiceJet",
        iata_code: "SG",
        icao_code: "SEJ",
        fleet_size: "75",
        status: "active",
      },
      {
        airline_name: "Vistara",
        iata_code: "UK",
        icao_code: "VTI",
        fleet_size: "54",
        status: "active",
      },
      {
        airline_name: "GoAir",
        iata_code: "G8",
        icao_code: "GOW",
        fleet_size: "56",
        status: "active",
      },
    ];

    // Filter by country if provided
    let filteredAirlines = airlines;
    if (params.country_iso2) {
      filteredAirlines = filteredAirlines.filter(
        (airline) => airline.status === "active"
      );
    }

    // Apply pagination
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const paginatedAirlines = filteredAirlines.slice(offset, offset + limit);

    return {
      data: paginatedAirlines,
    };
  }
}
