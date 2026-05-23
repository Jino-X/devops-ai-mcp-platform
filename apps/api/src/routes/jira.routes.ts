import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { jiraService } from '../services/jira.service.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requirePermissions } from '../middleware/auth.js';

const router = Router();

const saveIntegrationSchema = z.object({
  host: z.string().url(),
  email: z.string().email(),
  apiToken: z.string().min(1),
  defaultProjectKey: z.string().optional(),
});

const createIssueSchema = z.object({
  projectKey: z.string().min(1).max(10),
  summary: z.string().min(1).max(256),
  description: z.string().max(32768).optional(),
  issueType: z.enum(['Bug', 'Task', 'Story', 'Epic']),
  priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const updateIssueSchema = z.object({
  summary: z.string().min(1).max(256).optional(),
  description: z.string().max(32768).optional(),
  priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

const addCommentSchema = z.object({
  body: z.string().min(1).max(32768),
});

const transitionSchema = z.object({
  transitionId: z.string().min(1),
});

router.use(authenticate);

router.post(
  '/integration',
  validate(saveIntegrationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await jiraService.saveIntegration(req.user!.userId, req.body);

      res.json({
        success: true,
        data: { message: 'Jira integration saved' },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/projects/:projectKey/issues',
  requirePermissions('jira:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await jiraService.getIssues(
        req.user!.userId,
        req.params['projectKey']!,
        {
          status: req.query['status'] as string,
          maxResults: req.query['maxResults'] ? parseInt(req.query['maxResults'] as string) : undefined,
        }
      );

      res.json({
        success: true,
        data: result.issues,
        meta: { total: result.total },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/issues/:issueKey',
  requirePermissions('jira:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issue = await jiraService.getIssue(req.user!.userId, req.params['issueKey']!);

      res.json({
        success: true,
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/issues',
  requirePermissions('jira:write'),
  validate(createIssueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issue = await jiraService.createIssue(req.user!.userId, req.body);

      res.status(201).json({
        success: true,
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/issues/:issueKey',
  requirePermissions('jira:write'),
  validate(updateIssueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issue = await jiraService.updateIssue(
        req.user!.userId,
        req.params['issueKey']!,
        req.body
      );

      res.json({
        success: true,
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/issues/:issueKey/comments',
  requirePermissions('jira:write'),
  validate(addCommentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await jiraService.addComment(req.user!.userId, req.params['issueKey']!, req.body.body);

      res.status(201).json({
        success: true,
        data: { message: 'Comment added' },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/issues/:issueKey/transitions',
  requirePermissions('jira:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transitions = await jiraService.getTransitions(
        req.user!.userId,
        req.params['issueKey']!
      );

      res.json({
        success: true,
        data: transitions,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/issues/:issueKey/transitions',
  requirePermissions('jira:write'),
  validate(transitionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await jiraService.transitionIssue(
        req.user!.userId,
        req.params['issueKey']!,
        req.body.transitionId
      );

      res.json({
        success: true,
        data: { message: 'Issue transitioned' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as jiraRouter };
