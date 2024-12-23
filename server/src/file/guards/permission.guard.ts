import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION } from '../decorators/require-permission.decorator';
import { FilePermissions } from '../../types';
import { FileService } from '../file.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly fileService: FileService,
  ) {}

  async resolveFileId(request): Promise<string | null> {
    const fileIdFromParams = request.body?.fileId || request.body?.id;

    if (fileIdFromParams) {
      return fileIdFromParams;
    }

    if (request.query?.link) {
      const sharedFile = await this.fileService.getFile(
        undefined,
        request.query?.link,
      );

      if (!sharedFile) {
        throw new ForbiddenException('File or directory not found.');
      }

      if (!sharedFile.isPublic) {
        const user = request.user;
        if (!user) {
          throw new ForbiddenException('User is required to access this file.');
        }

        const hasPermission = await this.fileService.checkFilePermission(
          user.id,
          sharedFile.id,
          FilePermissions.READ,
        );

        if (!hasPermission) {
          throw new ForbiddenException(
            `Permission denied: You need ${FilePermissions.READ} access.`,
          );
        }
      }

      return sharedFile.id;
    }

    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<string>(
      REQUIRE_PERMISSION,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const shareableFileId = await this.resolveFileId(request);
    if (!permission || !shareableFileId) return true;

    if (!user || !shareableFileId) {
      throw new ForbiddenException('User or file ID is missing.');
    }

    const hasPermission = await this.fileService.checkFilePermission(
      user.id,
      shareableFileId,
      permission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permission denied: You need ${permission} access.`,
      );
    }

    return true;
  }
}
