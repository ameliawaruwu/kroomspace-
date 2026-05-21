import { Priority, Task } from "../types";

export async function analyzePriority(task: Partial<Task>): Promise<Priority> {
  try {
    const response = await fetch('/api/ai/analyze-priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task })
    });
    if (response.ok) {
      const data = await response.json();
      return data.priority as Priority;
    }
  } catch (error) {
    console.error("AI Priority Analysis failed:", error);
  }
  // Fallback to rule-based
  if (task.title?.toLowerCase().includes('down') || task.title?.toLowerCase().includes('critical')) return 'High';
  if (task.type === 'Maintenance') return 'High';
  return 'Medium';
}

export async function sortTasksByPriority(tasks: Task[]): Promise<string[]> {
  if (tasks.length <= 1) return tasks.map(t => t.id);

  try {
    const response = await fetch('/api/ai/sort-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks })
    });
    if (response.ok) {
      const data = await response.json();
      return data.sortedIds;
    }
  } catch (error) {
    console.error("AI Task Sorting failed:", error);
  }
  return tasks.map(t => t.id);
}

export async function getMaintenanceConsultation(
  question: string, 
  context: { projectTitle?: string, taskTitle?: string, description?: string, checklist?: string[] },
  language: string = 'id'
): Promise<string> {
  try {
    const response = await fetch('/api/ai/consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, language })
    });
    const data = await response.json();
    if (response.ok) {
      return data.result;
    }
    return language === 'id' 
      ? "Kunci API AI (GEMINI_API_KEY) belum dikonfigurasi di file .env. Silakan periksa konfigurasi backend Anda."
      : "AI API key (GEMINI_API_KEY) is not configured in the .env file. Please check your backend configuration.";
  } catch (error) {
    console.error("AI Maintenance Consultation failed:", error);
    return language === 'id'
      ? "Maaf, saya tidak dapat memproses permintaan Anda saat ini."
      : "Sorry, I couldn't process your request at the moment.";
  }
}
