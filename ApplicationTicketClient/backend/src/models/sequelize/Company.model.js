import { DataTypes } from 'sequelize';

// Define Company model function that takes sequelize instance
const defineCompanyModel = (sequelize, models) => {
  // Address model
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

  // Contact model
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

  // Availability Slot model
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

  // Document model
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

  // Company model
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

  // Define relationships
  Company.hasOne(Address, { as: 'address', foreignKey: 'companyId', onDelete: 'CASCADE' });
  Address.belongsTo(Company, { foreignKey: 'companyId' });

  Company.hasMany(Contact, { as: 'contacts', foreignKey: 'companyId', onDelete: 'CASCADE' });
  Contact.belongsTo(Company, { foreignKey: 'companyId' });

  Company.hasMany(AvailabilitySlot, { as: 'availabilitySlots', foreignKey: 'companyId', onDelete: 'CASCADE' });
  AvailabilitySlot.belongsTo(Company, { foreignKey: 'companyId' });

  Company.hasMany(Document, { as: 'documents', foreignKey: 'companyId', onDelete: 'CASCADE' });
  Document.belongsTo(Company, { foreignKey: 'companyId' });

  // User relationships will be set up after all models are initialized
  // to avoid circular dependencies

  return {
    Company,
    Address,
    Contact,
    AvailabilitySlot,
    Document
  };
};

export default defineCompanyModel;