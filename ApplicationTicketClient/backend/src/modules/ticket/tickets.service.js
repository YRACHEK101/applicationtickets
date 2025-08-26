import Ticket from '../../../server/models/Ticket.model.js';
import User from '../../../server/models/User.model.js';
import path from 'path';
import fs from 'fs';

import { promisify } from 'util';
import NotificationService from '../../../server/services/NotificationService.js';
const renameAsync = promisify(fs.rename);

export const getClientTickets = async (clientId) => {
  return await Ticket.find({ client: clientId })
    .populate('client', 'firstName lastName email')
    .populate('responsibleClient', 'firstName lastName email')
    .populate('agentCommercial', 'firstName lastName email');
};

// const populateFields = [
//   { path: 'client', select: 'firstName lastName email' },
//   { path: 'responsibleClient', select: 'firstName lastName email' },
//   { path: 'commercial', select: 'firstName lastName email' },
//   { path: 'agents', select: 'firstName lastName email' },
// ];

export const getAgentTickets = (agentId) => {
  return Ticket.find({$or: [
    { agentCommercial: agentId },
    { createdBy: agentId }
  ] })
  .populate('client', 'firstName lastName email')
  .populate('responsibleClient', 'firstName lastName email')
  .populate('agentCommercial', 'firstName lastName email')
  .populate('responsibleTester', 'firstName lastName email');
  
};

export const getResponsibleTickets = (responsibleId) => {
  return Ticket.find({ 
    $or: [
      { responsibleClient: responsibleId },
      { client: responsibleId }
    ]
  })
  .populate('client', 'firstName lastName email')
  .populate('responsibleClient', 'firstName lastName email')
  .populate('agentCommercial', 'firstName lastName email')
  .populate('responsibleTester', 'firstName lastName email');

};

export const getResponsibleTesterTickets = (responsibleId) => {
  return Ticket.find({ responsibleTester: responsibleId })
  .populate('client', 'firstName lastName email')
  .populate('responsibleClient', 'firstName lastName email')
  .populate('agentCommercial', 'firstName lastName email')
  .populate('responsibleTester', 'firstName lastName email')

};

export const getDeveloperTickets = (developerId) => {
  return Ticket.find({ developer: developerId })
  .populate('client', 'firstName lastName email')
  .populate('responsibleClient', 'firstName lastName email')
  .populate('agentCommercial', 'firstName lastName email');
};

export const getGroupLeaderTickets = (groupleaderId) => {
  return Ticket.find({ groupLeader: groupleaderId })
  .populate('client', 'firstName lastName email')
  .populate('responsibleClient', 'firstName lastName email')
  .populate('agentCommercial', 'firstName lastName email');
};

