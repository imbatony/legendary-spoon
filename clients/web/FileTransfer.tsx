import { useState, useEffect } from "react";

interface FileInfo {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  download_count: number;
}

interface StorageInfo {
  disk: {
    total: number;
    used: number;
    available: number;
  };
  uploads: {
    size: number;
    count: { count: number };
  };
}

interface FileTransferProps {
  token: string;
}

export function FileTransfer({ token }: FileTransferProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  // 辅助函数：带认证的 fetch
  const authFetch = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  useEffect(() => {
    fetchFiles();
    fetchStorageInfo();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await authFetch("/api/files");
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const response = await authFetch("/api/files/storage");
      const data = await response.json();
      setStorageInfo(data);
    } catch (error) {
      console.error("Failed to fetch storage info:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // 检查文件大小（限制为 100MB）
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      alert("文件大小不能超过 100MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await authFetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchFiles();
        await fetchStorageInfo(); // 刷新存储信息
        setSelectedFile(null);
        // 重置文件输入
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.text();
        alert(`上传失败: ${error}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      const response = await authFetch(`/api/files/${file.id}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 刷新列表以更新下载次数
      await fetchFiles();
    } catch (error) {
      console.error("Download failed:", error);
      alert("下载失败，请重试");
    }
  };

  const handleDelete = async (id: number, filename: string) => {
    if (!confirm(`确定要删除「${filename}」吗？`)) return;

    try {
      const response = await authFetch(`/api/files/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFiles();
        await fetchStorageInfo(); // 刷新存储信息
      } else {
        alert("删除失败，请重试");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("删除失败，请重试");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatPercentage = (used: number, total: number): string => {
    if (total === 0) return "0%";
    return ((used / total) * 100).toFixed(1) + "%";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📄";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📽️";
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return "🗜️";
    if (mimeType.includes("text")) return "📝";
    return "📎";
  };

  return (
    <div className="file-transfer">
      <div className="file-header">
        <h2>📁 文件传输</h2>
        <div className="file-stats">
          <span>文件总数: {files.length}</span>
          <span>总大小: {formatFileSize(files.reduce((sum, f) => sum + f.file_size, 0))}</span>
        </div>
      </div>

      {/* 存储容量信息 */}
      {storageInfo && (
        <div className="storage-info">
          <div className="storage-section">
            <div className="storage-label">
              <span>💾 磁盘存储</span>
              <span className="storage-usage">
                {formatFileSize(storageInfo.disk.used)} / {formatFileSize(storageInfo.disk.total)}
                <span className="storage-percentage">
                  ({formatPercentage(storageInfo.disk.used, storageInfo.disk.total)})
                </span>
              </span>
            </div>
            <div className="storage-bar">
              <div
                className="storage-bar-fill"
                style={{
                  width: formatPercentage(storageInfo.disk.used, storageInfo.disk.total),
                  backgroundColor: 
                    (storageInfo.disk.used / storageInfo.disk.total) > 0.9 ? '#dc3545' :
                    (storageInfo.disk.used / storageInfo.disk.total) > 0.7 ? '#ffc107' : '#28a745'
                }}
              />
            </div>
            <div className="storage-details">
              <span className="storage-detail">
                可用: {formatFileSize(storageInfo.disk.available)}
              </span>
            </div>
          </div>

          <div className="storage-section">
            <div className="storage-label">
              <span>📤 上传文件</span>
              <span className="storage-usage">
                {formatFileSize(storageInfo.uploads.size)}
                <span className="storage-count">
                  ({storageInfo.uploads.count.count} 个文件)
                </span>
              </span>
            </div>
            <div className="storage-bar">
              <div
                className="storage-bar-fill storage-bar-uploads"
                style={{
                  width: storageInfo.disk.total > 0 
                    ? formatPercentage(storageInfo.uploads.size, storageInfo.disk.total)
                    : '0%'
                }}
              />
            </div>
            <div className="storage-details">
              <span className="storage-detail">
                占磁盘: {storageInfo.disk.total > 0 
                  ? formatPercentage(storageInfo.uploads.size, storageInfo.disk.total)
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 上传区域 */}
      <form className="file-upload-form" onSubmit={handleUpload}>
        <div className="upload-area">
          <input
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            className="file-input"
            disabled={uploading}
          />
          <label htmlFor="file-input" className="file-input-label">
            {selectedFile ? (
              <div className="selected-file">
                <span className="file-icon">{getFileIcon(selectedFile.type)}</span>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                </div>
              </div>
            ) : (
              <div className="upload-prompt">
                <span className="upload-icon">📤</span>
                <p>点击选择文件或拖拽文件到这里</p>
                <p className="upload-hint">最大支持 100MB</p>
              </div>
            )}
          </label>
        </div>

        {selectedFile && (
          <div className="upload-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? "上传中..." : "上传文件"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedFile(null);
                const fileInput = document.getElementById("file-input") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
              }}
              disabled={uploading}
            >
              取消
            </button>
          </div>
        )}

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="progress-text">{uploadProgress}%</div>
          </div>
        )}
      </form>

      {/* 文件列表 */}
      <div className="file-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <p>暂无文件</p>
            <p className="empty-hint">上传您的第一个文件</p>
          </div>
        ) : (
          <div className="file-items">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-icon-large">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="file-details">
                  <div className="file-name-large">{file.original_name}</div>
                  <div className="file-meta">
                    <span className="file-size-badge">
                      {formatFileSize(file.file_size)}
                    </span>
                    <span className="file-date">
                      {formatDate(file.upload_date)}
                    </span>
                    <span className="file-downloads">
                      ⬇️ {file.download_count} 次
                    </span>
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className="btn-icon btn-download"
                    onClick={() => handleDownload(file)}
                    title="下载"
                  >
                    ⬇️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(file.id, file.original_name)}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
