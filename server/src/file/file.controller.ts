import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { FileEntity } from './entities/file.entity';
import { User } from '../users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionGuard } from './guards/permission.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { FilePermissions } from '../types';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('shared')
  async getFileByLink(
    @Query('link') link: string,
    @Query()
    query: {
      search: string;
      dir_path: string;
      page: string;
      pageSize: string;
    },
  ) {
    return await this.fileService.getFileList(undefined, query, link);
  }

  @Get('shared-users/:fileId')
  @UseGuards(JwtAuthGuard)
  async getUsersWithPermissions(@Param('fileId') fileId: string) {
    return await this.fileService.getUsersWithPermissionsByFileId(fileId);
  }

  @Post('share')
  @UseGuards(JwtAuthGuard)
  async shareFile(
    @Req() req: Request,
    @Body()
    shareData: {
      fileId: string;
      isPublic: boolean;
      usersAndPermissions: Array<{
        user: string;
        permission: string;
      }>;
    },
  ) {
    const user = req.user as User;
    return this.fileService.shareFile(user.id, shareData);
  }

  @Post('update-share')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(FilePermissions.WRITE)
  async updateShare(
    @Req() req: Request,
    @Body()
    updateShareData: {
      fileId: string;
      isPublic: boolean;
      usersAndPermissions: Array<{
        user: string;
        permission: string;
      }>;
    },
  ) {
    const user = req.user as User;
    return await this.fileService.updateSharedFile(user.id, updateShareData);
  }

  @Get('get-dir-list')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(FilePermissions.READ)
  async getFileList(
    @Req() req: Request,
    @Query('link') link: string,
    @Query()
    query: { search: string; dir_path: string; page: string; pageSize: string },
  ): Promise<FileEntity | { items: FileEntity[]; total: number }> {
    const user = req.user as User;
    return await this.fileService.getFileList(user.id, query, link);
  }

  @Post('generate-share-link')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(FilePermissions.WRITE)
  async generateShareLink(@Req() req: Request, @Body('id') id: string) {
    const user = req.user as User;
    return await this.fileService.generateShareableLink(
      user.id,
      id,
      FilePermissions.READ,
      true,
    );
  }

  @Post('revoke-share-link')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(FilePermissions.DELETE)
  async revokeShareLink(@Req() req: Request, @Body('id') id: string) {
    const user = req.user as User;
    return await this.fileService.revokeShareableLink(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('permissions-list')
  async getPermissionsList() {
    return await this.fileService.getPermissionsList();
  }

  @Post('create-directory')
  @UseGuards(JwtAuthGuard)
  async createDirectory(
    @Req() req: Request,
    @Body() createFileDto: CreateFileDto,
  ) {
    const user = req.user as User;
    return await this.fileService.createDirectory(createFileDto, user.id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body('dirPath') dirPath: string,
    @Body('isPublic') isPublic: string,
  ) {
    const user = req.user as User;
    return await this.fileService.uploadFile(file, user.id, dirPath, isPublic);
  }

  @Put('update')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(FilePermissions.WRITE)
  async updateFile(
    @Req() req: Request,
    @Body()
    body: { id: string; name?: string; dirPath?: string; isPublic?: boolean },
  ) {
    const user = req.user as User;
    return await this.fileService.updateFile(user.id, body.id, body);
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(FilePermissions.DELETE)
  async deleteFile(@Body('id') id: string) {
    return await this.fileService.deleteFile(id);
  }
}
