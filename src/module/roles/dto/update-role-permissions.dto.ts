import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRolePermissionsDto {
  @IsOptional()
  @IsBoolean()
  canManageUsers?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageContent?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageBilling?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageSettings?: boolean;
}
