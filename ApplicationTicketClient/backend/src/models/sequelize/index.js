// Import all models
import User from './User.model.js';
import Company, { Address, Contact, AvailabilitySlot, Document } from './Company.model.js';
import Ticket, { Comment, FileAttachment, TicketContact, Activity, Meeting, MeetingAttendee, CommentMention } from './Ticket.model.js';
import Task, { TaskComment, TaskAttachment, TaskTimeEntry } from './Task.model.js';
import TestTask, { TestStep, TestAttachment, TestComment } from './TestTask.model.js';

// Export all models
export {
  // Main models
  User,
  Company,
  Ticket,
  Task,
  TestTask,
  
  // Company related models
  Address,
  Contact,
  AvailabilitySlot,
  Document,
  
  // Ticket related models
  Comment,
  FileAttachment,
  TicketContact,
  Activity,
  Meeting,
  MeetingAttendee,
  CommentMention,
  
  // Task related models
  TaskComment,
  TaskAttachment,
  TaskTimeEntry,
  
  // TestTask related models
  TestStep,
  TestAttachment,
  TestComment
};

// Default export all models as an object
export default {
  User,
  Company,
  Ticket,
  Task,
  TestTask,
  Address,
  Contact,
  AvailabilitySlot,
  Document,
  Comment,
  FileAttachment,
  TicketContact,
  Activity,
  Meeting,
  MeetingAttendee,
  CommentMention,
  TaskComment,
  TaskAttachment,
  TaskTimeEntry,
  TestStep,
  TestAttachment,
  TestComment
};