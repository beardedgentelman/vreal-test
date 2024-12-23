import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    public usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found!');
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    return { id: user.id };
  }

  async login(userId: number, userEmail: string) {
    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      userEmail,
    );
    await this.usersService.updateRefreshToken(userId, refreshToken);
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(id: number, email: string) {
    const payload = { email: email, sub: id };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: number, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  async validateRefreshTokenAndGetUserId(
    refreshToken: string,
  ): Promise<number | null> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'REFRESH_SECRET',
      });
      return payload.sub;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.usersService.findByEmail(googleUser.email);
    if (user) return user;
    return await this.usersService.create(googleUser);
  }
}
