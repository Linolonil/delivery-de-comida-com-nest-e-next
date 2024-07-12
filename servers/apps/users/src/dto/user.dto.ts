import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterDto {
  @Field()
  @IsNotEmpty({ message: 'O nome é necessário.' })
  @IsString({ message: 'O nome precisa ser do tipo String' })
  name: string;

  @Field()
  @IsNotEmpty({ message: 'A senha é necessária' })
  @MinLength(8, { message: 'A senha precisa ter no minimo 8 caracteres' })
  password: string;

  @Field()
  @IsNotEmpty({ message: 'O email é necessário.' })
  @IsEmail({}, { message: 'O email precisa ser válido' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'O telefone é necessário.' })
  phone_number: number;
}

@InputType()
export class ActivationDto {
  @Field()
  @IsNotEmpty({ message: 'Activation Token is required' })
  activationToken: string;

  @Field()
  @IsNotEmpty({ message: 'Activation code is required' })
  activationCode: string;
}

@InputType()
export class LoginDto {
  @Field()
  @IsNotEmpty({ message: 'Email é necessário' })
  @IsEmail({}, { message: 'Email precisa ser válido' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'Senha é válido' })
  password: string;
}