export const getProjectManagerTickets = (projectmanagerId) => {
  return Ticket.find({ projectManager: projectmanagerId })
  .populate('client', 'firstName lastName email')
  .populate('responsibleClient', 'firstName lastName email')
  .populate('agentCommercial', 'firstName lastName email');
};
export const getStats = async (user) => {
  let stats = {};

  let openQuery = { status: { $nin: ['Closed', 'Cancelled'] } };
  let closedQuery = { status: { $in: ['Closed', 'Cancelled'] } };

  // Apply user-based filtering
  if (user.role === 'agentCommercial') {
    openQuery.agentCommercial = user.id;
    closedQuery.agentCommercial = user.id;
  } else if (user.role === 'projectManager') {
    openQuery.projectManager = user.id;
    closedQuery.projectManager = user.id;
  } else if (user.role === 'client') {
    openQuery.client = user.id;
    closedQuery.client = user.id;
  }else if (user.role === 'groupLeader') {
    openQuery.groupLeader = user.id;
    closedQuery.groupLeader = user.id;
  }

  const openTicketsCount = await Ticket.countDocuments(openQuery);
  const closedTicketsCount = await Ticket.countDocuments(closedQuery);

  stats.openTickets = openTicketsCount;
  stats.closedTickets = closedTicketsCount;

  if (user.role === 'admin' || user.role === 'responsibleClient') {
    const urgentTicketsCount = await Ticket.countDocuments({
      urgency: 'Critical',
      status: { $nin: ['Closed', 'Cancelled'] }
    });
    stats.urgentTickets = urgentTicketsCount;

    const pendingValidationCount = await Ticket.countDocuments({
      status: { $in: ['TechnicalValidation', 'ClientValidation'] }
    });
    stats.pendingValidation = pendingValidationCount;
  }

  if (user.role === 'agentCommercial') {
    const assignedInterventionsCount = await Ticket.countDocuments({
      agentCommercial: user.id,
      status: { $in: ['InProgress', 'Revision'] }
    });
    stats.assignedInterventions = assignedInterventionsCount;
  }

  if (user.role === 'projectManager') {
    const assignedInterventionsCount = await Ticket.countDocuments({
      projectManager: user.id,
      status: { $in: ['InProgress', 'Revision'] }
    });
    stats.assignedInterventions = assignedInterventionsCount;
  }

  if (user.role === 'client') {
    const clientTicketsCount = await Ticket.countDocuments({ client: user.id });
    stats.totalTickets = clientTicketsCount;

    const pendingActionCount = await Ticket.countDocuments({
      client: user.id,
      status: 'ClientValidation'
    });
    stats.pendingAction = pendingActionCount;
  }

  return stats;
};


export const getRecentActivity = async (user) => {
  let query = {};

  if (user.role === 'client') {
    query.client = user.id;
  } else if (user.role === 'responsibleClient') {
    query.responsibleClient = user.id;
  } else if (user.role === 'agentCommercial') {
    query.$or = [
      { agentCommercial: user.id },
      { createdBy: user.id }
    ];
  }else if (user.role === 'projectManager') {
    query.projectManager = user.id;
  }else if (user.role === 'groupLeader') {
    query.groupLeader = user.id;
  }
  else if (user.role === 'responsibleTester') {
    query.responsibleTester = user.id;
  }
  const tickets = await Ticket.find(query)
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title activities comments updatedAt status')
    .populate(populateOptions);

  const activities = tickets.flatMap(ticket => {
    const ticketActivities = [];
    
    if (ticket.comments?.length > 0) {
      const latestComment = ticket.comments[ticket.comments.length - 1];
      ticketActivities.push({
        type: 'comment_added',
        ticketId: ticket._id,
        ticketTitle: ticket.title,
        description: `Comment added on ticket "${ticket.title}"`,
        author: latestComment.author,
        date: latestComment.createdAt
      });
    }

    const statusChanges = ticket.activities?.filter(a => a.type === 'status_change');
    if (statusChanges?.length > 0) {
      const latestStatusChange = statusChanges[statusChanges.length - 1];
      ticketActivities.push({
        type: 'status_change',
        ticketId: ticket._id,
        ticketTitle: ticket.title,
        description: `Ticket "${ticket.title}" status changed to ${latestStatusChange.to}`,
        date: latestStatusChange.date
      });
    }

    return ticketActivities;
  });

  return activities
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
};


export const getTickets = async (user) => {
  let tickets;
  let query = {}; // Add this line to define the query variable

  switch (user.role) {
    case 'admin':
      tickets = await Ticket.find()
        .populate('client', 'firstName lastName email')
        .populate('responsibleClient', 'firstName lastName email')
        .populate('agentCommercial', 'firstName lastName email')
        .populate('responsibleTester', 'firstName lastName email');
      break;
    case 'client':
      tickets = await getClientTickets(user.id);
      break;
    case 'agentCommercial':
      tickets = await getAgentTickets(user.id);
      break;
    case 'responsibleClient':
      tickets = await getResponsibleTickets(user.id);
      break;
    case 'developer':
      tickets = await getDeveloperTickets(user.id);
      break;
    case 'groupLeader':
      tickets = await getGroupLeaderTickets(user.id);
      break;
    case 'projectManager':
      tickets = await getProjectManagerTickets(user.id);
      break;
    default:
      tickets = [];
  }

  return tickets;
};

