import React, { useState } from "react";
import axios from "axios";

export default function CreateFolder() {
  const [password, setPassword] = useState("");

  const handleCreate = async () => {
    try {
      await axios.post("http://localhost:2000/api/chat/create", { password });
      alert("Folder created!");
      setPassword("");
    } catch (err) {
        if (err.response && err.response.data) {
          alert(err.response.data.message);
        } else {
          alert("An error occurred. Please try again.");
          console.error(err);
        }
      }
    
  };

  return (
    <div>
      <h2>Create Folder</h2>
      <input
        type="text"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
