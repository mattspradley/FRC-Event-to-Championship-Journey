import React from "react";
import { Gamepad, Calendar, Award, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { VersionInfo } from "@/components/VersionInfo";

const Header: React.FC = () => {
  const [location] = useLocation();

  return (
    <header className="bg-primary shadow-md py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <Gamepad className="h-6 w-6 text-white" />
              <h1 className="text-xl md:text-2xl font-medium text-white">FIRST Robotics Championship Tracker</h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-6">
          <Link href="/">
            <div className={`flex items-center gap-2 text-white hover:text-secondary transition-colors cursor-pointer ${location === '/' ? 'font-semibold border-b-2 border-white' : ''}`}>
              <Calendar className="h-5 w-5" />
              <span className="hidden md:inline">Events</span>
            </div>
          </Link>
          <Link href="/team">
            <div className={`flex items-center gap-2 text-white hover:text-secondary transition-colors cursor-pointer ${location.startsWith('/team') ? 'font-semibold border-b-2 border-white' : ''}`}>
              <Award className="h-5 w-5" />
              <span className="hidden md:inline">Team Storyboard</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center ml-2">
            <VersionInfo 
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
