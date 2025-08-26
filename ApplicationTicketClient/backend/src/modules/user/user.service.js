import User from '../models/User.model.js';
import mongoose from 'mongoose';


const getAllUsers = async (excludeUserId) => {
  return await User.find({ _id: { $ne: excludeUserId } })
    .select('-password')
    .populate('company', 'name')
    .populate('projectManager', 'firstName lastName email')
    .populate('groupLeader', 'firstName lastName email')
    .populate('responsibleTester', 'firstName lastName email');
};

const getUsersByRole = async (role) => {
  return await User.find({ role }).select('-password');
};

const getAvailableUsers = async (userRole) => {
  let query = {};
  
  if (userRole === 'admin') {
    query = { 
      role: { $in: ['agentCommercial', 'responsibleClient', 'groupLeader', 'projectManager', 'developer', 'tester', 'responsibleTester'] }
    };
  } else if (userRole === 'responsibleClient') {
    query = { role: { $in: ['agentCommercial', 'groupLeader'] }};
  } else if (userRole === 'agentCommercial') {
    query = { role: { $in: ['groupLeader', 'projectManager'] }};
  } else if (userRole === 'projectManager') {
    query = { role: { $in: ['groupLeader', 'developer'] }};
  } else if (userRole === 'groupLeader') {
    query = { role: 'developer' };
  } else if (userRole === 'responsibleTester') {
    query = { role: 'tester' };
  }
  
  return await User.find(query)
    .select('_id firstName lastName email role')
    .sort('firstName');
};
const getUserById = async (userId) => {
  return await User.findById(userId)
    .select('-password')
    .populate('company', 'name')
    .populate('projectManager', 'firstName lastName email')
    .populate('groupLeader', 'firstName lastName email')
    .populate('responsibleTester', 'firstName lastName email');
};

const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};
const updateUser = async (userId, userFields) => {
  const isValidId = mongoose.Types.ObjectId.isValid(userId);
  if (!isValidId) return { error: 'Invalid user ID', statusCode: 400 };

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...userFields,
          company: userFields.company || null,
          projectManager: userFields.projectManager || null,
          groupLeader: userFields.groupLeader || null,
          responsibleTester: userFields.responsibleTester || null
        }
      },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('projectManager groupLeader responsibleTester', 'firstName lastName email');

    if (!updatedUser) return { error: 'User not found', statusCode: 404 };

    return updatedUser;
  } catch (error) {
    // console.error('Error updating user:', error);

    if (error.code === 11000 && error.keyPattern?.email) {
      return {
        error: 'This email is already in use by another user.',
        statusCode: 409
      };
    }

    return { error: 'Something went wrong while updating the user.', statusCode: 500 };
  }
};

const deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};
import bcrypt from 'bcryptjs';

const updateUserPassword = async (userId, newPassword, oldPassword = null) => {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found' };

  if (oldPassword) {
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return { error: 'Invalid current password' };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { password: hashedPassword } },
    { new: true }
  ).select('-password');

  return updatedUser;
};

const getHierarchicalUsers = async () => {
  try {
    // Get all project managers
    const projectManagers = await User.find({ 
      role: 'projectManager',
      isSuspended: { $ne: true } 
    }).select('-password');
    
    const projectManagersWithTeams = await Promise.all(
      projectManagers.map(async (pm) => {
        const groupLeaders = await User.find({ 
          role: 'groupLeader',
          projectManager: pm._id,
          isSuspended: { $ne: true }
        }).select('-password');
        
        const groupLeadersWithDevelopers = await Promise.all(
          groupLeaders.map(async (gl) => {
            const developers = await User.find({ 
              role: 'developer',
              groupLeader: gl._id,
              isSuspended: { $ne: true }
            }).select('-password');
            
            return {
              ...gl.toObject(),
              developers
            };
          })
        );
        
        return {
          ...pm.toObject(),
          groupLeaders: groupLeadersWithDevelopers
        };
      })
    );
    
    return projectManagersWithTeams;
  } catch (error) {
    // console.error('Error getting hierarchical users:', error);
    throw new Error('Failed to retrieve hierarchical user structure');
  }
  
};
const getLeadersWithDevelopers = async () => {
  try {
    // Find all group leaders
    const groupLeaders = await User.find({ 
      role: 'groupLeader',
      isSuspended: { $ne: true }
    }).select('-password');
    
    // For each group leader, find their developers
    const leadersWithDevelopers = await Promise.all(
      groupLeaders.map(async (leader) => {
        const developers = await User.find({ 
          role: 'developer',
          groupLeader: leader._id,
          isSuspended: { $ne: true }
        }).select('-password');
        
        return {
          ...leader.toObject(),
          developers
        };
      })
    );
    
    return leadersWithDevelopers;
  } catch (error) {
    // console.error('Error getting leaders with developers:', error);
    throw new Error('Failed to retrieve group leaders with developers');
  }
};
const getTesters = async () => {
  return await User.find({ role: 'tester' })
    .select('-password')
    .sort('firstName');
};


const getClientsByCreator = async (creatorId) => {
  try {
    // Find all client users created by the specified creator
    const clients = await User.find({ 
      role: 'client',
      createdBy: creatorId,
      isSuspended: { $ne: true }
    }).select('-password');
    
    return clients;
  } catch (error) {
    // console.error('Error getting clients by creator:', error);
    throw new Error('Failed to retrieve clients');
  }
};
const getTestersWithResponsible = async () => {
  try {
    // Find all responsible testers
    const responsibleTesters = await User.find({ 
      role: 'responsibleTester',
      isSuspended: { $ne: true } 
    }).select('-password');
    
    // For each responsible tester, find their testers
    const testersWithResponsible = await Promise.all(
      responsibleTesters.map(async (responsible) => {
        const testers = await User.find({ 
          role: 'tester',
          responsibleTester: responsible._id,
          isSuspended: { $ne: true }
        }).select('-password');
        
        return {
          ...responsible.toObject(),
          testers
        };
      })
    );
    
    return testersWithResponsible;
  } catch (error) {
    // console.error('Error getting testers with responsible:', error);
    throw new Error('Failed to retrieve testers with responsible');
  }
};

export {
  getAllUsers,
  getUsersByRole,
  getAvailableUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  findUserByEmail,
  updateUserPassword,
  getHierarchicalUsers,
  getLeadersWithDevelopers,
  getClientsByCreator,
  getTesters,
  getTestersWithResponsible
};


