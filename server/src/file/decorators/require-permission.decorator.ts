import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION = 'require_permission';

export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRE_PERMISSION, permission);
