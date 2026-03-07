import React, { useState } from "react";
import CreateFolder from "./components/CreateFolder";
import SearchFolder from "./components/SearchFolder";
import ChatRoom from "./components/ChatRoom";
import './App.css';

function App() {
  const [folder, setFolder] = useState(null);

  return (
    <div className="App">
      <h1>🔒 Chat Folder</h1>
      {!folder && (
        <>
          <CreateFolder />
          <SearchFolder onFound={setFolder} />
        </>
      )}
      {folder && <ChatRoom folder={folder} />}
    </div>
  );
}

export default App;