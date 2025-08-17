import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  department: varchar('department', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Deals table
export const deals = pgTable('deals', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  customer: varchar('customer', { length: 255 }).notNull(),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  description: text('description'),
  sellerId: varchar('seller_id', { length: 255 }).notNull(),
  assignedReviewers: jsonb('assigned_reviewers').$type<string[]>().notNull().default([]),
  approvalHistory: jsonb('approval_history').$type<Array<{
    userId: string;
    action: string;
    timestamp: string;
    comments?: string;
  }>>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Comments table
export const comments = pgTable('comments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  dealId: varchar('deal_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDealSchema = createInsertSchema(deals).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  approvalHistory: true 
});

export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Enums and constants
export const DEAL_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'closed'
] as const;

export const USER_ROLES = [
  'seller',
  'department_reviewer',
  'approver',
  'admin'
] as const;

export const DEPARTMENTS = [
  'sales',
  'finance',
  'legal',
  'operations',
  'marketing',
  'technical'
] as const;

export const PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent'
] as const;

export type DealStatus = typeof DEAL_STATUSES[number];
export type UserRole = typeof USER_ROLES[number];
export type Department = typeof DEPARTMENTS[number];
export type Priority = typeof PRIORITIES[number];