export const getTicketById = async (ticketId, user) => {
  const ticket = await Ticket.findById(ticketId).populate(populateOptions);

  if (!ticket) throw new Error('Ticket not found');

  const isAuthorized = ['admin'].includes(user.role) ||
    ticket.client?._id.toString() === user.id ||
    ticket.responsibleClient?._id.toString() === user.id ||
    ticket.agentCommercial?._id.toString() === user.id||
    ticket.groupLeader?._id.toString() === user.id||
    ticket.projectManager?._id.toString() === user.id||
    ticket.createdBy?._id.toString() === user.id||
    ticket.responsibleTester?._id.toString() === user.id
  if (!isAuthorized) throw new Error('Not authorized to access this ticket');

  return ticket;
};

export const createTicket = async (user, ticketData, files) => {
  // Handle both FormData and regular JSON (your existing parsing logic)
  let data;
  if (typeof ticketData === 'string') {
    try {
      data = JSON.parse(ticketData);
    } catch (error) {
      throw new Error('Invalid ticket data format - string not valid JSON');
    }
  } else if (ticketData.ticketData) {
    data = typeof ticketData.ticketData === 'string' 
      ? JSON.parse(ticketData.ticketData) 
      : ticketData.ticketData;
  } else {
    data = ticketData;
  }

 
  const ticketPayload = {
    number: generateTicketNumber(),
    title: data.title,
    application: data.application,
    environment: data.environment,
    requestType: data.requestType,
    urgency: data.urgency,
    description: data.description,
    driveLink: data.driveLink || '',
    additionalInfo: data.additionalInfo || '',
    links: data.links || [],
    contacts: data.contacts || [],
    meetingDateTime: data.meetingDateTime,
    createdBy: user.id,
    status: data.status || 'Sent',
  };

  // Your existing role assignments
  if (user.role === 'client') {
    ticketPayload.client = user.id;
  } else if (user.role === 'admin' && data.clientId) {
    ticketPayload.client = data.clientId;
  } else if (user.role === 'agentCommercial') {
    if (!data.clientId) throw new Error('clientId is required for agentCommercial');
    ticketPayload.client = data.clientId;
    ticketPayload.agentCommercial = user.id;
  } else if (user.role === 'responsibleClient') {
    if (!data.clientId) throw new Error('clientId is required for responsibleClient');
    ticketPayload.client = data.clientId;
    ticketPayload.responsibleClient = user.id;
  }

  // Get the full name of the user who created the ticker
  const fullName = `${user.firstName} ${user.lastName} `;

  try {
    const newTicket = await Ticket.create(ticketPayload);

    // Create and send notifications to the mentioned users
    for (const contact of ticketPayload.contacts) {
      // Send a notification to each user from ticker.contacts
      if (contact.email) {
        const user = await User.findOne({ email: contact.email });
        if (user) {
          await NotificationService.createNotifications(
            [user._id],
            `A new ticket "${ticketPayload.title}" has been assigned to you by ${fullName}.`,
            newTicket._id,
            "Ticket"
          );
        }
      }
    }
 
    // In createTicket function, replace the problematic section with:
    if (files && files.length > 0 && files[0].path.includes("temp")) {
    const sanitizeFileName = (filename) => {
    return filename.replace(/[^a-zA-Z0-9-_]/g, "-"); // Allow alphanumeric, dash and underscore, keep case
    };
    
    const folderName = sanitizeFileName(ticketPayload.number);
    
    const ticketDir = path.join(
    process.cwd(),
    "server",
    "uploads",
    "ticket",
    folderName
    );
    
    if (!fs.existsSync(ticketDir)) {
    fs.mkdirSync(ticketDir, { recursive: true });
    }
    
    const attachments = await Promise.all(
    files.map(async (file) => {
    const newPath = path.join(ticketDir, path.basename(file.path));
    await fs.promises.rename(file.path, newPath);
    return {
    name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    url: `server/uploads/ticket/${folderName}/${path.basename(newPath)}`,
    path: newPath,
    };
    })
    );
    
    newTicket.attachments = attachments;
    await newTicket.save();
    }
 
    return newTicket;
  } catch (error) {
    // Cleanup any uploaded files
    if (files) {
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    throw error;
  }
};

// Helper function to generate ticket number
export const generateTicketNumber = () => {
  const date = new Date();
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `TCK_INC_${formattedDate}_URG_${randomPart}`;
};

// Update ticket status
export const updateTicketStatus = async (ticketId, { status }, user) => {
  if (!status) throw new Error('Status is required');

  const currentTicket = await Ticket.findById(ticketId);
  if (!currentTicket) throw new Error('Ticket not found');

  const updatedTicket = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      status,
      updatedAt: new Date(),
      $push: {
        activities: {
          $each: [{
            type: 'status_change',
            from: currentTicket.status,
            to: status,
            user: user.id,
            date: new Date()
          }],
          $position: 0
        }
      }
    },
    { new: true }
  ).populate(populateOptions);

  // Notify involved users and admins about status change
  if (status !== currentTicket.status) {
    const changer = await User.findById(user.id);
    const changerName = `${changer.firstName} ${changer.lastName}`;
    const message = `${changerName} changed the status of ticket "${currentTicket.title}" from ${currentTicket.status} to ${status}`;

    // Collect involved user IDs
    const involvedUserIds = [];
    if (currentTicket.client) involvedUserIds.push(currentTicket.client.toString());
    if (currentTicket.responsibleClient) involvedUserIds.push(currentTicket.responsibleClient.toString());
    if (currentTicket.agentCommercial) involvedUserIds.push(currentTicket.agentCommercial.toString());
    if (currentTicket.projectManager) involvedUserIds.push(currentTicket.projectManager.toString());
    if (currentTicket.groupLeader) involvedUserIds.push(currentTicket.groupLeader.toString());
    if (currentTicket.responsibleTester) involvedUserIds.push(currentTicket.responsibleTester.toString());
    if (currentTicket.createdBy) involvedUserIds.push(currentTicket.createdBy.toString());

    // Get admins
    const admins = await User.find({ role: 'admin' });
    const adminUserIds = admins.map(admin => admin._id.toString());

    // Merge and remove duplicates
    const allUserIds = [...new Set([...involvedUserIds, ...adminUserIds])];

    await NotificationService.createNotifications(allUserIds, message, ticketId, 'Ticket');
  }

  return updatedTicket;
};

