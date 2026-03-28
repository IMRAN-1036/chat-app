import React from "react";

// Simple AI Assistant responses
const AI_RESPONSES = {
  "hello": "👋 Hey there! Welcome to ChatVault. How can I help you today?",
  "help": "📚 I can help you with:\n• /ai hello - Say hello\n• /ai help - Show this help\n• /ai joke - Tell a joke\n• /ai fact - Share a fun fact\n• /ai quote - Inspire you with a quote",
  "joke": "😂 Why did the chat room go to school? Because it wanted to improve its message communication!",
  "fact": "🧠 Did you know? The first chat room was created in 1978 on PLATO, a computer-assisted education system!",
  "quote": "💭 'The only way to do great work is to love what you do.' - Steve Jobs",
  "default": "🤖 I'm a simple AI assistant. Try /ai help to see what I can do!"
};

export function parseAICommand(text) {
  if (!text.startsWith("/ai ")) return null;
  
  const command = text.slice(4).toLowerCase().trim();
  return AI_RESPONSES[command] || AI_RESPONSES.default;
}

export function isAICommand(text) {
  return text.startsWith("/ai ");
}

export default function AIAssistant() {
  return null; // This component is mainly for utility functions
}
