import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsInt, Min, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemInputDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({ example: '123 Main St, City, State 12345' })
  @IsString()
  shippingAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelOrderDto {
  @ApiProperty({ example: 'Changed my mind' })
  @IsString()
  reason: string;
}

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class OrderItemDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'],
  })
  status: string;

  @ApiProperty()
  shippingAddress: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ListOrdersResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class OrderStatusResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  statusMessage: string;

  @ApiProperty()
  updatedAt: string;
}
