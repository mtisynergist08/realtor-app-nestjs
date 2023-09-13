import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from '../prisma/prisma.service';
import { Property_Type } from '@prisma/client';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

const mockUser = {
  id: 53,
  name: 'Laith',
  email: 'laith@gmail.com',
  phone: '6018 777 0503',
};

const mockHomes = {
  id: 1,
  address: 'Sungai Petani',
  city: 'Sungai Petani',
  price: 214000,
  property_type: Property_Type.RESIDENTIAL,
  image: 'img1',
  numberOfBedrooms: 3,
  numberOfBathrooms: 2,
};

describe('HomeController', () => {
  let controller: HomeController;
  let homeService: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHome: jest.fn().mockReturnValue([]),
            getRealtorHomes: jest.fn().mockReturnValue(mockUser),
            updateHomeById: jest.fn().mockReturnValue(mockHomes),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    homeService = module.get<HomeService>(HomeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('getHome', () => {
    it('should construct filter object correctly', async () => {
      const mockGetHomes = jest.fn().mockReturnValue([]);
      jest.spyOn(homeService, 'getHome').mockImplementation(mockGetHomes);
      await controller.getHome(
        'Sungai Petani',
        'RESIDENTIAL',
        '150000',
        '200000',
      );
      expect(mockGetHomes).toBeCalledWith({
        city: 'Sungai Petani',
        price: {
          gte: 150000,
          lte: 200000,
        },
        property_type: 'RESIDENTIAL',
      });
    });
  });

  describe('updateHome', () => {
    const mockUserInfo = {
      name: 'Laith',
      id: 30,
      iat: 1,
      exp: 2,
    };
    const mockCreateHomeParams = {
      address: '1027, Jalan prima 33',
      city: 'Sungai Petani',
      price: 214000,
      property_type: Property_Type.RESIDENTIAL,
      numberOfBedrooms: 4,
      numberOfBathrooms: 3,
      land_size: 1500,
    };
    it('should thrown unauthorized error if realtor did not create home', async () => {
      // console.info(homeService);
      // console.info(homeService.getRealtorHomes);
      // const realtor = await homeService.getRealtorHomes(5);
      // console.info(realtor);
      await expect(
        controller.updateHome(5, mockCreateHomeParams, mockUserInfo),
      ).rejects.toThrowError(UnauthorizedException);
    });

    it('should update home if realtor id is valid', async () => {
      const mockUpdateHome = jest.fn().mockReturnValue(mockHomes);

      jest
        .spyOn(homeService, 'updateHomeById')
        .mockImplementation(mockUpdateHome);

      await controller.updateHome(5, mockCreateHomeParams, {
        ...mockUserInfo,
        id: 53,
      });
      expect(mockUpdateHome).toBeCalled();
    });
  });
});
