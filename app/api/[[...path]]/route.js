import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Team from '@/lib/models/Team';
import Project from '@/lib/models/Project';
import Task from '@/lib/models/Task';
import { generateToken, authenticateUser, unauthorizedResponse } from '@/lib/auth';

// Auth Routes
async function handleSignup(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    // Create sample team, project, and tasks for new users
    try {
      const sampleTeam = await Team.create({
        name: 'My First Team',
        description: 'Welcome to TaskFlow! This is your sample team.',
        owner: user._id,
        members: [user._id],
      });

      const sampleProject = await Project.create({
        name: 'Sample Project',
        description: 'Get started with this sample project',
        team: sampleTeam._id,
        owner: user._id,
      });

      // Create sample tasks with different statuses
      const sampleTasks = [
        {
          title: 'Review project requirements',
          description: 'Go through all the requirements and make sure everything is clear',
          status: 'todo',
          priority: 'high',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
        {
          title: 'Set up development environment',
          description: 'Install all necessary tools and dependencies',
          status: 'todo',
          priority: 'high',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
        {
          title: 'Create wireframes',
          description: 'Design initial wireframes for the main pages',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
        {
          title: 'Design database schema',
          description: 'Create the database structure and relationships',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
        {
          title: 'Implement authentication',
          description: 'Build login and signup functionality with JWT',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
        {
          title: 'Set up project repository',
          description: 'Initialize Git repository and set up version control',
          status: 'done',
          priority: 'medium',
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
        {
          title: 'Define project goals',
          description: 'Document main objectives and success criteria',
          status: 'done',
          priority: 'high',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
        {
          title: 'Research best practices',
          description: 'Study industry standards and best practices for task management',
          status: 'done',
          priority: 'low',
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          project: sampleProject._id,
          createdBy: user._id,
          assignedTo: user._id,
        },
      ];

      await Task.insertMany(sampleTasks);
    } catch (sampleDataError) {
      // If sample data creation fails, still return successful signup
      console.error('Error creating sample data:', sampleDataError);
    }

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleLogin(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(user._id);

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleGetMe(request) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  return NextResponse.json({
    user: {
      id: auth.user._id,
      email: auth.user.email,
      name: auth.user.name,
    },
  });
}

// Team Routes
async function handleGetTeams(request) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await connectDB();
    const teams = await Team.find({
      $or: [{ owner: auth.user._id }, { members: auth.user._id }],
    }).populate('owner', 'name email');

    return NextResponse.json({ teams });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleCreateTeam(request) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const team = await Team.create({
      name,
      description,
      owner: auth.user._id,
      members: [auth.user._id],
    });

    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Project Routes
async function handleGetProjects(request) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await connectDB();
    
    // Get user's teams
    const teams = await Team.find({
      $or: [{ owner: auth.user._id }, { members: auth.user._id }],
    });

    const teamIds = teams.map((t) => t._id);

    const projects = await Project.find({
      team: { $in: teamIds },
    }).populate('team', 'name');

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleCreateProject(request) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const { name, description, teamId } = await request.json();

    if (!name || !teamId) {
      return NextResponse.json(
        { error: 'Project name and team are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user is part of the team
    const team = await Team.findOne({
      _id: teamId,
      $or: [{ owner: auth.user._id }, { members: auth.user._id }],
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found or access denied' },
        { status: 403 }
      );
    }

    const project = await Project.create({
      name,
      description,
      team: teamId,
      owner: auth.user._id,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Task Routes
async function handleGetTasks(request) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    await connectDB();

    let query = {};

    if (projectId) {
      query.project = projectId;
    } else {
      // Get all projects user has access to
      const teams = await Team.find({
        $or: [{ owner: auth.user._id }, { members: auth.user._id }],
      });
      const teamIds = teams.map((t) => t._id);
      const projects = await Project.find({ team: { $in: teamIds } });
      const projectIds = projects.map((p) => p._id);
      query.project = { $in: projectIds };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleCreateTask(request) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const { title, description, priority, dueDate, projectId, status } = await request.json();

    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and project are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user has access to the project
    const project = await Project.findById(projectId).populate('team');
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const team = await Team.findOne({
      _id: project.team._id,
      $or: [{ owner: auth.user._id }, { members: auth.user._id }],
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      project: projectId,
      status: status || 'todo',
      createdBy: auth.user._id,
      assignedTo: auth.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    return NextResponse.json({ task: populatedTask });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleUpdateTask(request, taskId) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const updates = await request.json();

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        task[key] = updates[key];
      }
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    return NextResponse.json({ task: populatedTask });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleDeleteTask(request, taskId) {
  const auth = await authenticateUser(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await connectDB();

    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Route Handler
export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path === 'auth/me') {
    return handleGetMe(request);
  } else if (path === 'teams') {
    return handleGetTeams(request);
  } else if (path === 'projects') {
    return handleGetProjects(request);
  } else if (path === 'tasks') {
    return handleGetTasks(request);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path === 'auth/signup') {
    return handleSignup(request);
  } else if (path === 'auth/login') {
    return handleLogin(request);
  } else if (path === 'teams') {
    return handleCreateTeam(request);
  } else if (path === 'projects') {
    return handleCreateProject(request);
  } else if (path === 'tasks') {
    return handleCreateTask(request);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path.startsWith('tasks/')) {
    const taskId = path.split('/')[1];
    return handleUpdateTask(request, taskId);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path.startsWith('tasks/')) {
    const taskId = path.split('/')[1];
    return handleDeleteTask(request, taskId);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
