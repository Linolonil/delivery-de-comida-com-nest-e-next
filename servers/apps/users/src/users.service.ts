import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';
import { PrismaService } from './../../../prisma/prisma.service';

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // register user service

  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number } = registerDto;
    const IsEmailExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (IsEmailExist) {
      throw new BadGatewayException('Email já cadastrado');
    }
    const usersWithPhoneNumber = await this.prisma.user.findMany({
      where: {
        phone_number: {
          in: [phone_number],
        },
      },
    });

    if (usersWithPhoneNumber.length > 0) {
      throw new BadRequestException('User já existe com esse número');
    }
    const isPhoneNumberExist = await this.prisma.user.findUnique({
      where: { phone_number },
    });

    if (isPhoneNumberExist) {
      throw new Error('Número de telefone já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      password: hashedPassword,
      phone_number,
    };

    const activationToken = await this.createActivationToken(user);

    const activationCode = activationToken.activationCode;

    const activation_token = activationToken.token;

    await this.emailService.sendMail({
      email,
      subject: 'Ative sua conta',
      name,
      template: './activation-email',
      activationCode,
    });

    return { activation_token, response };
  }

  // create activation token

  async createActivationToken(user: UserData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = this.jwtService.sign(
      {
        user,
        activationCode,
      },
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
        expiresIn: '5m',
      },
    );
    return { token, activationCode };
  }

  // activation count token
  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activationToken, activationCode } = activationDto;

    const newUser: { user: UserData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { user: UserData; activationCode: string };

    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    const { name, email, password, phone_number } = newUser.user;

    const existUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser) {
      throw new BadRequestException('User already exist with this email!');
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
        phone_number,
      },
    });

    return { user, response };
  }

  // get logged in user
  async getLoggedInUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshToken;
    const accessToken = req.accessToken;
    return { user, refreshToken, accessToken };
  }

  // compare with hashed password
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // login service
  async Login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (user && (await this.comparePassword(password, user.password))) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      return tokenSender.sendToken(user);
    } else {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Senha ou usuário inválidos!',
        },
      };
    }
  }
  async logout(req: any) {
    req.user = null;
    req.refreshtoken = null;
    req.accesstoken = null;
    return { message: 'O usuário foi deslogado' };
  }

  // get all user service
  async getUsers() {
    return this.prisma.user.findMany({});
  }

  getHello() {
    return 'Hello world';
  }
}
