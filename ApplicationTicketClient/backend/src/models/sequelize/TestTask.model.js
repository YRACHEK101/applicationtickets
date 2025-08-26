import { DataTypes } from 'sequelize';

// Define TestTask model function that takes sequelize instance
const defineTestTaskModel = (sequelize, models) => {
  // TestTask model
  const TestTask = sequelize.define('TestTask', {
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
    values: ['pending', 'inprogress', 'passed', 'failed', 'blocked'],
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM,
    values: ['low', 'medium', 'high', 'critical'],
    defaultValue: 'medium'
  },
  testType: {
    type: DataTypes.ENUM,
    values: ['functional', 'integration', 'performance', 'security', 'usability', 'regression'],
    defaultValue: 'functional'
  },
  environment: {
    type: DataTypes.ENUM,
    values: ['development', 'staging', 'production'],
    defaultValue: 'staging'
  },
  expectedResult: {
    type: DataTypes.TEXT
  },
  actualResult: {
    type: DataTypes.TEXT
  },
  startDate: {
    type: DataTypes.DATE
  },
  completedDate: {
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

// TestStep model
const TestStep = sequelize.define('TestStep', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stepNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expectedResult: {
    type: DataTypes.TEXT
  },
  actualResult: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM,
    values: ['pending', 'passed', 'failed'],
    defaultValue: 'pending'
  }
}, {
  timestamps: false
});

// TestAttachment model
const TestAttachment = sequelize.define('TestAttachment', {
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

// TestComment model
const TestComment = sequelize.define('TestComment', {
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

  // Define relationships
  TestTask.hasMany(TestStep, { as: 'steps', foreignKey: 'testTaskId', onDelete: 'CASCADE' });
  TestStep.belongsTo(TestTask, { foreignKey: 'testTaskId' });

  TestTask.hasMany(TestAttachment, { as: 'attachments', foreignKey: 'testTaskId', onDelete: 'CASCADE' });
  TestAttachment.belongsTo(TestTask, { foreignKey: 'testTaskId' });

  TestTask.hasMany(TestComment, { as: 'comments', foreignKey: 'testTaskId', onDelete: 'CASCADE' });
  TestComment.belongsTo(TestTask, { foreignKey: 'testTaskId' });

  // User and Ticket relationships will be set up in init-models.js
  // to avoid circular dependencies

  return {
    TestTask,
    TestStep,
    TestAttachment,
    TestComment
  };
};

export default defineTestTaskModel;