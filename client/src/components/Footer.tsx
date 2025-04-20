import React from "react";
import { VersionInfo } from "@/components/VersionInfo";

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2">
              <p className="text-sm">
                FIRST Robotics Championship Tracker &copy; {new Date().getFullYear()}
              </p>
              <VersionInfo compact className="text-neutral-400 hover:text-white" />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Not affiliated with FIRST Robotics Competition. Data provided by The Blue Alliance API.
            </p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-neutral-300 hover:text-white text-sm">About</a>
            <a href="#" className="text-neutral-300 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-neutral-300 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-neutral-300 hover:text-white text-sm">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
