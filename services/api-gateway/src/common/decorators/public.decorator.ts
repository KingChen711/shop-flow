import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '@common/guards/jwt-auth.guard';

/**
 * Mark a route as public (no authentication required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
