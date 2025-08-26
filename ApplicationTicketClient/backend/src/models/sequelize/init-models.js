import { DataTypes } from 'sequelize';

// This file initializes all models without circular dependencies
export default function initModels(sequelize) {
  // User model
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM,
      values: ['client', 'agent', 'responsibleClient', 'admin', 'commercial', 'projectManager', 'groupLeader', 'developer'],
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    },
    isSuspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preferredLanguage: {
      type: DataTypes.ENUM,
      values: ['en', 'fr', 'de', 'es', 'ar'],
      defaultValue: 'en'
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
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const bcrypt = await import('bcryptjs');
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const bcrypt = await import('bcryptjs');
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Add instance method for password comparison
  User.prototype.comparePassword = async function(candidatePassword) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Company model and related models
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: false
  });

  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: false
  });

  const AvailabilitySlot = sequelize.define('AvailabilitySlot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    day: {
      type: DataTypes.ENUM,
      values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
      type: DataTypes.STRING
    },
    endTime: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: false
  });

  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false
  });

  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    billingMethod: {
      type: DataTypes.ENUM,
      values: ['hourly', 'perTask', 'subscription'],
      defaultValue: 'hourly'
    },
    contactPersonName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactPersonPosition: {
      type: DataTypes.STRING
    },
    contactPersonEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactPersonPhone: {
      type: DataTypes.STRING,
      allowNull: false
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

  // Ticket model and related models
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    author: {
      type: DataTypes.STRING,
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

  const FileAttachment = sequelize.define('FileAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false
  });

  const TicketContact = sequelize.define('TicketContact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: false
  });

  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSON
    }
  }, {
    timestamps: false
  });

  const Meeting = sequelize.define('Meeting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dateTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: false
    },
    teamsLink: {
      type: DataTypes.STRING
    },
    agenda: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: true
  });

  const Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    number: {
      type: DataTypes.STRING,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM,
      values: ['new', 'inprogress', 'onhold', 'resolved', 'closed', 'reopened', 'technicalvalidation', 'clientvalidation', 'expired', 'draft'],
      defaultValue: 'new'
    },
    urgency: {
      type: DataTypes.ENUM,
      values: ['low', 'medium', 'high', 'critical'],
      defaultValue: 'medium'
    },
    type: {
      type: DataTypes.ENUM,
      values: ['incident', 'request', 'problem', 'maintenance'],
      defaultValue: 'incident'
    },
    application: {
      type: DataTypes.STRING
    },
    environment: {
      type: DataTypes.ENUM,
      values: ['production', 'staging', 'development', 'testing'],
      defaultValue: 'production'
    },
    financialStatus: {
      type: DataTypes.ENUM,
      values: ['toqualify', 'subscription', 'quote', 'flexSubscription', 'excessHours', 'excessInterventions', 'extraOn'],
      defaultValue: 'toqualify'
    },
    deadline: {
      type: DataTypes.DATE
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    closedAt: {
      type: DataTypes.DATE
    },
    validationRequestedAt: {
      type: DataTypes.DATE
    },
    validatedAt: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    hooks: {
      beforeCreate: (ticket) => {
        if (!ticket.number) {
          const date = new Date();
          const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
          const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          ticket.number = `TCK_INC_${formattedDate}_URG_${randomPart}`;
        }
      }
    }
  });

  // Task model and related models
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

  // TestTask model and related models
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

  // Junction tables for many-to-many relationships
  const MeetingAttendee = sequelize.define('MeetingAttendee', {}, { timestamps: false });
  const CommentMention = sequelize.define('CommentMention', {}, { timestamps: false });
  const TaskDependencies = sequelize.define('TaskDependencies', {}, { timestamps: false });

  // Define relationships after all models are defined
  const defineAssociations = () => {
    // Company relationships
    Company.hasOne(Address, { as: 'address', foreignKey: 'companyId', onDelete: 'CASCADE' });
    Address.belongsTo(Company, { foreignKey: 'companyId' });

    Company.hasMany(Contact, { as: 'contacts', foreignKey: 'companyId', onDelete: 'CASCADE' });
    Contact.belongsTo(Company, { foreignKey: 'companyId' });

    Company.hasMany(AvailabilitySlot, { as: 'availabilitySlots', foreignKey: 'companyId', onDelete: 'CASCADE' });
    AvailabilitySlot.belongsTo(Company, { foreignKey: 'companyId' });

    Company.hasMany(Document, { as: 'documents', foreignKey: 'companyId', onDelete: 'CASCADE' });
    Document.belongsTo(Company, { foreignKey: 'companyId' });

    Document.belongsTo(User, { as: 'uploadedBy', foreignKey: 'uploadedById' });

    Company.belongsTo(User, { as: 'commercialAgent', foreignKey: 'commercialAgentId' });
    Company.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });

    // Ticket relationships
    Ticket.hasMany(Comment, { as: 'comments', foreignKey: 'ticketId', onDelete: 'CASCADE' });
    Comment.belongsTo(Ticket, { foreignKey: 'ticketId' });
    Comment.belongsTo(User, { as: 'authorUser', foreignKey: 'authorId' });

    Ticket.hasMany(FileAttachment, { as: 'attachments', foreignKey: 'ticketId', onDelete: 'CASCADE' });
    FileAttachment.belongsTo(Ticket, { foreignKey: 'ticketId' });
    FileAttachment.belongsTo(User, { as: 'uploadedBy', foreignKey: 'uploadedById' });

    Ticket.hasMany(TicketContact, { as: 'contacts', foreignKey: 'ticketId', onDelete: 'CASCADE' });
    TicketContact.belongsTo(Ticket, { foreignKey: 'ticketId' });

    Ticket.hasMany(Activity, { as: 'activities', foreignKey: 'ticketId', onDelete: 'CASCADE' });
    Activity.belongsTo(Ticket, { foreignKey: 'ticketId' });
    Activity.belongsTo(User, { foreignKey: 'userId' });

    Ticket.hasMany(Meeting, { as: 'meetings', foreignKey: 'ticketId', onDelete: 'CASCADE' });
    Meeting.belongsTo(Ticket, { foreignKey: 'ticketId' });
    Meeting.belongsTo(User, { as: 'organizer', foreignKey: 'organizerId' });

    // Ticket relationships with users and company
    Ticket.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
    Ticket.belongsTo(User, { as: 'responsibleClient', foreignKey: 'responsibleClientId' });
    Ticket.belongsTo(User, { as: 'agent', foreignKey: 'agentId' });
    Ticket.belongsTo(User, { as: 'commercial', foreignKey: 'commercialId' });
    Ticket.belongsTo(User, { as: 'projectManager', foreignKey: 'projectManagerId' });
    Ticket.belongsTo(User, { as: 'groupLeader', foreignKey: 'groupLeaderId' });
    Ticket.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
    Ticket.belongsTo(Company, { foreignKey: 'companyId' });

    // Task relationships
    Task.belongsTo(Ticket, { foreignKey: 'ticketId' });
    Ticket.hasMany(Task, { as: 'tasks', foreignKey: 'ticketId', onDelete: 'CASCADE' });

    Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
    Task.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });

    Task.hasMany(TaskComment, { as: 'comments', foreignKey: 'taskId', onDelete: 'CASCADE' });
    TaskComment.belongsTo(Task, { foreignKey: 'taskId' });
    TaskComment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

    Task.hasMany(TaskAttachment, { as: 'attachments', foreignKey: 'taskId', onDelete: 'CASCADE' });
    TaskAttachment.belongsTo(Task, { foreignKey: 'taskId' });
    TaskAttachment.belongsTo(User, { as: 'uploadedBy', foreignKey: 'uploadedById' });

    Task.hasMany(TaskTimeEntry, { as: 'timeEntries', foreignKey: 'taskId', onDelete: 'CASCADE' });
    TaskTimeEntry.belongsTo(Task, { foreignKey: 'taskId' });
    TaskTimeEntry.belongsTo(User, { as: 'user', foreignKey: 'userId' });

    // Task dependencies (self-referencing)
    Task.belongsToMany(Task, { as: 'dependencies', through: TaskDependencies, foreignKey: 'taskId', otherKey: 'dependencyId' });

    // TestTask relationships
    TestTask.belongsTo(Ticket, { foreignKey: 'ticketId' });
    Ticket.hasMany(TestTask, { as: 'testTasks', foreignKey: 'ticketId', onDelete: 'CASCADE' });

    TestTask.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
    TestTask.belongsTo(User, { as: 'tester', foreignKey: 'testerId' });
    TestTask.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });

    TestTask.hasMany(TestStep, { as: 'steps', foreignKey: 'testTaskId', onDelete: 'CASCADE' });
    TestStep.belongsTo(TestTask, { foreignKey: 'testTaskId' });

    TestTask.hasMany(TestAttachment, { as: 'attachments', foreignKey: 'testTaskId', onDelete: 'CASCADE' });
    TestAttachment.belongsTo(TestTask, { foreignKey: 'testTaskId' });
    TestAttachment.belongsTo(User, { as: 'uploadedBy', foreignKey: 'uploadedById' });

    TestTask.hasMany(TestComment, { as: 'comments', foreignKey: 'testTaskId', onDelete: 'CASCADE' });
    TestComment.belongsTo(TestTask, { foreignKey: 'testTaskId' });
    TestComment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

    // Meeting attendees (many-to-many)
    Meeting.belongsToMany(User, { through: MeetingAttendee, as: 'attendees' });
    User.belongsToMany(Meeting, { through: MeetingAttendee });

    // Comment mentions (many-to-many)
    Comment.belongsToMany(User, { through: CommentMention, as: 'mentions' });
    User.belongsToMany(Comment, { through: CommentMention });
  };

  // Call the association function
  defineAssociations();

  // Return all models
  return {
    User,
    Company,
    Address,
    Contact,
    AvailabilitySlot,
    Document,
    Ticket,
    Comment,
    FileAttachment,
    TicketContact,
    Activity,
    Meeting,
    MeetingAttendee,
    CommentMention,
    Task,
    TaskComment,
    TaskAttachment,
    TaskTimeEntry,
    TaskDependencies,
    TestTask,
    TestStep,
    TestAttachment,
    TestComment
  };
}