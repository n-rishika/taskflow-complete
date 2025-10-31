'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { LogIn, LogOut, Plus, Calendar, AlertCircle, Users, FolderKanban, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const TaskCard = ({ task, isDragging }) => {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Card className={`mb-3 cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm">{task.title}</h4>
          <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'MMM dd')}
            </span>
          )}
          {task.project?.name && (
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              {task.project.name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const KanbanColumn = ({ title, status, tasks, icon: Icon }) => {
  return (
    <div className="flex-1 min-w-[300px]">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{title}</h3>
          <span className="ml-auto bg-background px-2 py-1 rounded-full text-xs font-medium">
            {tasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task._id} data-task-id={task._id} data-status={status}>
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Data states
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Dialog states
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  
  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTeam, setNewProjectTeam] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');

  const [draggedTask, setDraggedTask] = useState(null);
  
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsAuthenticated(true);
          loadData(token);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const loadData = async (token) => {
    try {
      const [teamsRes, projectsRes, tasksRes] = await Promise.all([
        fetch('/api/teams', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
        if (projectsData.projects?.length > 0) {
          setSelectedProject(projectsData.projects[0]._id);
          setNewTaskProject(projectsData.projects[0]._id);
        }
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = authMode === 'login' ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        loadData(data.token);
        toast({
          title: 'Success!',
          description: authMode === 'login' ? 'Logged in successfully' : 'Account created successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Authentication failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setTeams([]);
    setProjects([]);
    setTasks([]);
  };

  const handleCreateTeam = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (res.ok) {
        const data = await res.json();
        setTeams([...teams, data.team]);
        setNewTeamName('');
        setShowNewTeamDialog(false);
        toast({
          title: 'Success!',
          description: 'Team created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    }
  };

  const handleCreateProject = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newProjectName, teamId: newProjectTeam }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects([...projects, data.project]);
        setNewProjectName('');
        setNewProjectTeam('');
        setShowNewProjectDialog(false);
        toast({
          title: 'Success!',
          description: 'Project created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTask = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          dueDate: newTaskDueDate,
          projectId: newTaskProject,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks([data.task, ...tasks]);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskPriority('medium');
        setNewTaskDueDate('');
        setShowNewTaskDialog(false);
        toast({
          title: 'Success!',
          description: 'Task created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setDraggedTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== newStatus) {
      // Optimistic update
      setTasks(tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));

      // API call
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          // Revert on error
          setTasks(tasks);
          toast({
            title: 'Error',
            description: 'Failed to update task',
            variant: 'destructive',
          });
        }
      } catch (error) {
        // Revert on error
        setTasks(tasks);
        toast({
          title: 'Error',
          description: 'Failed to update task',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">TaskFlow</CardTitle>
            <CardDescription className="text-center">
              Manage your tasks with teams and projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={setAuthMode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleAuth} className="space-y-4 mt-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleAuth} className="space-y-4 mt-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" /> Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">TaskFlow</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">To Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todoTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inProgressTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Done</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{doneTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" /> New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>Add a new team to organize your projects</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Team Name</Label>
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Marketing Team"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTeam} disabled={!newTeamName}>
                  Create Team
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderKanban className="mr-2 h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to a team</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Website Redesign"
                  />
                </div>
                <div>
                  <Label>Team</Label>
                  <Select value={newProjectTeam} onValueChange={setNewProjectTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team._id} value={team._id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateProject} disabled={!newProjectName || !newProjectTeam}>
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your project</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Design homepage mockup"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Create initial mockup designs..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Project</Label>
                  <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTask} disabled={!newTaskTitle || !newTaskProject}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a team and project to start managing tasks
            </p>
            <Button onClick={() => setShowNewTeamDialog(true)}>
              <Users className="mr-2 h-4 w-4" /> Create Your First Team
            </Button>
          </Card>
        )}

        {/* Kanban Board */}
        {projects.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-4">
              <div id="todo" className="flex-1 min-w-[300px]">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">To Do</h3>
                    <span className="ml-auto bg-background px-2 py-1 rounded-full text-xs font-medium">
                      {todoTasks.length}
                    </span>
                  </div>
                  <div
                    id="todo"
                    className="space-y-2 min-h-[200px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData('taskId');
                      handleDragEnd({ active: { id: taskId }, over: { id: 'todo' } });
                    }}
                  >
                    {todoTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('taskId', task._id);
                          handleDragStart({ active: { id: task._id } });
                        }}
                        onDragEnd={() => setDraggedTask(null)}
                      >
                        <TaskCard task={task} isDragging={draggedTask?._id === task._id} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div id="in-progress" className="flex-1 min-w-[300px]">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">In Progress</h3>
                    <span className="ml-auto bg-background px-2 py-1 rounded-full text-xs font-medium">
                      {inProgressTasks.length}
                    </span>
                  </div>
                  <div
                    id="in-progress"
                    className="space-y-2 min-h-[200px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData('taskId');
                      handleDragEnd({ active: { id: taskId }, over: { id: 'in-progress' } });
                    }}
                  >
                    {inProgressTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('taskId', task._id);
                          handleDragStart({ active: { id: task._id } });
                        }}
                        onDragEnd={() => setDraggedTask(null)}
                      >
                        <TaskCard task={task} isDragging={draggedTask?._id === task._id} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div id="done" className="flex-1 min-w-[300px]">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Done</h3>
                    <span className="ml-auto bg-background px-2 py-1 rounded-full text-xs font-medium">
                      {doneTasks.length}
                    </span>
                  </div>
                  <div
                    id="done"
                    className="space-y-2 min-h-[200px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData('taskId');
                      handleDragEnd({ active: { id: taskId }, over: { id: 'done' } });
                    }}
                  >
                    {doneTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('taskId', task._id);
                          handleDragStart({ active: { id: task._id } });
                        }}
                        onDragEnd={() => setDraggedTask(null)}
                      >
                        <TaskCard task={task} isDragging={draggedTask?._id === task._id} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DndContext>
        )}
      </main>

      <Toaster />
    </div>
  );
}
