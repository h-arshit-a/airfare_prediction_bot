import React, { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import { ArrowLeft, ArrowRight, Clock, Lock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flight } from "@/services/flightService";
import { cn } from "@/lib/utils";

interface FlightResultsListProps {
  flights: Flight[];
  searchDate: Date;
  source: string;
  destination: string;
}

type SortType = "price" | "duration" | "best";

const FlightResultsList: React.FC<FlightResultsListProps> = ({
  flights,
  searchDate,
  source,
  destination,
}) => {
  const [sortType, setSortType] = useState<SortType>("price");

  // Memoize sorted flights to prevent unnecessary re-sorting
  const sortedFlights = useMemo(() => {
    const flightsCopy = [...flights];

    switch (sortType) {
      case "price":
        return flightsCopy.sort((a, b) => a.price - b.price);
      case "duration":
        return flightsCopy.sort((a, b) => {
          const durationA =
            new Date(b.arrival_time).getTime() -
            new Date(a.departure_time).getTime();
          const durationB =
            new Date(a.arrival_time).getTime() -
            new Date(b.departure_time).getTime();
          return durationA - durationB;
        });
      case "best":
        // Sort by a combination of price and duration
        return flightsCopy.sort((a, b) => {
          const durationA =
            new Date(a.arrival_time).getTime() -
            new Date(a.departure_time).getTime();
          const durationB =
            new Date(b.arrival_time).getTime() -
            new Date(b.departure_time).getTime();
          const priceScoreA = a.price / (durationA / (1000 * 60 * 60)); // Price per hour
          const priceScoreB = b.price / (durationB / (1000 * 60 * 60));
          return priceScoreA - priceScoreB;
        });
      default:
        return flightsCopy;
    }
  }, [flights, sortType]);

  if (flights.length === 0) {
    return null;
  }

  // Get cheapest flight
  const cheapestFlight = flights.reduce((prev, current) =>
    prev.price < current.price ? prev : current
  );

  // Generate dates for date carousel
  const dates = Array.from({ length: 7 }, (_, i) => addDays(searchDate, i - 3));

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-background p-4 border-b">
        <h2 className="text-xl font-bold">
          Flights from {source} to {destination}
        </h2>
      </div>

      {/* Date selector carousel */}
      <div className="relative bg-white border-b">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex overflow-x-auto py-2 px-8">
          {dates.map((date, index) => {
            const isSelected = index === 3; // Middle date is selected
            const price = 4000 + Math.floor(Math.random() * 1500);

            return (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 w-[140px] text-center py-2 px-4 cursor-pointer transition-all border-b-2",
                  isSelected ? "border-primary" : "border-transparent",
                  isSelected ? "" : "hover:bg-muted/50"
                )}
              >
                <div className="text-sm font-medium">
                  {format(date, "EEE, MMM d")}
                </div>
                <div
                  className={cn(
                    "mt-1",
                    isSelected ? "text-primary font-bold" : ""
                  )}
                >
                  ₹{price.toLocaleString("en-IN")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs
        defaultValue="price"
        className="w-full"
        onValueChange={(value) => setSortType(value as SortType)}
      >
        <TabsList className="w-full justify-start p-0 border-b bg-white rounded-none h-auto">
          <TabsTrigger
            value="price"
            className="data-[state=active]:bg-blue-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:rounded-none py-3 px-4"
          >
            <span className="rounded-md bg-blue-100 p-2 mr-2 text-primary">
              ₹
            </span>
            CHEAPEST
            <span className="text-sm text-muted-foreground ml-2">
              ₹{cheapestFlight.price} |{" "}
              {format(new Date(cheapestFlight.departure_time), "HH:mm")} -{" "}
              {format(new Date(cheapestFlight.arrival_time), "HH:mm")}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="duration"
            className="data-[state=active]:bg-blue-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:rounded-none py-3 px-4"
          >
            <span className="rounded-md bg-gray-200 p-2 mr-2">⚡</span>
            FASTEST
          </TabsTrigger>
          <TabsTrigger
            value="best"
            className="data-[state=active]:bg-blue-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:rounded-none py-3 px-4"
          >
            <span className="rounded-md bg-gray-200 p-2 mr-2">★</span>
            BEST VALUE
          </TabsTrigger>
        </TabsList>

        <div className="p-4 text-sm text-muted-foreground border-b">
          {sortType === "price" &&
            "Flights sorted by Lowest fares on this route"}
          {sortType === "duration" && "Flights sorted by Shortest duration"}
          {sortType === "best" &&
            "Flights sorted by Best value (price per hour)"}
        </div>

        <TabsContent value="price" className="mt-0">
          {sortedFlights.map((flight) => (
            <div
              key={flight.id}
              className="border-b last:border-b-0 p-4 hover:bg-muted/10"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                {/* Airline info */}
                <div className="flex items-center w-full md:w-1/4">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mr-3">
                    <span className="font-bold text-xs">
                      {flight.airline.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{flight.airline}</div>
                    <div className="text-xs text-muted-foreground">
                      {flight.flight_number}
                    </div>
                  </div>
                </div>

                {/* Flight times */}
                <div className="flex items-center justify-between w-full md:w-2/4">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {format(new Date(flight.departure_time), "HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.departure_airport}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mx-4">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(
                        (new Date(flight.arrival_time).getTime() -
                          new Date(flight.departure_time).getTime()) /
                          (1000 * 60)
                      )}{" "}
                      min
                    </div>
                    <div className="w-24 h-[1px] bg-gray-300 relative">
                      <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-gray-400 transform -translate-y-1/2"></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Non stop
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {format(new Date(flight.arrival_time), "HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.arrival_airport}
                    </div>
                  </div>
                </div>

                {/* Price info */}
                <div className="flex flex-col items-end w-full md:w-1/4">
                  <div className="text-xl font-bold text-right">
                    ₹{flight.price.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground">per adult</div>
                  <Button className="mt-2 text-sm">VIEW PRICES</Button>

                  {/* Price lock info */}
                  {Math.random() > 0.5 && (
                    <div className="flex items-center text-xs text-blue-600 mt-2">
                      <Lock className="h-3 w-3 mr-1" />
                      <span>
                        Lock this price starting from ₹
                        {Math.floor(flight.price * 0.05).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Promotion */}
              {Math.random() > 0.3 && (
                <div className="mt-3 bg-orange-50 text-orange-700 rounded-sm p-2 text-xs flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  <span>
                    Get ₹
                    {Math.floor(Math.random() * 300).toLocaleString("en-IN")}{" "}
                    off using MMTPROMO
                  </span>
                </div>
              )}

              {/* Details link */}
              <div className="mt-3 text-right">
                <Button variant="link" className="text-sm p-0">
                  View Flight Details
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="duration" className="mt-0">
          {sortedFlights.map((flight) => (
            <div
              key={flight.id}
              className="border-b last:border-b-0 p-4 hover:bg-muted/10"
            >
              {/* Same flight card structure as price tab */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                {/* Airline info */}
                <div className="flex items-center w-full md:w-1/4">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mr-3">
                    <span className="font-bold text-xs">
                      {flight.airline.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{flight.airline}</div>
                    <div className="text-xs text-muted-foreground">
                      {flight.flight_number}
                    </div>
                  </div>
                </div>

                {/* Flight times */}
                <div className="flex items-center justify-between w-full md:w-2/4">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {format(new Date(flight.departure_time), "HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.departure_airport}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mx-4">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(
                        (new Date(flight.arrival_time).getTime() -
                          new Date(flight.departure_time).getTime()) /
                          (1000 * 60)
                      )}{" "}
                      min
                    </div>
                    <div className="w-24 h-[1px] bg-gray-300 relative">
                      <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-gray-400 transform -translate-y-1/2"></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Non stop
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {format(new Date(flight.arrival_time), "HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.arrival_airport}
                    </div>
                  </div>
                </div>

                {/* Price info */}
                <div className="flex flex-col items-end w-full md:w-1/4">
                  <div className="text-xl font-bold text-right">
                    ₹{flight.price.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground">per adult</div>
                  <Button className="mt-2 text-sm">VIEW PRICES</Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="best" className="mt-0">
          {sortedFlights.map((flight) => (
            <div
              key={flight.id}
              className="border-b last:border-b-0 p-4 hover:bg-muted/10"
            >
              {/* Same flight card structure as price tab */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                {/* Airline info */}
                <div className="flex items-center w-full md:w-1/4">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mr-3">
                    <span className="font-bold text-xs">
                      {flight.airline.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{flight.airline}</div>
                    <div className="text-xs text-muted-foreground">
                      {flight.flight_number}
                    </div>
                  </div>
                </div>

                {/* Flight times */}
                <div className="flex items-center justify-between w-full md:w-2/4">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {format(new Date(flight.departure_time), "HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.departure_airport}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mx-4">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(
                        (new Date(flight.arrival_time).getTime() -
                          new Date(flight.departure_time).getTime()) /
                          (1000 * 60)
                      )}{" "}
                      min
                    </div>
                    <div className="w-24 h-[1px] bg-gray-300 relative">
                      <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-gray-400 transform -translate-y-1/2"></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Non stop
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {format(new Date(flight.arrival_time), "HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.arrival_airport}
                    </div>
                  </div>
                </div>

                {/* Price info */}
                <div className="flex flex-col items-end w-full md:w-1/4">
                  <div className="text-xl font-bold text-right">
                    ₹{flight.price.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground">per adult</div>
                  <Button className="mt-2 text-sm">VIEW PRICES</Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlightResultsList;
