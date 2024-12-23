import { DataSource } from 'typeorm';
import { Permission } from './file/entities/permissions.entity';
import * as dotenv from 'dotenv';
import { FilePermissions } from './types';

dotenv.config();

const seedPermissions = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [Permission],
    synchronize: true,
  });

  await dataSource.initialize();

  const permissionRepository = dataSource.getRepository(Permission);

  const permissions = [
    FilePermissions.READ,
    FilePermissions.WRITE,
    FilePermissions.DELETE,
  ];

  for (const name of permissions) {
    const permission = await permissionRepository.findOneBy({ name });
    if (!permission) {
      const newPermission = permissionRepository.create({ name });
      await permissionRepository.save(newPermission);
      console.log(`Permission '${name}' added to the database.`);
    } else {
      console.log(`Permission '${name}' already exists in the database.`);
    }
  }

  await dataSource.destroy();
};

seedPermissions()
  .then(() => console.log('Seeding completed!'))
  .catch((error) => console.error('Seeding failed:', error));
