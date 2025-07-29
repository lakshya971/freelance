import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const DUMMY_MESSAGES = [
  { sender: "client", text: "Hi, I have a question about the project." },
  { sender: "me", text: "Sure! Let me know how I can help." },
];

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { sender: "me", text: input }]);
    setInput("");
    // Here you would send the message to your backend or chat service
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} mb-2`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs text-sm shadow 
                  ${msg.sender === "me"
                    ? "bg-primary-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"}
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="flex-1 input-field"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-6">Send</button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
