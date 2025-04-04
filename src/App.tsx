import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import React from "react";
import ThemeProvider from "./components/ThemeProvider";

// Create a component wrapper to properly initialize QueryClient within the component lifecycle
const AppContent = () => {
  // Initialize QueryClient inside the component to ensure proper hook usage
  const [queryClient] = React.useState(() => new QueryClient());
  const location = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Welcome />} />
            <Route path="/chat" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Main App component
const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
