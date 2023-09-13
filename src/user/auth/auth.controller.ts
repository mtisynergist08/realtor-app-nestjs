import {
  Controller,
  Post,
  Body,
  Param,
  ParseEnumPipe,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateProductKeyDto, SigninDto, SignupDto } from '../dtos/auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { User } from '../decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('/signup/:userType')
  async signup(
    @Body() body: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!body.productKey) throw new UnauthorizedException();
    }

    console.log('body.productKey:', body.productKey);

    if (userType === UserType.BUYER) {
      return this.authService.signup(body, userType);
    } else {
      const validateProductKey = `${body.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
      console.log('validateProductKey:', validateProductKey);

      const isValidProductKey = await bcrypt.compare(
        validateProductKey,
        body.productKey,
      );
      console.log('isValidProductKey:', isValidProductKey);

      if (!isValidProductKey) {
        throw new UnauthorizedException();
      }

      return this.authService.signup(body, userType);
    }
  }

  @Post('/signin')
  signin(@Body() body: SigninDto) {
    return this.authService.signin(body);
  }

  @Post('/key')
  generateProductKey(@Body() body: GenerateProductKeyDto) {
    return this.authService.generateProductKey(body.email, body.userType);
  }

  @Get('/me')
  getMe(@User() user: UserType) {
    return user;
  }
}
