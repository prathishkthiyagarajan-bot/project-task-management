
const $ = id => document.getElementById(id);

let projects = [];
let tasks = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function showMessage(id, text, error = false) {
  $(id).textContent = text;
  $(id).className = error ? "message error" : "message success";
}

function addCell(row, value) {
  const td = row.insertCell();
  td.textContent = value ?? "";
  return td;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

async function loadDashboard() {
  try {
    const results = await Promise.all([
      api("/api/projects"),
      api("/api/tasks")
    ]);

    projects = results[0];
    tasks = results[1];

    $("projectCount").textContent = projects.length;
    $("taskCount").textContent = tasks.length;
    $("completedCount").textContent =
      tasks.filter(task => task.status === "Completed").length;

    renderProjects();
    renderTasks();
    fillProjectOptions();

    showMessage("mainMessage", "Dashboard loaded successfully.");
  } catch (error) {
    showMessage("mainMessage", error.message, true);
  }
}

function fillProjectOptions() {
  const select = $("taskProject");
  select.replaceChildren(new Option("Select a project", ""));

  projects.forEach(project => {
    select.add(new Option(project.name, project._id));
  });
}

$("projectForm").addEventListener("submit", async event => {
  event.preventDefault();

  try {
    const name = $("projectName").value.trim();
    const description = $("projectDescription").value.trim();
    const deadline = $("projectDeadline").value;

    if (!name || !deadline) {
      throw new Error("Enter a project name and deadline.");
    }

    const result = await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, description, deadline })
    });

    showMessage("projectMessage", result.message);
    $("projectForm").reset();
    await loadDashboard();
  } catch (error) {
    showMessage("projectMessage", error.message, true);
  }
});

$("taskForm").addEventListener("submit", async event => {
  event.preventDefault();

  try {
    const title = $("taskTitle").value.trim();
    const description = $("taskDescription").value.trim();
    const project = $("taskProject").value;
    const assignedTo = $("assignedTo").value.trim();
    const priority = $("taskPriority").value;
    const dueDate = $("taskDueDate").value;

    if (!title || !project || !assignedTo || !dueDate) {
      throw new Error("Please complete all required task fields.");
    }

    const result = await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        project,
        assignedTo,
        priority,
        dueDate
      })
    });

    showMessage("taskMessage", result.message);
    $("taskForm").reset();
    $("taskPriority").value = "Medium";
    await loadDashboard();
  } catch (error) {
    showMessage("taskMessage", error.message, true);
  }
});

function renderProjects() {
  const table = $("projectTable");
  table.replaceChildren();

  if (projects.length === 0) {
    const row = table.insertRow();
    const td = addCell(row, "No projects available.");
    td.colSpan = 4;
    return;
  }

  projects.forEach(project => {
    const row = table.insertRow();

    addCell(row, project.name);
    addCell(row, formatDate(project.deadline));
    addCell(row, project.status);

    const action = row.insertCell();
    const select = document.createElement("select");

    ["Planning", "In Progress", "Completed"].forEach(status => {
      const option = new Option(status, status);
      option.selected = status === project.status;
      select.add(option);
    });

    const button = document.createElement("button");
    button.textContent = "Update";
    button.className = "small-btn";

    button.addEventListener("click", async () => {
      try {
        await api(`/api/projects/${project._id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: select.value })
        });

        await loadDashboard();
      } catch (error) {
        showMessage("mainMessage", error.message, true);
      }
    });

    action.append(select, button);
  });
}

function renderTasks() {
  const table = $("taskTable");
  table.replaceChildren();

  if (tasks.length === 0) {
    const row = table.insertRow();
    const td = addCell(row, "No tasks available.");
    td.colSpan = 7;
    return;
  }

  tasks.forEach(task => {
    const row = table.insertRow();

    addCell(row, task.title);
    addCell(row, task.project?.name || "Unknown");
    addCell(row, task.assignedTo);
    addCell(row, task.priority);
    addCell(row, formatDate(task.dueDate));
    addCell(row, task.status);

    const action = row.insertCell();
    const select = document.createElement("select");

    ["To Do", "In Progress", "Completed"].forEach(status => {
      const option = new Option(status, status);
      option.selected = status === task.status;
      select.add(option);
    });

    const update = document.createElement("button");
    update.textContent = "Update";
    update.className = "small-btn";

    update.addEventListener("click", async () => {
      try {
        await api(`/api/tasks/${task._id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: select.value })
        });

        await loadDashboard();
      } catch (error) {
        showMessage("mainMessage", error.message, true);
      }
    });

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.className = "delete-btn";

    remove.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this task?")) {
        return;
      }

      try {
        const result = await api(`/api/tasks/${task._id}`, {
          method: "DELETE"
        });

        showMessage("mainMessage", result.message);
        await loadDashboard();
      } catch (error) {
        showMessage("mainMessage", error.message, true);
      }
    });

    action.append(select, update, remove);
  });
}

$("refreshButton").addEventListener("click", loadDashboard);

loadDashboard();
