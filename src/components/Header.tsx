import React from "react";
import { Plane } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AuthButtons from "./AuthButtons";

interface HeaderProps {
  onReset?: () => void;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ onReset, children }) => {
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
        <AuthButtons />
        {children}
      </div>
    </header>
  );
};

export default Header;
