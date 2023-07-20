import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { TicketRoute } from '@routes/tickets.route';
import { ValidateEnv } from '@utils/validateEnv';
import { DefaultRoute } from './routes/default.route';

ValidateEnv();

const app = new App([new UserRoute(), new AuthRoute(), new TicketRoute(), new DefaultRoute()]);

app.listen();