// Update ticket financial status
export const updateTicket = async (ticketId, { financialStatus, estimatedHours, actualHours }, user) => {
  const currentTicket = await Ticket.findById(ticketId);
  if (!currentTicket) throw new Error('Ticket not found');

  const update = { updatedAt: new Date() };
  const activities = [];

  if (financialStatus !== undefined && currentTicket.financialStatus !== financialStatus) {
    update.financialStatus = financialStatus;
    activities.push({
      type: 'status_change',
      from: currentTicket.financialStatus,
      to: financialStatus,
      user: user.id,
      date: new Date()
    });
  }

  if (estimatedHours !== undefined) update.estimatedHours = estimatedHours;
  if (actualHours !== undefined) update.actualHours = actualHours;

  if (activities.length > 0) {
    update.$push = {
      activities: {
        $each: activities,
        $position: 0
      }
    };
  }

  return await Ticket.findByIdAndUpdate(
    ticketId,
    update,
    { new: true }
  ).populate(populateOptions);
};

// Add a comment to a ticket
export const addCommentToTicket = async (ticketId, { comment }, user, files) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error('Ticket not found');

  // Get the full user data to ensure we have firstName and lastName
  const fullUser = await User.findById(user.id);
  if (!fullUser) throw new Error('User not found');

  let attachments = [];
  
  if (files && files.length > 0) {
    const folderName = ticket.number.replace(/[^a-zA-Z0-9-_]/g, "-");
    
    // Ensure the comments directory exists
    const commentsDir = path.join(
      process.cwd(),
      'server',
      'uploads',
      'ticket',
      folderName,
      'comments'
    );
    if (!fs.existsSync(commentsDir)) {
      fs.mkdirSync(commentsDir, { recursive: true });
    }
    
    attachments = await Promise.all(
      files.map(async (file) => {
        const newPath = path.join(commentsDir, path.basename(file.path));
        await fs.promises.rename(file.path, newPath);
        return {
          name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
          url: `server/uploads/ticket/${folderName}/comments/${path.basename(newPath)}`
        };
      })
    );
  }

  const newComment = {
    text: comment,
    author: `${fullUser.firstName} ${fullUser.lastName}`,
    authorId: fullUser._id,
    files: attachments, // Match the schema structure
    createdAt: new Date()
  };

  return await Ticket.findByIdAndUpdate(
    ticketId,
    {
      $push: { 
        comments: newComment,
        activities: {
          $each: [{
            type: 'comment_added',
            user: fullUser._id,
            date: new Date(),
            metadata: attachments.length > 0 ? { 
              filesCount: attachments.length,
              fileNames: attachments.map(a => a.name)
            } : undefined
          }],
          $position: 0
        }
      },
      updatedAt: new Date()
    },
    { new: true }
  ).populate(populateOptions);
};

