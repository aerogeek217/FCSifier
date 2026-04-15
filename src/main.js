import { loadDataset } from './data/loader.js';
import { renderTable } from './ui/table.js';
import { route } from './ui/router.js';

const app = document.getElementById('app');

async function boot() {
  const [tasks, tools, mappings] = await Promise.all([
    loadDataset('data/tasks.csv'),
    loadDataset('data/tools.json'),
    loadDataset('data/mappings.csv'),
  ]);

  const views = {
    tasks: () => renderTable(app, joinTasksWithTools(tasks, tools, mappings)),
    tools: () => renderTable(app, joinToolsWithTasks(tasks, tools, mappings)),
  };

  route(views, 'tasks');
  window.addEventListener('hashchange', () => route(views, 'tasks'));
}

function joinTasksWithTools(tasks, tools, mappings) {
  const toolById = new Map(tools.map(t => [t.id, t]));
  return tasks.map(task => ({
    ...task,
    tools: mappings
      .filter(m => m.task_id === task.id)
      .map(m => toolById.get(m.tool_id)?.name)
      .filter(Boolean)
      .join(', '),
  }));
}

function joinToolsWithTasks(tasks, tools, mappings) {
  const taskById = new Map(tasks.map(t => [t.id, t]));
  return tools.map(tool => ({
    ...tool,
    tasks: mappings
      .filter(m => m.tool_id === tool.id)
      .map(m => taskById.get(m.task_id)?.name)
      .filter(Boolean)
      .join(', '),
  }));
}

boot().catch(err => {
  app.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`;
  console.error(err);
});
