import { Test, TestingModule } from '@nestjs/testing';
import { HomeService } from './home.service';
import { PrismaService } from '../prisma/prisma.service';
import { Property_Type } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockGetHomes = [
  {
    id: 1,
    address: 'Sungai Petani',
    city: 'Sungai Petani',
    price: 214000,
    property_type: Property_Type.RESIDENTIAL,
    image: 'img1',
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    images: [
      {
        url: 'src1',
      },
    ],
  },
];

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

const mockImages = [
  {
    id: 1,
    url: 'src1',
  },
  {
    id: 2,
    url: 'src2',
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockReturnValue(mockHomes),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  // it('should be defined', () => {
  //   expect(service).toBeDefined();
  // });

  describe('getHome', () => {
    const filter = {
      city: 'Sungai Petani',
      property_type: Property_Type.RESIDENTIAL,
      price: {
        gte: 1000000,
        lte: 3000000,
      },
    };

    it('should call prisma home findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHome(filter);

      expect(mockPrismaFindManyHomes).toBeCalledWith({
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
    });

    it('should throw not found exception if no home are found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(service.getHome(filter)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('createHome', () => {
    const mockCreateHomeParams = {
      address: '1027, Jalan prima 33',
      city: 'Sungai Petani',
      price: 214000,
      property_type: Property_Type.RESIDENTIAL,
      numberOfBedrooms: 4,
      numberOfBathrooms: 3,
      land_size: 1500,
      image: [
        {
          url: 'src1',
        },
      ],
    };
    it('should call prisma home.create with correct payload', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHomes);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: '1027, Jalan prima 33',
          city: 'Sungai Petani',
          price: 214000,
          property_type: Property_Type.RESIDENTIAL,
          number_of_bedrooms: 4,
          number_of_bathrooms: 3,
          land_size: 1500,
          realtorId: 5,
        },
      });
    });
    it('should call prisma image.createMany with correct payload', async () => {
      const mockCreateManyImages = jest.fn().mockReturnValue(mockImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateManyImages);

      await service.createHome(mockCreateHomeParams, 5);
      expect(mockCreateManyImages).toBeCalledWith({
        data: [
          {
            homeId: 1,
            url: 'src1',
          },
        ],
      });
    });
  });
});