// Get availability slots for a ticket
export const getTicketAvailability = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId);
  
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  const availabilitySlots = [];
  
  if (ticket.contacts && ticket.contacts.length > 0) {
    ticket.contacts.forEach(contact => {
      if (contact.availability && contact.availability.length > 0) {
        availabilitySlots.push(...contact.availability);
      }
    });
  }
  
  return [...new Set(availabilitySlots)];
};

// Add a meeting to a ticket
export const addMeetingToTicket = async (ticketId, { title, dateTime, meetingLink, agenda, selectedAgents }, user) => {
  const newMeeting = {
    title,
    dateTime,
    meetingLink,
    agenda,
    organizer: user.id,
    attendees: selectedAgents,
    createdAt: new Date()
  };

  return await Ticket.findByIdAndUpdate(
    ticketId,
    {
      $push: { 
        meetings: newMeeting,
        activities: {
          $each: [{
            type: 'meeting_scheduled',
            user: user.id,
            date: new Date(),
            metadata: { meetingTitle: title, meetingDate: dateTime }
          }],
          $position: 0
        }
      },
      updatedAt: new Date()
    },
    { new: true }
  ).populate(populateOptions);
};

// Add or start an intervention on a ticket
export const addInterventionToTicket = async (ticketId, body, user) => {
  const update = { updatedAt: new Date() };
  const activity = {
    type: body.action === 'start' ? 'intervention_started' : 'intervention_created',
    user: user.id,
    date: new Date()
  };

  if (body.action === 'start') {
    update.status = 'InProgress';
    update.intervention = {
      startedAt: new Date(),
      agent: user.id,
      validationRequested: false
    };
  } else {
    const { type, urgencyLevel, description, deadline } = body;
    activity.metadata = { interventionType: type, urgencyLevel };
    
    update.$push = {
      interventions: {
        type,
        urgencyLevel,
        description,
        deadline,
        agent: user.id,
        createdAt: new Date()
      }
    };
  }

  update.$push = update.$push || {};
  update.$push.activities = {
    $each: [activity],
    $position: 0
  };

  return await Ticket.findByIdAndUpdate(
    ticketId,
    update,
    { new: true }
  ).populate(populateOptions);
};

export const validateIntervention = async (ticketId, userId) => {
  const currentTicket = await Ticket.findById(ticketId);
  if (!currentTicket) throw new Error('Ticket not found');
  if (!currentTicket.agents.includes(userId)) throw new Error('Agent not assigned');

  return await Ticket.findByIdAndUpdate(
    ticketId,
    {
      'intervention.validationRequested': true,
      'intervention.validationRequestedAt': new Date(),
      status: 'TechnicalValidation',
      updatedAt: new Date(),
      $push: {
        activities: {
          $each: [{
            type: 'validation_requested',
            user: userId,
            date: new Date()
          }],
          $position: 0
        }
      }
    },
    { new: true }
  ).populate(populateOptions);
};


