import { DataTypes } from 'sequelize';

// Define Task model function that takes sequelize instance
const defineTaskModel = (sequelize, models) => {
  // Task model
  const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM,
    values: ['todo', 'inprogress', 'done', 'blocked'],
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM,
    values: ['low', 'medium', 'high', 'critical'],
    defaultValue: 'medium'
  },
  estimatedHours: {
    type: DataTypes.FLOAT
  },
  actualHours: {
    type: DataTypes.FLOAT
  },
  startDate: {
    type: DataTypes.DATE
  },
  dueDate: {
    type: DataTypes.DATE
  },
  completedAt: {
    type: DataTypes.DATE
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

// Task Comment model
const TaskComment = sequelize.define('TaskComment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  updatedAt: false
});

// Task Attachment model
const TaskAttachment = sequelize.define('TaskAttachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileType: {
    type: DataTypes.STRING
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

// Task Time Entry model
const TaskTimeEntry = sequelize.define('TaskTimeEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  description: {
    type: DataTypes.TEXT
  },
  hours: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  updatedAt: false
});

  // Define relationships
  Task.hasMany(TaskComment, { as: 'comments', foreignKey: 'taskId', onDelete: 'CASCADE' });
  TaskComment.belongsTo(Task, { foreignKey: 'taskId' });

  Task.hasMany(TaskAttachment, { as: 'attachments', foreignKey: 'taskId', onDelete: 'CASCADE' });
  TaskAttachment.belongsTo(Task, { foreignKey: 'taskId' });

  Task.hasMany(TaskTimeEntry, { as: 'timeEntries', foreignKey: 'taskId', onDelete: 'CASCADE' });
  TaskTimeEntry.belongsTo(Task, { foreignKey: 'taskId' });

  // Task dependencies (self-referencing)
  const TaskDependencies = sequelize.define('TaskDependencies', {}, { timestamps: false });
  Task.belongsToMany(Task, { as: 'dependencies', through: TaskDependencies, foreignKey: 'taskId', otherKey: 'dependencyId' });

  // User and Ticket relationships will be set up in init-models.js
  // to avoid circular dependencies

  return {
    Task,
    TaskComment,
    TaskAttachment,
    TaskTimeEntry,
    TaskDependencies
  };
};

export default defineTaskModel;