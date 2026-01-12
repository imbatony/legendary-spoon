import { useState, useEffect } from "react";
import type { ApiKey } from "../../shared/types";

interface ApiKeyManagerProps {
  token: string;
}

export function ApiKeyManager({ token }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const res = await fetch("/api/api-keys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("加载失败");

      const data = await res.json();
      setApiKeys(data);
    } catch (err: any) {
      setError(err.message || "加载 API Keys 失败");
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "创建失败");
      }

      const newKey = await res.json();
      setApiKeys([newKey, ...apiKeys]);
      setNewKeyName("");
      setShowCreate(false);
      setCopiedKey(newKey.key);
      
      // 自动复制到剪贴板
      navigator.clipboard.writeText(newKey.key);
      alert("API Key 已创建并复制到剪贴板！\n请妥善保存，关闭后将无法再次查看完整密钥。");
    } catch (err: any) {
      setError(err.message || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const toggleApiKey = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!res.ok) throw new Error("更新失败");

      const updated = await res.json();
      setApiKeys(apiKeys.map((k) => (k.id === id ? updated : k)));
    } catch (err: any) {
      setError(err.message || "更新失败");
    }
  };

  const deleteApiKey = async (id: number) => {
    if (!confirm("确定要删除这个 API Key 吗？")) return;

    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("删除失败");

      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (err: any) {
      setError(err.message || "删除失败");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  };

  const maskKey = (key: string) => {
    if (key === copiedKey) return key; // 刚创建的显示完整
    return key.substring(0, 12) + "..." + key.substring(key.length - 4);
  };

  return (
    <div className="api-key-manager">
      <div className="api-key-header">
        <h2>🔑 API Key 管理</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary"
        >
          {showCreate ? "取消" : "+ 创建 API Key"}
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {showCreate && (
        <form onSubmit={createApiKey} className="api-key-form">
          <h3>创建新的 API Key</h3>
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="例如：移动端应用、脚本工具等"
              required
              className="input-text"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-success"
          >
            {loading ? "创建中..." : "创建"}
          </button>
        </form>
      )}

      <div className="api-key-info-box">
        <strong>💡 使用说明：</strong>
        <ul>
          <li>API Key 可用于脚本、移动应用等场景的身份验证</li>
          <li>在 HTTP 请求中添加 Header: <code>X-API-Key: your_api_key</code></li>
          <li>或在 URL 中添加参数: <code>?api_key=your_api_key</code></li>
          <li>请妥善保管 API Key，不要泄露给他人</li>
        </ul>
      </div>

      {apiKeys.length === 0 ? (
        <div className="api-key-empty">
          <p>📝 暂无 API Key</p>
          <p>点击上方按钮创建您的第一个 API Key</p>
        </div>
      ) : (
        <div className="api-key-list">
          {apiKeys.map((key) => (
            <div key={key.id} className="api-key-item">
              <div className="api-key-item-header">
                <div className="api-key-item-info">
                  <h3>{key.name}</h3>
                  <div className="api-key-value">
                    <span>{maskKey(key.key)}</span>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="btn-secondary btn-sm"
                    >
                      复制
                    </button>
                  </div>
                </div>
                <div className="api-key-item-actions">
                  <button
                    onClick={() => toggleApiKey(key.id, key.is_active as boolean)}
                    className={key.is_active ? "btn-warning" : "btn-success"}
                  >
                    {key.is_active ? "禁用" : "启用"}
                  </button>
                  <button
                    onClick={() => deleteApiKey(key.id)}
                    className="btn-primary btn-danger"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="api-key-meta">
                <div>
                  <strong>状态：</strong>
                  <span className={key.is_active ? "status-active" : "status-inactive"}>
                    {key.is_active ? "✓ 激活" : "✗ 已禁用"}
                  </span>
                </div>
                <div>
                  <strong>创建时间：</strong>
                  {new Date(key.created_at).toLocaleString("zh-CN")}
                </div>
                {key.last_used_at && (
                  <div>
                    <strong>最后使用：</strong>
                    {new Date(key.last_used_at).toLocaleString("zh-CN")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
