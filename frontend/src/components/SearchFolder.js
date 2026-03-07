import React, { useState } from "react";
import axios from "axios";

export default function SearchFolder({ onFound }) {
  const [password, setPassword] = useState("");

  const handleSearch = async () => {
    try {
      const res = await axios.post("http://localhost:2000/api/chat/find", { password });
      onFound(res.data);
    } catch (err) {
      alert("Folder not found");
    }
  };

  return (
    <div>
      <h2>Enter Password to Access Folder</h2>
      <input
        type="text"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSearch}>Access</button>
    </div>
  );
}