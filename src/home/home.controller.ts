import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { HomeService } from './home.service';
import {
  CreateHomeDto,
  HomeResponseDto,
  InquireDto,
  UpdateHomeDto,
} from './dtos/home.dto';
import { Property_Type, UserType as UserInfoType } from '@prisma/client';
import { User, UserType } from '../user/decorators/user.decorator';
import { AuthGuards } from 'src/guards/auth.guards';
import { Roles } from '../decorator/roles.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  getHome(
    @Query('city') city?: string,
    @Query('property_type') property_type?: Property_Type,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<HomeResponseDto[]> {
    const price =
      minPrice || maxPrice
        ? {
            ...(minPrice && { gte: parseInt(minPrice) }),
            ...(maxPrice && { lte: parseInt(maxPrice) }),
          }
        : undefined;

    const filter = {
      ...(city && { city }),
      // price: {
      //   gte: minPrice,
      //   lte: maxPrice,
      // },
      ...(price && { price }),
      ...(property_type && { property_type }),
    };
    console.log(city, property_type, minPrice, maxPrice);
    return this.homeService.getHome(filter);
  }

  @Get(':id')
  getHomeById(@Param('id', ParseIntPipe) id: number) {
    return this.homeService.getHomeById(id);
  }

  @Roles(UserInfoType.REALTOR)
  @Post()
  createHome(@Body() body: CreateHomeDto, @User() user: UserType) {
    return this.homeService.createHome(body, user.id);
  }

  @Roles(UserInfoType.REALTOR)
  @Put(':id')
  async updateHome(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHomeDto,
    @User() user: UserType,
  ) {

    const realtor = await this.homeService.getRealtorHomes(id);

    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }

    return this.homeService.updateHomeById(id, body);
  }

  @Roles(UserInfoType.REALTOR)
  @Delete(':id')
  async deleteHome(@Param('id') id: number, @User() user: UserType) {
    const realtor = await this.homeService.getRealtorHomes(id);
    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }
    return this.homeService.deleteHome(id);
  }

  @Roles(UserInfoType.BUYER)
  @Post('/:id/inquire')
  async inquire(
    @User() user: UserType,
    @Param('id', ParseIntPipe) homeId: number,
    @Body() { message }: InquireDto,
  ) {
    return this.homeService.inquire(user, homeId, message);
  }

  @Roles(UserInfoType.REALTOR)
  @Get('/:id/messages')
  async getMessage(
    @User() user: UserType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const realtor = await this.homeService.getRealtorHomes(id);
    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }
    return this.homeService.getMessagesByHome(id);
  }
}
