import React from "react";
import { Gamepad } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="bg-primary shadow-md py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad className="h-6 w-6 text-white" />
          <h1 className="text-xl md:text-2xl font-medium text-white">FIRST Robotics Championship Tracker</h1>
        </div>
        <div className="hidden md:flex space-x-4">
          <a href="#" className="text-white hover:text-secondary">About</a>
          <a href="#" className="text-white hover:text-secondary">Help</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
