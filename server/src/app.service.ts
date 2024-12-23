import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    const storagePath = join(__dirname, '..', 'storage');

    if (!existsSync(storagePath)) {
      mkdirSync(storagePath);
      console.log('Storage directory created:', storagePath);
    } else {
      console.log('Storage directory already exists:', storagePath);
    }
  }
}
