"use client";

import { X } from "lucide-react";
import BookingLinkGeneratorTab from "./BookingLinkGeneratorTab";

export default function BookingLinkModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative p-6">
        {/* Close button */}
        <button
          className="absolute right-4 top-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Generate Booking Link</h2>

        {/* Link generator */}
        <BookingLinkGeneratorTab />
      </div>
    </div>
  );
}