export const validateOrRejectIntervention = async (ticketId, interventionId, isApproved, userId) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (ticket.responsibleClient.toString() !== userId) {
    throw new Error('Not authorized to validate this ticket');
  }

  const interventionIndex = ticket.interventions.findIndex(
    (intervention) => intervention._id.toString() === interventionId
  );

  if (interventionIndex === -1) {
    throw new Error('Intervention not found');
  }

  // Update intervention validation status
  ticket.interventions[interventionIndex].validated = isApproved;
  ticket.interventions[interventionIndex].validatedAt = new Date();
  ticket.interventions[interventionIndex].validatedBy = userId;

  ticket.status = isApproved ? 'ClientValidation' : 'Revision';
  ticket.updatedAt = new Date();

  if (!ticket.activities) {
    ticket.activities = [];
  }

  ticket.activities.push({
    type: isApproved ? 'intervention_validated' : 'intervention_rejected',
    user: userId,
    date: new Date(),
  });

  await ticket.save();

  return Ticket.findById(ticketId)
    .populate('client', 'firstName lastName email')
    .populate('responsibleClient', 'firstName lastName email')
    .populate('agentCommercial', 'firstName lastName email')
    .populate('agents', 'firstName lastName email');
};

export const addBlocker = async (ticketId, interventionId, { type, description, impact }, userId) => {
  const blocker = {
    type,
    description,
    impact,
    createdBy: userId,
    createdAt: new Date(),
    resolved: false
  };

  return await Ticket.findOneAndUpdate(
    { 
      _id: ticketId,
      'interventions._id': interventionId 
    },
    {
      $push: {
        'interventions.$.blockers': blocker,
        activities: {
          $each: [{
            type: 'blocker_added',
            user: userId,
            date: new Date(),
            metadata: { blockerType: type, impact }
          }],
          $position: 0
        }
      },
      updatedAt: new Date()
    },
    { new: true }
  ).populate(populateOptions);
};

export const resolveBlocker = async (ticketId, interventionId, blockerId, resolutionNotes, userId) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const intervention = ticket.interventions.find(
    (i) => i._id.toString() === interventionId
  );

  if (!intervention) {
    throw new Error('Intervention not found');
  }

  const blockerIndex = intervention.blockers.findIndex(
    (b) => b._id.toString() === blockerId
  );

  if (blockerIndex === -1) {
    throw new Error('Blocker not found');
  }

  intervention.blockers[blockerIndex].resolved = true;
  intervention.blockers[blockerIndex].resolvedAt = new Date();
  intervention.blockers[blockerIndex].resolvedBy = userId;
  intervention.blockers[blockerIndex].resolutionNotes = resolutionNotes;

  ticket.updatedAt = new Date();

  if (!ticket.activities) {
    ticket.activities = [];
  }

  ticket.activities.push({
    type: 'blocker_resolved',
    user: userId,
    date: new Date(),
  });

  await ticket.save();

  return Ticket.findById(ticketId)
    .populate('client', 'firstName lastName email')
    .populate('responsibleClient', 'firstName lastName email')
    .populate('agentCommercial', 'firstName lastName email')
};

