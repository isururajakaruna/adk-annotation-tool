"use client";

import React from "react";
import { MessageSquare, FolderOpen } from "lucide-react";

interface PermanentSidebarProps {
  activeView: 'chat' | 'saved';
  onNavigate: (view: 'chat' | 'saved') => void;
}

export default function PermanentSidebar({ activeView, onNavigate }: PermanentSidebarProps) {
  return (
    <div className="w-16 bg-gray-900 dark:bg-gray-950 flex flex-col items-center py-4 border-r border-gray-800">
      {/* Chat Icon */}
      <button
        onClick={() => onNavigate('chat')}
        className={`
          w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all group relative
          ${activeView === 'chat' 
            ? 'bg-blue-500 text-white shadow-lg' 
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }
        `}
        title="Chat"
      >
        <MessageSquare size={24} />
        
        {/* Tooltip */}
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Chat
        </span>
      </button>

      {/* Saved Chats Icon */}
      <button
        onClick={() => onNavigate('saved')}
        className={`
          w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative
          ${activeView === 'saved' 
            ? 'bg-blue-500 text-white shadow-lg' 
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }
        `}
        title="Saved Chats"
      >
        <FolderOpen size={24} />
        
        {/* Tooltip */}
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Saved Chats
        </span>
      </button>
    </div>
  );
}

