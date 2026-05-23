import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { githubService } from '../services/github.service.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requirePermissions } from '../middleware/auth.js';

const router = Router();

const saveIntegrationSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.enum(['personal', 'oauth', 'app']).default('personal'),
});

const createIssueSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  title: z.string().min(1).max(256),
  body: z.string().max(65536).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

router.use(authenticate);

router.post(
  '/integration',
  validate(saveIntegrationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await githubService.saveIntegration(
        req.user!.userId,
        req.body.accessToken,
        req.body.tokenType
      );

      res.json({
        success: true,
        data: { message: 'GitHub integration saved' },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/repos',
  requirePermissions('github:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repos = await githubService.getRepositories(req.user!.userId, {
        type: req.query['type'] as string,
        sort: req.query['sort'] as string,
        per_page: req.query['per_page'] ? parseInt(req.query['per_page'] as string) : undefined,
      });

      res.json({
        success: true,
        data: repos,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/repos/:owner/:repo',
  requirePermissions('github:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = await githubService.getRepository(
        req.user!.userId,
        req.params['owner']!,
        req.params['repo']!
      );

      res.json({
        success: true,
        data: repo,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/repos/:owner/:repo/pulls',
  requirePermissions('github:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prs = await githubService.getPullRequests(
        req.user!.userId,
        req.params['owner']!,
        req.params['repo']!,
        {
          state: req.query['state'] as string,
          per_page: req.query['per_page'] ? parseInt(req.query['per_page'] as string) : undefined,
        }
      );

      res.json({
        success: true,
        data: prs,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/repos/:owner/:repo/issues',
  requirePermissions('github:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issues = await githubService.getIssues(
        req.user!.userId,
        req.params['owner']!,
        req.params['repo']!,
        {
          state: req.query['state'] as string,
          per_page: req.query['per_page'] ? parseInt(req.query['per_page'] as string) : undefined,
        }
      );

      res.json({
        success: true,
        data: issues,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/repos/:owner/:repo/issues',
  requirePermissions('github:write'),
  validate(createIssueSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issue = await githubService.createIssue(
        req.user!.userId,
        req.body.owner,
        req.body.repo,
        {
          title: req.body.title,
          body: req.body.body,
          labels: req.body.labels,
          assignees: req.body.assignees,
        }
      );

      res.status(201).json({
        success: true,
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/repos/:owner/:repo/commits',
  requirePermissions('github:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const commits = await githubService.getCommits(
        req.user!.userId,
        req.params['owner']!,
        req.params['repo']!,
        {
          per_page: req.query['per_page'] ? parseInt(req.query['per_page'] as string) : undefined,
        }
      );

      res.json({
        success: true,
        data: commits,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/repos/:owner/:repo/contributors',
  requirePermissions('github:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contributors = await githubService.getContributors(
        req.user!.userId,
        req.params['owner']!,
        req.params['repo']!
      );

      res.json({
        success: true,
        data: contributors,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as githubRouter };
