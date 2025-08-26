import { DataTypes } from 'sequelize';

// Define User model function that takes sequelize instance
const defineUserModel = (sequelize) => {
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

// Instance method to compare password
  User.prototype.comparePassword = async function(candidatePassword) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
  };

  return User;
};

export default defineUserModel;