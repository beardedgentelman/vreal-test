import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import * as process from 'node:process';

class LogoutDto {
  userId: number;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/redirect')
  @ApiOperation({
    summary: 'Google OAuth redirection handler',
    description:
      'Handles the redirect after successful Google authentication and issues access and refresh tokens.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the front-end with authentication tokens.',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user as User;
    const { accessToken, refreshToken } = await this.authService.login(
      user.id,
      user.email,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.CLIENT_URL}?accessToken=${accessToken}`);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access and refresh tokens',
    description:
      'Validates the provided refresh token (from cookies) and issues a new pair of tokens.',
  })
  @ApiResponse({
    status: 200,
    description:
      'New access token generated, refresh token updated in cookies.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const userId =
      await this.authService.validateRefreshTokenAndGetUserId(refreshToken);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.authService.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.generateTokens(user.id, user.email);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken });
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Log out a user',
    description: 'Clears the refresh token for the specified user.',
  })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out.',
  })
  @ApiResponse({
    status: 401,
    description: 'User not found or unauthorized.',
  })
  async logout(@Body() body: LogoutDto, @Res() res: Response) {
    const { userId } = body;
    const user = await this.authService.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.authService.updateRefreshToken(userId, null);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.json({ message: 'Successfully logged out' });
  }
}
