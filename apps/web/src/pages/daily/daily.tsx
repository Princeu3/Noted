import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { WorkspaceOutletContext } from "@/pages/workspace/layout";

const TZ = "America/New_York";

function todayInEST(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function displayDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface Task {
  id: number;
  text: string;
  isCompleted: boolean;
  date: string;
  createdBy: string;
}

export function Component() {
  const { workspace } = useOutletContext<WorkspaceOutletContext>();
  const [currentDate, setCurrentDate] = useState(todayInEST());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!workspace) return;
    setLoading(true);
    api<Task[]>(`/api/workspaces/${workspace.id}/tasks?date=${currentDate}`)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspace, currentDate]);

  async function addTask() {
    if (!workspace || !newTaskText.trim()) return;
    const task = await api<Task>(`/api/workspaces/${workspace.id}/tasks`, {
      method: "POST",
      body: JSON.stringify({ text: newTaskText.trim(), date: currentDate }),
    });
    setTasks([...tasks, task]);
    setNewTaskText("");
    inputRef.current?.focus();
  }

  async function toggleTask(task: Task) {
    const updated = { ...task, isCompleted: !task.isCompleted };
    setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isCompleted: updated.isCompleted }),
    });
  }

  async function updateTaskText(task: Task, text: string) {
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, text } : t)));
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ text }),
    });
  }

  async function deleteTask(taskId: number) {
    setTasks(tasks.filter((t) => t.id !== taskId));
    await api(`/api/tasks/${taskId}`, { method: "DELETE" });
  }

  function shiftDate(days: number) {
    const date = new Date(currentDate + "T12:00:00");
    date.setDate(date.getDate() + days);
    setCurrentDate(formatDate(date));
  }

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-1.5 sm:gap-3 flex-wrap">
        <Calendar className="h-5 w-5 text-muted-foreground hidden sm:block" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium whitespace-nowrap">{displayDate(currentDate)}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={() => shiftDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => setCurrentDate(todayInEST())}
        >
          Today
        </Button>
        {tasks.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {completedCount}/{tasks.length} done
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : (
            <div className="space-y-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-md px-3 py-2.5 sm:py-2 hover:bg-muted/50 active:bg-muted/50"
                >
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() => toggleTask(task)}
                    className="h-5 w-5 sm:h-4 sm:w-4"
                  />
                  <input
                    value={task.text}
                    onChange={(e) =>
                      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, text: e.target.value } : t)))
                    }
                    onBlur={(e) => updateTaskText(task, e.target.value)}
                    className={`flex-1 bg-transparent text-sm outline-none ${
                      task.isCompleted ? "line-through text-muted-foreground" : ""
                    }`}
                  />
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-destructive active:text-destructive transition-opacity p-1.5 -m-1.5 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTask();
                }}
                className="flex items-center gap-3 px-3 py-2"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add a task..."
                  className="border-0 shadow-none h-auto p-0 text-sm focus-visible:ring-0"
                />
              </form>
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              No tasks for this day yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
