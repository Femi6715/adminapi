import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import adminRoutes from './routes/admin.routes';
import { environment } from './config/environment';
import './config/database';  // Import database connection

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/admin', adminRoutes);

// Debug route to check all registered routes
app.get('/debug/routes', (req: Request, res: Response) => {
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json(routes);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Basic route for testing
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 