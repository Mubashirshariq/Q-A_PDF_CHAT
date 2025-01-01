import React, { useRef, useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [response, setResponse] = useState<string>("");
  const [citations, setCitations] = useState<
    { page: string; content: string }[]
  >([]);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/chat_history/")
      .then((response) => {
        // Extract only the `content` field from the response
        const chatHistory = response.data.chat_history
          .filter((item: any) => typeof item === "object" && item.content)
          .map((item: any) => item.content);

        setHistory(chatHistory);
      })
      .catch((error) => {
        console.error("Error fetching chat history:", error);
      });
  }, []);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const files = event.target.files
      ? (Array.from(event.target.files) as File[])
      : [];
    setSelectedFiles(files);
  };

  const handleProcessFiles = async () => {
    const toastId = toast.loading("Processing files...");
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      const resp = await axios.post(
        "http://localhost:8000/process_pdfs",
        formData
      );
      toast.success("Files processed successfully!", { id: toastId });
      console.log(resp);
    } catch (error) {
      toast.error("An error occurred while processing files!", { id: toastId });
      console.error(error);
    }
  };

  const handleSend = async () => {
    const query = inputRef.current?.value;
    if (!query || !query.trim()) {
      toast.error("Please enter a question before sending.");
      return;
    }
    const toastId = toast.loading("Sending question...");
    try {
      const formData = new FormData();
      formData.append("question", query);

      const resp = await axios.post(
        "http://localhost:8000/ask_question/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResponse(resp.data.response);
      setCitations(resp.data.citations || []); // Update citations
      console.log(resp.data.response);
      toast.dismiss(toastId);
      toast.success("Question sent successfully!");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      if ((error as any).response && (error as any).response.data) {
        toast.error(`Error: ${(error as any).response.data.error}`);
      } else {
        toast.error("Failed to send question. Please try again.");
      }
    }
  };

  return (
    <div>
      <div>
        <Toaster />
      </div>
      <div className="app">
        <aside className="sidebar">
          <h3 className="sidebar-title">Q&A Chatbot</h3>
          <div className="menu">
            <h4>Chat History</h4>
            <ul>
              {history.map((message, index) => (
                <div className="chat-item" key={index}>{message}</div>
              ))}
            </ul>
          </div>
        </aside>

        <main className="chat">
          {response && (
            <div className="response">
              <h4>Response:</h4>
              <p>{response}</p>
              {citations.length > 0 && (
                <div className="citations">
                  <h5>Citations:</h5>
                  <ul>
                    {citations.map((citation, index) => (
                      <li key={index}>
                        <strong>Page {citation.page}:</strong>{" "}
                        {citation.content}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="chat-input">
            <input ref={inputRef} type="text" placeholder="Write your query" />
            <div className="input-icons">
              <button onClick={handleSend}>
                <Send />
              </button>
            </div>
          </div>

          <div className="file-upload">
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileChange}
              className="file-input"
            />
            <button className="process-button" onClick={handleProcessFiles}>
              Process
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="file-list">
              <h4>Selected Files:</h4>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
