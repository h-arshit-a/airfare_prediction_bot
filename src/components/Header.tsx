
import React from 'react';
import { Plane } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center border-b shadow-sm">
      <div className="flex items-center">
        <Plane className="h-6 w-6 mr-2" />
        <h1 className="text-xl font-bold">Flight Friend</h1>
      </div>
      <div className="text-sm">
        Your AI Airfare Assistant
      </div>
    </header>
  );
};

export default Header;
