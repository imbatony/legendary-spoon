import { useState, useEffect } from "react";

interface AuthProps {
  onAuthenticated: (token: string, username: string) => void;
}

export function Auth({ onAuthenticated }: AuthProps) {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkInitStatus();
  }, []);

  const checkInitStatus = async () => {
    try {
      const res = await fetch("/api/auth/init-status");
      const data = await res.json();
      setIsInitialized(data.initialized);
      setIsLogin(data.initialized);
    } catch (err) {
      setError("无法连接到服务器");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let endpoint = "/api/auth/login";
      let body: any = { username, password };

      if (!isInitialized) {
        // 初始化账号
        if (password.length < 6) {
          setError("密码长度至少为 6 位");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("两次输入的密码不一致");
          setLoading(false);
          return;
        }
        endpoint = "/api/auth/init";
      } else if (showReset) {
        // 密码重置
        if (password.length < 6) {
          setError("密码长度至少为 6 位");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("两次输入的密码不一致");
          setLoading(false);
          return;
        }
        endpoint = "/api/auth/reset-password";
        body = { username, resetCode, newPassword: password };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "操作失败");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (showReset) {
        // 重置成功后切换到登录
        setShowReset(false);
        setError("");
        alert("密码重置成功，请登录");
        setPassword("");
        setConfirmPassword("");
        setResetCode("");
      } else {
        // 登录或初始化成功
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("username", data.user.username);
        onAuthenticated(data.token, data.user.username);
      }
    } catch (err: any) {
      setError(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  if (isInitialized === null) {
    return (
      <div className="auth-container">
        <p>正在加载...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {!isInitialized
            ? "🎉 首次使用 - 初始化账号"
            : showReset
            ? "🔐 重置密码"
            : "🔑 登录"}
        </h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="请输入用户名"
            />
          </div>

          {showReset && (
            <div className="form-group">
              <label>重置码</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                placeholder="请输入 6 位数字重置码"
              />
              <small className="auth-hint">请联系管理员获取重置码</small>
            </div>
          )}

          <div className="form-group">
            <label>{!isInitialized || showReset ? "新密码" : "密码"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="请输入密码（至少 6 位）"
            />
          </div>

          {(!isInitialized || showReset) && (
            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="请再次输入密码"
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {loading
              ? "处理中..."
              : !isInitialized
              ? "初始化账号"
              : showReset
              ? "重置密码"
              : "登录"}
          </button>

          {isInitialized && (
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setShowReset(!showReset);
                  setError("");
                  setPassword("");
                  setConfirmPassword("");
                  setResetCode("");
                }}
                className="auth-link"
                style={{ background: "none", border: "none" }}
              >
                {showReset ? "返回登录" : "忘记密码？"}
              </button>
            </div>
          )}
        </form>

        {!isInitialized && (
          <div className="settings-info-box">
            <strong>💡 温馨提示：</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li>这是您第一次使用系统</li>
              <li>请设置管理员账号和密码</li>
              <li>密码至少 6 位字符</li>
              <li>请妥善保管您的账号信息</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
