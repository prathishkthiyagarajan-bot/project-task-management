const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let tasks = [];

app.get("/tasks", (req, res) => res.json(tasks));

app.post("/tasks", (req, res) => {
  tasks.push({
    id: Date.now(),
    name: req.body.name,
    status: "Pending"
  });
  res.json({ message: "Task added successfully" });
});

app.patch("/tasks/:id", (req, res) => {
  tasks = tasks.map(t =>
    t.id == req.params.id
      ? { ...t, status: "Completed" }
      : t
  );
  res.json({ message: "Task updated" });
});

app.listen(3000, () =>
  console.log("http://localhost:3000")
);
