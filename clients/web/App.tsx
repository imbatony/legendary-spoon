import { useState, useEffect } from "react";
import { APITester } from "./APITester";
import { TodoList } from "./TodoList";
import { FileTransfer } from "./FileTransfer";
import { Auth } from "./Auth";
import { ApiKeyManager } from "./ApiKeyManager";
import "./index.css";

import logo from "./logo.svg";

type Tab = "todo" | "files" | "reminders" | "api" | "apikeys" | "settings";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("todo");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 检查本地存储的 token
    const savedToken = localStorage.getItem("auth_token");
    const savedUsername = localStorage.getItem("username");

    if (savedToken && savedUsername) {
      // 验证 token 是否有效
      fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            setToken(savedToken);
            setUsername(savedUsername);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("username");
          }
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("username");
        })
        .finally(() => {
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, []);

  const handleAuthenticated = (newToken: string, newUsername: string) => {
    setToken(newToken);
    setUsername(newUsername);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("username");
    setToken("");
    setUsername("");
    setIsAuthenticated(false);
    setActiveTab("todo");
  };

  const handleChangePassword = async () => {
    const oldPassword = prompt("请输入当前密码：");
    if (!oldPassword) return;

    const newPassword = prompt("请输入新密码（至少 6 位）：");
    if (!newPassword || newPassword.length < 6) {
      alert("新密码长度至少为 6 位");
      return;
    }

    const confirmPassword = prompt("请再次输入新密码：");
    if (newPassword !== confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (res.ok) {
        alert("密码修改成功！");
      } else {
        const errorText = await res.text();
        alert("修改失败：" + errorText);
      }
    } catch (err) {
      alert("修改失败，请重试");
    }
  };

  if (checking) {
    return (
      <div className="auth-container">
        <p>正在加载...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo-container">
          <img src={logo} alt="Bun Logo" className="logo bun-logo" />
          <h1>legendary-spoon</h1>
        </div>
        <p className="subtitle">个人工具集</p>
        <div className="user-info">
          <span className="username">👤 {username}</span>
          <button onClick={handleLogout} className="btn-primary btn-danger">
            退出登录
          </button>
        </div>
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
          className={activeTab === "apikeys" ? "tab active" : "tab"}
          onClick={() => setActiveTab("apikeys")}
        >
          🔑 API Keys
        </button>
        <button
          className={activeTab === "settings" ? "tab active" : "tab"}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ 设置
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
            <TodoList token={token} />
          </div>
        )}
        {activeTab === "files" && (
          <div className="module">
            <FileTransfer token={token} />
          </div>
        )}
        {activeTab === "reminders" && (
          <div className="module">
            <h2>提醒</h2>
            <p>功能开发中...</p>
          </div>
        )}
        {activeTab === "apikeys" && (
          <div className="module">
            <ApiKeyManager token={token} />
          </div>
        )}
        {activeTab === "settings" && (
          <div className="module">
            <div className="settings-container">
              <h2>⚙️ 设置</h2>
              <div>
                <h3>账号安全</h3>
                <button onClick={handleChangePassword} className="btn-primary">
                  修改密码
                </button>
              </div>
              <div className="settings-info-box">
                <h3>密码重置说明</h3>
                <p>如果忘记密码，可以通过服务器生成重置码：</p>
                <ol>
                  <li>在服务器上执行命令生成重置码</li>
                  <li>退出登录后，在登录页面选择"忘记密码"</li>
                  <li>输入用户名和重置码即可重置密码</li>
                </ol>
                <p className="hint">💡 提示：重置码有效期为 24 小时</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === "api" && (
          <div className="module">
            <APITester token={token} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
