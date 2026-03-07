import React, { useState } from "react";
import axios from "axios";

export default function ChatRoom({ folder }) {
  const [messages, setMessages] = useState(folder.messages);
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");

  const handleSend = async () => {
    await axios.post("http://localhost:2000/api/chat/message", {
      password: folder.password,
      sender,
      text,
    });
    const res = await axios.post("http://localhost:2000/api/chat/find", {
      password: folder.password,
    });
    setMessages(res.data.messages);
    setText("");
  };

  return (
    <div>
      <h2>Chat Room: 🔐 {folder.password}</h2>
      <div style={{ maxHeight: "300px", overflowY: "scroll", border: "1px solid #ccc", marginBottom: "1em" }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.sender}:</strong> {msg.text} <small>({new Date(msg.timestamp).toLocaleString()})</small>
          </div>
        ))}
      </div>
      <input
        placeholder="Your name"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
      />
      <input
        placeholder="Your message"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}