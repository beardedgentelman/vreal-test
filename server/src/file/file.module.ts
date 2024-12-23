import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { Permission } from './entities/permissions.entity';
import { UserFile } from './entities/user-file.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, Permission, UserFile, User])],
  providers: [FileService, MailService],
  controllers: [FileController],
})
export class FileModule {}
