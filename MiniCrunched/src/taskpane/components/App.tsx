import * as React from "react";
import ChatInterface from "./ChatInterface";

interface AppProps {
  title: string;
}

const App: React.FC<AppProps> = () => {
  return <ChatInterface />;
};

export default App;
