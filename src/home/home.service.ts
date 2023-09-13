import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomeResponseDto } from './dtos/home.dto';
import { Property_Type } from '@prisma/client';
import { UserType } from '../user/decorators/user.decorator';

interface GetHomesParam {
  city?: string;
  property_type?: Property_Type;
  price?: {
    gte?: number;
    lte?: number;
  };
}

interface CreateHomeParams {
  address: string;
  city: string;
  price: number;
  property_type: Property_Type;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  land_size: number;
  image: { url: string }[];
}

interface UpdateHomeParams {
  address?: string;
  city?: string;
  price?: number;
  property_type?: Property_Type;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  land_size?: number;
}

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHome(filter: GetHomesParam): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        id: true,
        address: true,
        city: true,
        price: true,
        property_type: true,
        number_of_bathrooms: true,
        number_of_bedrooms: true,
        image: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
      where: {
        ...filter,
      },
    });

    if (!homes.length) {
      throw new NotFoundException();
    }

    return homes.map((home) => {
      // const newHome = { ...home, image: home.image[0].url };
      // delete newHome.image;
      const images = home.image[0]?.url || null;
      return new HomeResponseDto({ ...home, image: images });
    });
  }

  async getHomeById(id: number): Promise<HomeResponseDto> {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        address: true,
        city: true,
        price: true,
        property_type: true,
        number_of_bathrooms: true,
        number_of_bedrooms: true,
        image: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
    });
    if (!home) {
      throw new NotFoundException();
    }

    // map the image field to be a string or null if there are no images
    const image = home.image.length > 0 ? home.image[0].url : null;

    // create new HomeResponseDto object with the mapped data
    const newHome = new HomeResponseDto({ ...home, image });

    return newHome;
  }

  async createHome(
    {
      address,
      city,
      price,
      property_type,
      numberOfBedrooms,
      numberOfBathrooms,
      land_size,
      image,
    }: CreateHomeParams,
    userId: number,
  ) {
    const home = await this.prismaService.home.create({
      data: {
        address,
        city,
        price,
        property_type,
        number_of_bedrooms: numberOfBedrooms,
        number_of_bathrooms: numberOfBathrooms,
        land_size,
        realtorId: userId,
      },
    });

    const homeImages = image.map((imageData) => {
      return {
        ...imageData,
        homeId: home.id,
      };
    });

    await this.prismaService.image.createMany({
      data: homeImages,
    });
    return new HomeResponseDto(home);
  }

  async updateHomeById(
    id: number,
    {
      address,
      numberOfBathrooms,
      numberOfBedrooms,
      city,
      land_size,
      price,
      property_type,
    }: UpdateHomeParams,
  ) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
    });

    if (!home) {
      throw new NotFoundException();
    }

    const updatedHome = await this.prismaService.home.update({
      where: {
        id,
      },
      data: {
        address,
        number_of_bathrooms: numberOfBathrooms,
        number_of_bedrooms: numberOfBedrooms,
        city,
        land_size,
        price,
        property_type,
      },
    });
    return new HomeResponseDto(updatedHome);
  }

  async deleteHome(id: number) {
    // await this.prismaService.image.deleteMany({
    //   where: {
    //     homeId: id,
    //   },
    // });
    await this.prismaService.home.delete({
      where: {
        id,
      },
    });
  }

  async getRealtorHomes(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
      select: {
        realtor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
    if (!home) {
      throw new NotFoundException();
    }
    return home.realtor;
  }

  async inquire(buyer: UserType, homeId: number, message: string) {
    const realtor = await this.getRealtorHomes(homeId);

    return this.prismaService.message.create({
      data: {
        realtorId: realtor.id,
        buyerId: buyer.id,
        homeId: homeId,
        message: message,
      },
    });
  }

  async getMessagesByHome(homeId: number) {
    return this.prismaService.message.findMany({
      where: {
        homeId,
      },
      select: {
        message: true,
        buyer: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }
}
