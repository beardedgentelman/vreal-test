import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Fetches the details of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details successfully fetched.',
    type: User,
  })
  public async getMe(@Req() req: Request): Promise<User> {
    const user = req.user as User;
    return this.usersService.findById(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Get all users except current user',
    description:
      'Fetches a list of all users except the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of all users except the current user successfully fetched.',
    type: [User],
  })
  public async getAll(@Req() req: Request): Promise<User[]> {
    const user = req.user as User;
    return await this.usersService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Fetches a user by their ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the user to fetch',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully fetched.',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  public async getById(@Param('id') id: number): Promise<User> {
    return await this.usersService.findById(id);
  }
}
