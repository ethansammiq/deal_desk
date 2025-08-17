import { Router } from 'express';
import { storage } from './storage';
import { insertDealSchema, insertCommentSchema } from '@shared/schema';
import { z } from 'zod';

export const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Users routes
router.get('/users', async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Deals routes
router.get('/deals', async (req, res) => {
  try {
    const { status, sellerId, assignedReviewer } = req.query;
    const filters: any = {};
    
    if (status) filters.status = status as string;
    if (sellerId) filters.sellerId = sellerId as string;
    if (assignedReviewer) filters.assignedReviewer = assignedReviewer as string;

    const deals = await storage.getDeals(Object.keys(filters).length > 0 ? filters : undefined);
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

router.get('/deals/:id', async (req, res) => {
  try {
    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

router.post('/deals', async (req, res) => {
  try {
    const dealData = insertDealSchema.parse(req.body);
    const deal = await storage.createDeal(dealData);
    res.status(201).json(deal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid deal data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

router.patch('/deals/:id', async (req, res) => {
  try {
    const updates = req.body;
    const deal = await storage.updateDeal(req.params.id, updates);
    res.json(deal);
  } catch (error) {
    if (error instanceof Error && error.message === 'Deal not found') {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

router.delete('/deals/:id', async (req, res) => {
  try {
    await storage.deleteDeal(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

// Comments routes
router.get('/deals/:dealId/comments', async (req, res) => {
  try {
    const comments = await storage.getCommentsByDealId(req.params.dealId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/deals/:dealId/comments', async (req, res) => {
  try {
    const commentData = insertCommentSchema.parse({
      ...req.body,
      dealId: req.params.dealId
    });
    const comment = await storage.createComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid comment data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Deal actions
router.post('/deals/:id/submit', async (req, res) => {
  try {
    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (deal.status !== 'draft') {
      return res.status(400).json({ error: 'Deal can only be submitted from draft status' });
    }

    const updatedDeal = await storage.updateDeal(req.params.id, {
      status: 'submitted',
      approvalHistory: [
        ...(deal.approvalHistory || []),
        {
          userId: req.body.userId || 'system',
          action: 'submitted',
          timestamp: new Date().toISOString(),
          comments: req.body.comments
        }
      ]
    });

    res.json(updatedDeal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit deal' });
  }
});

router.post('/deals/:id/approve', async (req, res) => {
  try {
    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const updatedDeal = await storage.updateDeal(req.params.id, {
      status: 'approved',
      approvalHistory: [
        ...(deal.approvalHistory || []),
        {
          userId: req.body.userId || 'system',
          action: 'approved',
          timestamp: new Date().toISOString(),
          comments: req.body.comments
        }
      ]
    });

    res.json(updatedDeal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve deal' });
  }
});

router.post('/deals/:id/reject', async (req, res) => {
  try {
    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const updatedDeal = await storage.updateDeal(req.params.id, {
      status: 'rejected',
      approvalHistory: [
        ...(deal.approvalHistory || []),
        {
          userId: req.body.userId || 'system',
          action: 'rejected',
          timestamp: new Date().toISOString(),
          comments: req.body.comments || 'Deal rejected'
        }
      ]
    });

    res.json(updatedDeal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject deal' });
  }
});