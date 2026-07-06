import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete, apiPut } from "./lib/api";

type Health = {
  ok: boolean;
  service: string;
};

type EchoResponse = {
  ok: boolean;
  echoed: string;
  at: string;
};

type MessageItem = {
  id: number;
  text: string;
  createdAt: string;
};

type MessagesResponse = {
  ok: boolean;
  items: MessageItem[];
};

type CreateMessageResponse = {
  ok: boolean;
  item: MessageItem;
};

type DeleteMessageResponse = {
  ok: boolean;
  deletedId: number;
};

type UpdateMessageResponse = {
  ok: boolean;
  item: MessageItem;
};

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [echo, setEcho] = useState<EchoResponse | null>(null);
  const [echoError, setEchoError] = useState("");
  const [sending, setSending] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<MessageItem[]>([]);
  const [notesError, setNotesError] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadMessages = async () => {
    try {
      setNotesError("");
      const data = await apiGet<MessagesResponse>("/messages");
      setNotes(data.items ?? []);
    } catch (e) {
      setNotesError(e instanceof Error ? e.message : "Failed to load messages");
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const data = await apiGet<Health>("/health");
        setHealth(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setLoading(false);
      }

      await loadMessages();
    };
    run();
  }, []);

  const onEchoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEcho(null);
    setEchoError("");

    try {
      setSending(true);
      const data = await apiPost<EchoResponse>("/echo", { message });
      setEcho(data);
      setMessage("");
    } catch (e) {
      setEchoError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSending(false);
    }
  };

  const onNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotesError("");

    if (!noteText.trim()) {
      setNotesError("Please enter a note");
      return;
    }

    try {
      setSavingNote(true);
      const data = await apiPost<CreateMessageResponse>("/messages", {
        text: noteText.trim(),
      });
      setNotes((prev) => [data.item, ...prev]);
      setNoteText("");
    } catch (e) {
      setNotesError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const onDeleteNote = async (id: number) => {
    try {
      setNotesError("");
      await apiDelete<DeleteMessageResponse>(`/messages/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setEditingText("");
      }
    } catch (e) {
      setNotesError(e instanceof Error ? e.message : "Failed to delete note");
    }
  };

  const startEdit = (note: MessageItem) => {
    setNotesError("");
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (id: number) => {
    if (!editingText.trim()) {
      setNotesError("Please enter a note");
      return;
    }

    try {
      setUpdating(true);
      setNotesError("");
      const data = await apiPut<UpdateMessageResponse>(`/messages/${id}`, {
        text: editingText.trim(),
      });

      setNotes((prev) => prev.map((n) => (n.id === id ? data.item : n)));
      cancelEdit();
    } catch (e) {
      setNotesError(e instanceof Error ? e.message : "Failed to update note");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800 p-6 bg-slate-900 space-y-8">
        <h1 className="text-2xl font-bold">SkillCanvas Web</h1>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">API Health</h2>
          {loading && <p className="text-slate-300">Checking API health...</p>}
          {!loading && error && <p className="text-red-400">API error: {error}</p>}
          {!loading && health && (
            <div className="space-y-1">
              <p>
                Status:{" "}
                <span className="font-semibold text-emerald-400">
                  {health.ok ? "OK" : "NOT OK"}
                </span>
              </p>
              <p>Service: {health.service}</p>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Echo test (/echo)</h2>
          <form onSubmit={onEchoSubmit} className="space-y-3">
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-slate-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
          {echoError && <p className="text-red-400">Echo error: {echoError}</p>}
          {echo && (
            <div className="rounded-lg border border-slate-700 p-3 text-sm space-y-1">
              <p>Echoed: {echo.echoed}</p>
              <p>At: {echo.at}</p>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Notes (/messages)</h2>
          <form onSubmit={onNoteSubmit} className="space-y-3">
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-slate-500"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write a note"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingNote}
                className="rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
              >
                {savingNote ? "Saving..." : "Save Note"}
              </button>
              <button
                type="button"
                onClick={loadMessages}
                className="rounded-lg px-4 py-2 bg-slate-700 hover:bg-slate-600"
              >
                Refresh
              </button>
            </div>
          </form>

          {notesError && <p className="text-red-400">Notes error: {notesError}</p>}

          <div className="rounded-lg border border-slate-700 divide-y divide-slate-800">
            {notes.length === 0 ? (
              <p className="p-3 text-slate-400 text-sm">No notes yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="p-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {editingId === n.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-slate-500"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(n.id)}
                            disabled={updating}
                            className="rounded-md px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
                          >
                            {updating ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-md px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{n.text}</p>
                        <p className="text-xs text-slate-400">{n.createdAt}</p>
                      </>
                    )}
                  </div>

                  {editingId !== n.id && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(n)}
                        className="rounded-md px-3 py-1.5 text-sm bg-amber-700 hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(n.id)}
                        className="rounded-md px-3 py-1.5 text-sm bg-rose-700 hover:bg-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}