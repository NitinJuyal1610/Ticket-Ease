import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { Request, Response, NextFunction } from 'express';

export class DefaultRoute implements Routes {
  public path = '/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, (req: Request, res: Response, next: NextFunction) => {
      res.status(200).json({
        message: 'SERVER RUNNING ON PORT 3000',
        whatNext: 'Got to the route {{baseUrl}}/api-docs',
      });
    });
  }
}
