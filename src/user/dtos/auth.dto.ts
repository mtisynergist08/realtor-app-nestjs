
import {IsString, IsNotEmpty, IsEmail, MinLength, Matches, IsEnum} from '@nestjs/class-validator';
import {UserType} from "@prisma/client";
import {IsOptional} from "class-validator";

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    name: string;


    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @Matches(/^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/, {message: 'Phone number is not valid'})
    phone: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    productKey?: string;
}

export class SigninDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class GenerateProductKeyDto {
    @IsEmail()
    email: string;

    @IsEnum(UserType)
    userType: UserType;
}