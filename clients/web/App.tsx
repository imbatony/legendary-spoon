import { useState } from "react";
import { APITester } from "./APITester";
import { TodoList } from "./TodoList";
import { FileTransfer } from "./FileTransfer";
import "./index.css";

import logo from "./logo.svg";

type Tab = "todo" | "files" | "reminders" | "api";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("todo");

  return (
    <div className="app">
      <header className="header">
        <div className="logo-container">
          <img src={logo} alt="Bun Logo" className="logo bun-logo" />
          <h1>legendary-spoon</h1>
        </div>
        <p className="subtitle">个人工具集</p>
      </header>

      <nav className="nav-tabs">
        <button
          className={activeTab === "todo" ? "tab active" : "tab"}
          onClick={() => setActiveTab("todo")}
        >
          📝 待办事项
        </button>
        <button
          className={activeTab === "files" ? "tab active" : "tab"}
          onClick={() => setActiveTab("files")}
        >
          📁 文件传输
        </button>
        <button
          className={activeTab === "reminders" ? "tab active" : "tab"}
          onClick={() => setActiveTab("reminders")}
        >
          ⏰ 提醒
        </button>
        <button
          className={activeTab === "api" ? "tab active" : "tab"}
          onClick={() => setActiveTab("api")}
        >
          🔧 API 测试
        </button>
      </nav>

      <main className="content">
        {activeTab === "todo" && (
          <div className="module">
            <TodoList />
          </div>
        )}
        {activeTab === "files" && (
          <div className="module">
            <FileTransfer />
          </div>
        )}
        {activeTab === "reminders" && (
          <div className="module">
            <h2>提醒</h2>
            <p>功能开发中...</p>
          </div>
        )}
        {activeTab === "api" && (
          <div className="module">
            <APITester />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
