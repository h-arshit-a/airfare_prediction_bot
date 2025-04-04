import React from "react";
import { Plane } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onReset?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center border-b shadow-sm">
      <div
        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onReset}
      >
        <Plane className="h-6 w-6 mr-2" />
        <h1 className="text-xl font-bold">Flight Friend</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm">Your AI Airfare Assistant</div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
