import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserFile } from './entities/user-file.entity';
import { FileEntity } from './entities/file.entity';
import { Permission } from './entities/permissions.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { FilePermissions } from '../types';
import { MailService } from '../mail/mail.service';

@Injectable()
export class FileService {
  private readonly rootDir = path.resolve('storage');

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(UserFile)
    private readonly userFileRepository: Repository<UserFile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  private ensureRootDirExists() {
    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }
  }

  private async updateIsPublicRecursive(
    file: FileEntity,
    isPublic: boolean,
  ): Promise<void> {
    await this.fileRepository.update({ id: file.id }, { isPublic });

    const fullPathToMatch = path.join(file.dirPath, file.name);

    const childFiles = await this.fileRepository.find({
      where: {
        dirPath: Raw((alias) => `${alias} LIKE :path`, {
          path: `${fullPathToMatch}%`,
        }),
      },
    });

    for (const child of childFiles) {
      await this.updateIsPublicRecursive(child, isPublic);
    }
  }

  async checkFilePermission(
    userId: number,
    shareableFileId: string,
    requiredPermission: string,
  ): Promise<boolean> {
    const file = await this.getFile(shareableFileId);
    if (!file) {
      throw new NotFoundException('File or directory not found');
    }

    if (file.isPublic && requiredPermission === FilePermissions.READ) {
      return true;
    }

    const hasPermission = await this.fileRepository
      .createQueryBuilder('file')
      .leftJoin('file.userFiles', 'userFile')
      .leftJoin('userFile.permission', 'permission')
      .where('file.id = :shareableFileId', { shareableFileId })
      .andWhere('userFile.user_id = :userId', { userId })
      .andWhere('permission.name = :permission', {
        permission: requiredPermission,
      })
      .select(['file.id'])
      .getOne();

    return !!hasPermission;
  }

  async getUsersWithPermissionsByFileId(
    fileId: string,
  ): Promise<{ user: User; permission: string }[]> {
    const userFiles = await this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.userFiles', 'userFile')
      .leftJoinAndSelect('userFile.user', 'user')
      .leftJoinAndSelect('userFile.permission', 'permission')
      .where('file.id = :fileId', { fileId })
      .getOne();

    if (!userFiles) {
      throw new NotFoundException('File not found');
    }

    const sharedUsers = userFiles.userFiles.filter(
      (userFile) => userFile.user && userFile.user.id !== userFiles.ownerId,
    );

    return sharedUsers.map((userFile) => ({
      user: userFile.user,
      permission: userFile.permission.name,
    }));
  }

  async shareFile(
    ownerId: number,
    shareData: {
      fileId: string;
      isPublic: boolean;
      usersAndPermissions: Array<{
        user: string;
        permission: string;
      }>;
    },
  ): Promise<{ message: string; shareableLink?: string }> {
    const { fileId, isPublic, usersAndPermissions } = shareData;

    if (!fileId || typeof fileId !== 'string') {
      throw new BadRequestException('Invalid fileId provided');
    }

    const file = await this.fileRepository.findOne({
      where: { id: fileId, ownerId },
    });

    if (!file) {
      throw new NotFoundException('File or directory not found');
    }

    file.isPublic = isPublic;

    const specificPermissions: FilePermissions[] = [];

    if (isPublic) {
      const readPermission = await this.permissionsRepository.findOne({
        where: { name: FilePermissions.READ },
      });

      if (!readPermission) {
        throw new NotFoundException('Permission READ not found');
      }

      await this.userFileRepository.save({ file, permission: readPermission });
      specificPermissions.push(FilePermissions.READ);
    }

    if (usersAndPermissions.length > 0) {
      const existingUsers = await this.userRepository.findBy({
        email: In(usersAndPermissions.map((entry) => entry.user)),
      });

      if (existingUsers.length !== usersAndPermissions.length) {
        throw new NotFoundException('One or more specified users do not exist');
      }

      const enhancedPermissions = usersAndPermissions
        .map((entry) => {
          const permissionValue = entry.permission as FilePermissions;
          if (!Object.values(FilePermissions).includes(permissionValue)) {
            throw new BadRequestException(
              `Invalid permission: ${entry.permission}`,
            );
          }

          if (
            permissionValue === FilePermissions.WRITE ||
            permissionValue === FilePermissions.DELETE
          ) {
            specificPermissions.push(permissionValue);
            return [
              { ...entry, permission: permissionValue },
              { user: entry.user, permission: FilePermissions.READ },
            ];
          }

          specificPermissions.push(permissionValue);
          return [{ ...entry, permission: permissionValue }];
        })
        .flat();

      const permissions = await Promise.all(
        [...new Set(enhancedPermissions.map((entry) => entry.permission))].map(
          async (permissionName) => {
            const permission = await this.permissionsRepository.findOne({
              where: { name: permissionName },
            });
            if (!permission) {
              throw new BadRequestException(
                `Invalid permission name: ${permissionName}`,
              );
            }
            return permission;
          },
        ),
      );

      const permissionMap = new Map(
        permissions.map((permission) => [permission.name, permission]),
      );

      const existingUserFiles = await this.userFileRepository.find({
        where: {
          user: In(existingUsers.map((user) => user.id)),
          file: file,
        },
      });

      const userFiles = [];

      for (const entry of enhancedPermissions) {
        const user = existingUsers.find((u) => u.email === entry.user);
        const permission = permissionMap.get(entry.permission);

        if (!user || !permission) {
          throw new BadRequestException(
            `Invalid user or permission: User(${entry.user}), Permission(${entry.permission})`,
          );
        }

        const isAlreadyAssigned = existingUserFiles.some(
          (uf) => uf.user.id === user.id && uf.permission.id === permission.id,
        );

        if (!isAlreadyAssigned) {
          userFiles.push(
            this.userFileRepository.create({
              user,
              file,
              permission,
            }),
          );
        }
      }

      if (userFiles.length > 0) {
        await this.userFileRepository.save(userFiles);
      }
    }

    await this.fileRepository.save(file);

    const shareableLink = (
      await this.generateShareableLink(
        ownerId,
        fileId,
        specificPermissions,
        isPublic,
      )
    ).link;

    for (const { user } of usersAndPermissions) {
      try {
        await this.mailService.sendFileLinkMail(user, shareableLink);
      } catch (error) {
        console.error(`Failed to send email to ${user}:`, error.message);
      }
    }

    return {
      message: 'File successfully shared with specified users.',
      shareableLink,
    };
  }

  async updateSharedFile(
    ownerId: number,
    updateShareData: {
      fileId: string;
      isPublic: boolean;
      usersAndPermissions: Array<{ user: string; permission: string }>;
    },
  ): Promise<{ message: string }> {
    const { fileId, isPublic, usersAndPermissions } = updateShareData;

    if (!fileId || typeof fileId !== 'string') {
      throw new BadRequestException('Invalid fileId provided.');
    }

    const file = await this.fileRepository.findOne({
      where: { id: fileId, ownerId },
    });

    if (!file) {
      throw new NotFoundException('File or directory not found.');
    }

    file.isPublic = isPublic;
    if (!isPublic) {
      file.shareableLink = null;
    }
    await this.fileRepository.save(file);

    if (usersAndPermissions.length > 0) {
      const existingUsers = await this.userRepository.findBy({
        email: In(usersAndPermissions.map((entry) => entry.user)),
      });

      if (existingUsers.length !== usersAndPermissions.length) {
        const missingUsers = usersAndPermissions
          .filter(
            (entry) => !existingUsers.some((user) => user.email === entry.user),
          )
          .map((entry) => entry.user);
        throw new NotFoundException(
          `The following users were not found: ${missingUsers.join(', ')}`,
        );
      }

      const existingUserFiles = await this.userFileRepository.find({
        where: { file: { id: file.id } },
        relations: ['user', 'permission'],
      });

      const existingUserMap = new Map(
        existingUserFiles.map((userFile) => [userFile.user.email, userFile]),
      );

      const updatedUserFiles = [];
      const removedUserFiles = [];

      for (const {
        user: userEmail,
        permission: permissionName,
      } of usersAndPermissions) {
        if (
          !Object.values(FilePermissions).includes(
            permissionName as FilePermissions,
          )
        ) {
          throw new BadRequestException(
            `Invalid permission: ${permissionName}`,
          );
        }

        const user = existingUsers.find((u) => u.email === userEmail);
        if (!user) {
          throw new NotFoundException(
            `User with email "${userEmail}" not found.`,
          );
        }

        if (user.id === ownerId) {
          continue;
        }

        const existingUserFile = existingUserMap.get(userEmail);
        if (existingUserFile) {
          if (existingUserFile.permission.name !== permissionName) {
            const newPermission = await this.permissionsRepository.findOne({
              where: { name: permissionName },
            });
            if (!newPermission) {
              throw new NotFoundException(
                `Permission "${permissionName}" not found.`,
              );
            }
            existingUserFile.permission = newPermission;
            updatedUserFiles.push(existingUserFile);
          }
          existingUserMap.delete(userEmail);
        } else {
          const permission = await this.permissionsRepository.findOne({
            where: { name: permissionName },
          });
          if (!permission) {
            throw new NotFoundException(
              `Permission "${permissionName}" not found.`,
            );
          }
          const newUserFile = this.userFileRepository.create({
            user,
            file,
            permission,
          });
          updatedUserFiles.push(newUserFile);
        }
      }

      for (const userFile of existingUserMap.values()) {
        if (userFile.user.id !== ownerId) {
          removedUserFiles.push(userFile);
        }
      }

      if (updatedUserFiles.length > 0) {
        await this.userFileRepository.save(updatedUserFiles);
      }
      if (removedUserFiles.length > 0) {
        await this.userFileRepository.remove(removedUserFiles);
      }
    } else {
      const existingUserFiles = await this.userFileRepository.find({
        where: { file: { id: file.id } },
        relations: ['user', 'file', 'permission'],
      });
      const userFilesToRemove = existingUserFiles.filter((userFile) => {
        return userFile.user.id !== ownerId;
      });

      if (userFilesToRemove.length > 0) {
        await this.userFileRepository.remove(userFilesToRemove);
      }
    }

    if (file.isPublic !== isPublic) {
      await this.updateIsPublicRecursive(file, isPublic);
    }

    const ownerPermissions = await this.userFileRepository.find({
      where: { user: { id: ownerId }, file },
      relations: ['permission'],
    });

    const permissionsToEnsure = Object.values(FilePermissions).filter(
      (perm) =>
        !ownerPermissions.some((userFile) => userFile.permission.name === perm),
    );

    if (permissionsToEnsure.length > 0) {
      const permissions = await this.permissionsRepository.findBy({
        name: In(permissionsToEnsure),
      });

      const ownerUserFiles = permissions.map((permission) =>
        this.userFileRepository.create({
          user: { id: ownerId } as User,
          file,
          permission,
        }),
      );

      await this.userFileRepository.save(ownerUserFiles);
    }

    return {
      message: 'File sharing settings successfully updated.',
    };
  }

  async generateShareableLink(
    ownerId: number,
    id: string,
    permissions: string | string[] = FilePermissions.READ,
    isPublic?: boolean,
  ): Promise<{ link: string }> {
    const file = await this.fileRepository.findOne({ where: { id, ownerId } });

    if (!file) {
      throw new NotFoundException('File or directory not found');
    }

    file.shareableLink = file.shareableLink || uuidv4();
    await this.fileRepository.save(file);

    if (isPublic) {
      await this.updateIsPublicRecursive(file, isPublic);
    }

    let permissionArray: FilePermissions[] = [];

    if (Array.isArray(permissions)) {
      permissionArray = permissions.map((perm) => {
        if (!Object.values(FilePermissions).includes(perm as FilePermissions)) {
          throw new BadRequestException(`Invalid permission: ${perm}`);
        }
        return perm as FilePermissions;
      });
      if (permissionArray.length === 0) {
        permissionArray = [FilePermissions.READ];
      }
    } else {
      if (
        !Object.values(FilePermissions).includes(permissions as FilePermissions)
      ) {
        throw new BadRequestException(`Invalid permission: ${permissions}`);
      }
      permissionArray = [permissions as FilePermissions];
    }

    const resolvedPermission = permissionArray.includes(FilePermissions.WRITE)
      ? FilePermissions.WRITE
      : permissionArray.includes(FilePermissions.DELETE)
        ? FilePermissions.DELETE
        : FilePermissions.READ;
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const link = `${baseUrl}/panel?link=${file.shareableLink}&permissions=${resolvedPermission}`;

    return { link };
  }

  async revokeShareableLink(
    ownerId: number,
    id: string,
  ): Promise<{ message: string }> {
    const file = await this.fileRepository.findOne({ where: { id, ownerId } });

    if (!file) {
      throw new NotFoundException('File or directory not found');
    }

    file.shareableLink = null;
    await this.fileRepository.save(file);

    await this.updateIsPublicRecursive(file, file.isPublic);

    return { message: 'Shareable link revoked successfully.' };
  }

  async getFile(id?: string, link?: string): Promise<FileEntity> {
    const file = await this.fileRepository
      .createQueryBuilder('file')
      .where('file.id = :id', { id })
      .orWhere('file.shareableLink = :link', { link })
      .getOne();

    if (!file) {
      throw new NotFoundException('File or directory not found or not public');
    }

    return file;
  }

  async getFileList(
    id?: number,
    param?: {
      search: string;
      dir_path: string;
      page: string;
      pageSize: string;
    },
    link?: string,
  ): Promise<{ items: FileEntity[]; total: number }> {
    if (link) {
      const file = await this.getFile(undefined, link);

      if (param?.dir_path && !file.dirPath.startsWith(param.dir_path)) {
        return { items: [], total: 0 };
      }

      if (param?.search) {
        const searchTerm = param.search.toLowerCase();
        if (!file.name.toLowerCase().includes(searchTerm)) {
          return { items: [], total: 0 };
        }
      }

      const page = +param.page || 1;
      const pageSize = +param.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const items = (skip === 0 ? [file] : []).slice(0, pageSize);
      const total = 1;

      return { items, total };
    }

    const skip = +param.pageSize * +param.page - +param.pageSize;
    const searchCondition = param.search
      ? {
          name: Raw((alias) => `LOWER(${alias}) LIKE :search`, {
            search: `%${param.search.toLowerCase()}%`,
          }),
        }
      : {};

    const [items, total] = await this.fileRepository.findAndCount({
      where: {
        ownerId: id,
        ...searchCondition,
        dirPath: param.dir_path,
      },
      skip: +skip,
      take: +param.pageSize,
    });

    return { items, total };
  }

  async createDirectory(
    createFileDto: CreateFileDto,
    ownerId: number,
  ): Promise<FileEntity> {
    this.ensureRootDirExists();

    const { name, dirPath, type, isPublic } = createFileDto;

    if (type !== 'directory') {
      throw new BadRequestException(
        'Only directories can be created using this method.',
      );
    }

    const fullPath = path.join(this.rootDir, dirPath, name);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      throw new ConflictException('Directory already exists.');
    }

    const directory = this.fileRepository.create({
      name,
      dirPath: path.join(dirPath),
      type: 'directory',
      ownerId,
      isPublic,
    });

    const savedDirectory = await this.fileRepository.save(directory);

    const permissions = await this.permissionsRepository.find({
      where: { name: In(Object.values(FilePermissions)) },
    });

    const userFiles = permissions.map((permission) =>
      this.fileRepository.manager.getRepository(UserFile).create({
        user: { id: ownerId } as User,
        file: savedDirectory,
        permission,
      }),
    );

    await this.fileRepository.manager.getRepository(UserFile).save(userFiles);

    return savedDirectory;
  }

  async uploadFile(
    file: Express.Multer.File,
    ownerId: number,
    dirPath: string,
    isPublic: string,
  ): Promise<FileEntity> {
    this.ensureRootDirExists();

    const uploadDir = path.join(this.rootDir, dirPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fullPath = path.join(uploadDir, file.originalname);

    fs.writeFileSync(fullPath, file.buffer);

    const fileExtension = path.extname(file.originalname);

    const fileEntity = this.fileRepository.create({
      name: file.originalname,
      dirPath,
      type: 'file',
      ownerId,
      size: file.size,
      fileExtension,
      isPublic: isPublic === 'true',
    });

    const savedFileEntity = await this.fileRepository.save(fileEntity);

    const permissions = await this.permissionsRepository.find({
      where: { name: In(Object.values(FilePermissions)) },
    });

    const userFiles = permissions.map((permission) =>
      this.fileRepository.manager.getRepository(UserFile).create({
        user: { id: ownerId } as User,
        file: savedFileEntity,
        permission,
      }),
    );

    await this.fileRepository.manager.getRepository(UserFile).save(userFiles);

    return savedFileEntity;
  }

  async deleteFile(id: string): Promise<{ message: string }> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('File or directory not found');
    }

    const filePath = path.join(this.rootDir, file.dirPath, file.name);

    if (fs.existsSync(filePath)) {
      if (file.type === 'directory') {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    } else {
      throw new NotFoundException('File or directory not found in file system');
    }

    const fullPathToMatch = path.join(file.dirPath, file.name);

    await this.fileRepository.delete({
      id,
    });

    await this.fileRepository.delete({
      dirPath: Raw((alias) => `${alias} LIKE :path`, {
        path: `${fullPathToMatch}%`,
      }),
    });

    return {
      message: 'File or directory and all related records deleted successfully',
    };
  }

  async updateFile(
    ownerId: number,
    id: string,
    updateData: Partial<{ name: string; dirPath: string; isPublic: boolean }>,
  ): Promise<FileEntity> {
    const file = await this.fileRepository.findOne({ where: { id, ownerId } });

    if (!file) {
      throw new NotFoundException('File or directory not found');
    }

    if (
      !updateData.name &&
      !updateData.dirPath &&
      updateData.isPublic === undefined
    ) {
      throw new BadRequestException('No updates provided');
    }

    const filePath = path.join(this.rootDir, file.dirPath, file.name);
    let newFilePath = filePath;

    if (updateData.name || updateData.dirPath) {
      const newDirPath = updateData.dirPath || file.dirPath;
      const newName = updateData.name || file.name;
      newFilePath = path.join(this.rootDir, newDirPath, newName);

      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, newFilePath);
      } else {
        throw new NotFoundException(
          'File or directory not found in filesystem',
        );
      }

      if (updateData.name) file.name = updateData.name;
      if (updateData.dirPath) file.dirPath = updateData.dirPath;
    }

    if (updateData.isPublic !== undefined) {
      file.isPublic = updateData.isPublic;
      if (!file.isPublic) {
        file.shareableLink = null;
      }
    }

    return this.fileRepository.save(file);
  }

  async getPermissionsList(): Promise<string[]> {
    const permissions = await this.permissionsRepository.find();
    return permissions.map((p) => p.name);
  }
}
