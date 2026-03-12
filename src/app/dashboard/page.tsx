"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { MarkdownPreview } from "@/components/markdown-preview";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  FileIcon,
  PlusIcon,
  TrashIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  EyeIcon,
  EditIcon,
  SplitIcon,
  SaveIcon,
} from "@/components/icons";

interface FileItem {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface FileDetail extends FileItem {
  content: string;
}

type ViewMode = "editor" | "preview" | "split";

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<FileDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const openFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`);
      if (res.ok) {
        const data: FileDetail = await res.json();
        setActiveFile(data);
        setTitle(data.title);
        setContent(data.content);
        setHasChanges(false);
        setMobileSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const createFile = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", content: "" }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchFiles();
        await openFile(data.id);
        setTimeout(() => {
          const titleInput = document.getElementById("file-title-input");
          if (titleInput) {
            (titleInput as HTMLInputElement).select();
            titleInput.focus();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to create file:", error);
    } finally {
      setCreating(false);
    }
  };

  const saveFile = useCallback(async () => {
    if (!activeFile || !hasChanges) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/files/${activeFile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveFile(updated);
        setHasChanges(false);
        fetchFiles();
      }
    } catch (error) {
      console.error("Failed to save file:", error);
    } finally {
      setSaving(false);
    }
  }, [activeFile, hasChanges, title, content, fetchFiles]);

  const deleteFile = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/files/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (activeFile?.id === deleteTarget.id) {
          setActiveFile(null);
          setTitle("");
          setContent("");
          setHasChanges(false);
        }
        setDeleteTarget(null);
        fetchFiles();
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      // auto-save hint - we don't auto-save, user uses Ctrl+S or button
    }, 1000);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasChanges(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredFiles = files;

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Markdown CMS
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-muted hover:text-danger transition-colors"
              title="Sign out"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={createFile}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 px-4">
            <FileIcon className="w-10 h-10 text-muted/40 mx-auto mb-3" />
            <p className="text-sm text-muted">
              {search ? "No matching files" : "No documents yet"}
            </p>
            {!search && (
              <p className="text-xs text-muted/60 mt-1">
                Create your first document
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeFile?.id === file.id
                    ? "bg-accent/10 text-accent"
                    : "text-foreground hover:bg-surface-hover"
                }`}
                onClick={() => openFile(file.id)}
              >
                <FileIcon className="w-4 h-4 shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.title}</p>
                  <p className="text-xs text-muted truncate">{formatDate(file.updatedAt)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(file);
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all"
                  title="Delete"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-surface border-r border-border transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-72 h-full bg-surface border-r border-border flex flex-col">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 text-muted hover:text-foreground"
            >
              <XIcon className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border shrink-0">
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileSidebarOpen(!mobileSidebarOpen);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Toggle sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {activeFile && (
            <>
              <input
                id="file-title-input"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-sm font-medium bg-transparent border-none text-foreground focus:outline-none focus:ring-0"
                placeholder="Untitled"
              />

              <div className="flex items-center gap-1 shrink-0">
                <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("editor")}
                    className={`p-1.5 transition-colors ${viewMode === "editor" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"}`}
                    title="Editor only"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`p-1.5 transition-colors ${viewMode === "split" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"}`}
                    title="Split view"
                  >
                    <SplitIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`p-1.5 transition-colors ${viewMode === "preview" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"}`}
                    title="Preview only"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={saveFile}
                  disabled={!hasChanges || saving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    hasChanges
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "bg-surface-hover text-muted cursor-default"
                  } disabled:opacity-50`}
                  title="Save (Ctrl+S)"
                >
                  <SaveIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </>
          )}
        </header>

        {/* Editor + Preview Area */}
        {activeFile ? (
          <div className="flex-1 flex min-h-0">
            {/* Editor */}
            {(viewMode === "editor" || viewMode === "split") && (
              <div className={`flex flex-col ${viewMode === "split" ? "w-1/2 border-r border-border" : "w-full"}`}>
                <div className="px-4 py-2 border-b border-border bg-surface/50">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">Editor</span>
                </div>
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="flex-1 w-full p-4 bg-background text-foreground font-mono text-sm leading-relaxed resize-none focus:outline-none"
                  placeholder="Start writing markdown..."
                  spellCheck={false}
                />
              </div>
            )}

            {/* Preview */}
            {(viewMode === "preview" || viewMode === "split") && (
              <div className={`flex flex-col ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
                <div className="px-4 py-2 border-b border-border bg-surface/50">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">Preview</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <MarkdownPreview content={content} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileIcon className="w-16 h-16 text-muted/20 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No document selected</h2>
              <p className="text-sm text-muted mb-6">
                Select a document from the sidebar or create a new one
              </p>
              <button
                onClick={createFile}
                disabled={creating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Document
              </button>
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={deleteFile}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
