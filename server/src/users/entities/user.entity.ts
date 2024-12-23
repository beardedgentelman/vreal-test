import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserFile } from '../../file/entities/user-file.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ nullable: true })
  refreshToken: string;

  @OneToMany(() => UserFile, (userFile) => userFile.user, { cascade: true })
  userFiles: UserFile[];
}
