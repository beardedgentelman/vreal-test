import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserFile } from './user-file.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  fileExtension: string | null;

  @Column()
  dirPath: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  size: number | null;

  @Column({ type: 'enum', enum: ['unknown', 'directory', 'file'] })
  type: 'unknown' | 'directory' | 'file';

  @OneToMany(() => UserFile, (userFile) => userFile.file, { cascade: true })
  userFiles: UserFile[];

  @Column()
  ownerId: number;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true, unique: true })
  shareableLink: string | null;
}