export const assignRoles = async (ticketId, { responsibleClient, commercial, groupLeader, projectManager,responsibleTester }, userId, userRole) => {
  // Prepare the update object
  const update = {
    updatedAt: new Date(),
    $push: {
      activities: {
        $each: [],
        $position: 0
      }
    }
  };

  // Get current ticket to check current status and prepare activities
  const currentTicket = await Ticket.findById(ticketId);
  if (!currentTicket) {
    throw new Error('Ticket not found');
  }

  // Only send notification to the newly assigned users
  const assignedIds = [];

  // Handle role assignments based on user role
  if (userRole === 'admin') {
    if (responsibleClient && responsibleClient !== currentTicket.responsibleClient?.toString()) {
      update.responsibleClient = responsibleClient;
      assignedIds.push(responsibleClient);
    }
    if (commercial && commercial !== currentTicket.agentCommercial?.toString()) {
      update.agentCommercial = commercial;
      assignedIds.push(commercial);
    }
    if (groupLeader && groupLeader !== currentTicket.groupLeader?.toString()) {
      update.groupLeader = groupLeader;
      assignedIds.push(groupLeader);
    }
    if (projectManager && projectManager !== currentTicket.projectManager?.toString()) {
      update.projectManager = projectManager;
      assignedIds.push(projectManager);
    }
    if (responsibleTester && responsibleTester !== currentTicket.responsibleTester?.toString()) {
      update.responsibleTester = responsibleTester;
      assignedIds.push(responsibleTester);
    }
  } else if (userRole === 'agentCommercial') {
    if (groupLeader && groupLeader !== currentTicket.groupLeader?.toString()) {
      update.groupLeader = groupLeader;
      assignedIds.push(groupLeader);
    }
    if (projectManager && projectManager !== currentTicket.projectManager?.toString()) {
      update.projectManager = projectManager;
      assignedIds.push(projectManager);
    }
  }

  // Handle status change if ticket was expired
  if (currentTicket.status === 'Expired') {
    update.status = 'Sent';
    update.$push.activities.$each.push({
      type: 'status_changed',
      description: 'Status changed from Expired to Sent upon role assignment',
      user: userId,
      date: new Date(),
    });
  }

  // Always add assignment activity
  update.$push.activities.$each.push({
    type: 'assignment_updated',
    user: userId,
    date: new Date(),
  });

  // Perform the update
  const updatedTicket = await Ticket.findByIdAndUpdate(
    ticketId,
    update,
    { new: true }
  )
  .populate('client', 'firstName lastName email')
  .populate('responsibleClient', 'firstName lastName email')
  .populate('agentCommercial', 'firstName lastName email')
  .populate('responsibleTester', 'firstName lastName email')
  .populate('projectManager', 'firstName lastName email')
  .populate('groupLeader', 'firstName lastName email');

  // Get the full name of user who is assigning the roles, to include it in the notification msg
  const assigningUser = await User.findById(userId);
  const fullName = `${assigningUser.firstName} ${assigningUser.lastName}` ;

  for (const id of assignedIds) {
    if (!id) continue;  // skip empty
    const user = await User.findById(id);
    if (user) {
      await NotificationService.createNotifications(
        [user._id],
        `You have been assigned a role on ticket "${updatedTicket.title}" by ${fullName}.`,
        updatedTicket._id,
        "Ticket"
      );
    }
  }

  return updatedTicket;
};

const populateOptions = [
  { path: 'client', select: 'firstName lastName email' },
  { path: 'responsibleClient', select: 'firstName lastName email' },
  { path: 'agentCommercial', select: 'firstName lastName email' },
  { path: 'projectManager', select: 'firstName lastName email' },
  { path: 'groupLeader', select: 'firstName lastName email' },
  { path: 'responsibleTester', select: 'firstName lastName email' }
];

export const downloadAttachment = async (ticketId, attachmentId) => {
  try {
    // Find the ticket and attachment
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Find the specific attachment
    const attachment = ticket.attachments.find(
      att => att._id.toString() === attachmentId
    );
    
    if (!attachment) {
      throw new Error('Attachment not found');
    }
    const filePath = path.join(process.cwd(), attachment.url);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`[Service] File not found at expected path: ${filePath}`); // Added more specific logging
      throw new Error('File not found on server');
    }

    // Get file stats for content length
    const fileStats = fs.statSync(filePath);

    // Return file information for the controller to handle
    return {
      path: filePath,
      filename: attachment.name, // Use original name for download
      contentType: getContentType(attachment.name || filePath),
      size: fileStats.size,
      stream: fs.createReadStream(filePath)
    };

  } catch (error) {
    console.error('[Service] Error in downloadAttachment:', error); 
    throw error;
  }
};

// Helper function to determine content type remains unchanged
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.zip': 'application/zip'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};