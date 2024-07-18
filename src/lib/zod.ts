import { z } from 'zod';
import { extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export { z };