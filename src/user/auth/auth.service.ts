import { Injectable, ConflictException, HttpException } from '@nestjs/common';
import {PrismaService} from "../../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { UserType } from '@prisma/client';
import * as jwt from "jsonwebtoken";
import * as process from "process";

interface SignupParams {
    name: string;
    email: string;
    password: string;
    phone: string;
}

interface SigninParams {
    email: string;
    password: string;
}

@Injectable()
export class AuthService {
    constructor(private readonly prismaService: PrismaService) {
    }
    async signup({email, password, phone, name}: SignupParams, userType: UserType) {
        const userExisted = await this.prismaService.user.findFirst({
            where: {
                email: email,
            },
        })
        if (userExisted) {
            console.log('user existed', {userExisted});
            throw new ConflictException('user existed');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prismaService.user.create({
            data: {
                email: email,
                password: hashedPassword,
                name: name,
                phone: phone,
                userType: userType,
            },
        });

        return this.generateJWT(user.name, user.id);
    }

    async signin({email, password}: SigninParams) {
        const user = await this.prismaService.user.findFirst({
            where: {
                email: email,
            },
        });
        if (!user) {
            throw new HttpException('user not existed', 404);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new HttpException('wrong password', 401);
        }
        return this.generateJWT(user.name, user.id);
    }

    private generateJWT(name:string, id:number){
        return jwt.sign({
            name,
            id,
        }, process.env.JWT_ACCESS_SECRET,{
            expiresIn: '1hr',
        })
    }


    generateProductKey(email:string, userType:UserType){
        const stringKey = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

        console.log('stringKey:', stringKey);

        return bcrypt.hashSync(stringKey, 10);
    }
}
