import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission-settings';

export const PermissionSettings = (...permissions: string[]) =>
    SetMetadata(PERMISSION_KEY, permissions);
