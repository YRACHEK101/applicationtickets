import { DataTypes } from 'sequelize';

// Define Ticket model function that takes sequelize instance
const defineTicketModel = (sequelize, models) => {
  // Comment model
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

  // File attachment model
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

// Contact model for tickets
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

// Activity model
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

// Meeting model
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

// Ticket model
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

  // Define relationships
  Ticket.hasMany(Comment, { as: 'comments', foreignKey: 'ticketId', onDelete: 'CASCADE' });
  Comment.belongsTo(Ticket, { foreignKey: 'ticketId' });

  Ticket.hasMany(FileAttachment, { as: 'attachments', foreignKey: 'ticketId', onDelete: 'CASCADE' });
  FileAttachment.belongsTo(Ticket, { foreignKey: 'ticketId' });

  Ticket.hasMany(TicketContact, { as: 'contacts', foreignKey: 'ticketId', onDelete: 'CASCADE' });
  TicketContact.belongsTo(Ticket, { foreignKey: 'ticketId' });

  Ticket.hasMany(Activity, { as: 'activities', foreignKey: 'ticketId', onDelete: 'CASCADE' });
  Activity.belongsTo(Ticket, { foreignKey: 'ticketId' });

  Ticket.hasMany(Meeting, { as: 'meetings', foreignKey: 'ticketId', onDelete: 'CASCADE' });
  Meeting.belongsTo(Ticket, { foreignKey: 'ticketId' });

  // Junction tables for many-to-many relationships
  const MeetingAttendee = sequelize.define('MeetingAttendee', {}, { timestamps: false });
  const CommentMention = sequelize.define('CommentMention', {}, { timestamps: false });

  // Meeting attendees (many-to-many)
  Meeting.belongsToMany(models.User, { through: MeetingAttendee, as: 'attendees' });
  models.User.belongsToMany(Meeting, { through: MeetingAttendee });

  // Comment mentions (many-to-many)
  Comment.belongsToMany(models.User, { through: CommentMention, as: 'mentions' });
  models.User.belongsToMany(Comment, { through: CommentMention });

  // User and Company relationships will be set up in init-models.js
  // to avoid circular dependencies

  return {
    Ticket,
    Comment,
    FileAttachment,
    TicketContact,
    Activity,
    Meeting,
    MeetingAttendee,
    CommentMention
  };
};

export default defineTicketModel;