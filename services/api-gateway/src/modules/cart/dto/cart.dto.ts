import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CartItemDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  subtotal: number;
}

export class CartResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [CartItemDto] })
  items: CartItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  updatedAt: string;
}

export class CartSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  total: number;
}
