import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  OnModuleInit,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { CART_SERVICE } from '@grpc/grpc-clients.module';
import { CurrentUser, CurrentUserData } from '@common/decorators/current-user.decorator';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto, CartSummaryDto } from './dto/cart.dto';

interface CartServiceClient {
  GetCart(data: any): any;
  AddItem(data: any): any;
  UpdateItemQuantity(data: any): any;
  RemoveItem(data: any): any;
  ClearCart(data: any): any;
  GetCartSummary(data: any): any;
}

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController implements OnModuleInit {
  private cartService: CartServiceClient;

  constructor(@Inject(CART_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.cartService = this.client.getService<CartServiceClient>('CartService');
  }

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async getCart(@CurrentUser() user: CurrentUserData): Promise<CartResponseDto> {
    const response = await firstValueFrom(this.cartService.GetCart({ user_id: user.userId }));

    return this.mapCartResponse(response);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get cart summary (item count and total)' })
  @ApiResponse({ status: 200, type: CartSummaryDto })
  async getCartSummary(@CurrentUser() user: CurrentUserData): Promise<CartSummaryDto> {
    const response = (await firstValueFrom(
      this.cartService.GetCartSummary({ user_id: user.userId })
    )) as any;

    return {
      userId: response.user_id,
      itemCount: response.item_count,
      total: response.total,
    };
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, type: CartResponseDto })
  async addItem(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AddToCartDto
  ): Promise<CartResponseDto> {
    const response = await firstValueFrom(
      this.cartService.AddItem({
        user_id: user.userId,
        product_id: dto.productId,
        product_name: dto.productName,
        price: dto.price,
        quantity: dto.quantity,
        image_url: dto.imageUrl || '',
      })
    );

    return this.mapCartResponse(response);
  }

  @Put('items/:productId')
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async updateItemQuantity(
    @CurrentUser() user: CurrentUserData,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto
  ): Promise<CartResponseDto> {
    const response = await firstValueFrom(
      this.cartService.UpdateItemQuantity({
        user_id: user.userId,
        product_id: productId,
        quantity: dto.quantity,
      })
    );

    return this.mapCartResponse(response);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async removeItem(
    @CurrentUser() user: CurrentUserData,
    @Param('productId') productId: string
  ): Promise<CartResponseDto> {
    const response = await firstValueFrom(
      this.cartService.RemoveItem({
        user_id: user.userId,
        product_id: productId,
      })
    );

    return this.mapCartResponse(response);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(
    @CurrentUser() user: CurrentUserData
  ): Promise<{ success: boolean; message: string }> {
    const response = (await firstValueFrom(
      this.cartService.ClearCart({ user_id: user.userId })
    )) as any;

    return { success: response.success, message: response.message };
  }

  private mapCartResponse(data: any): CartResponseDto {
    return {
      userId: data.user_id,
      items: (data.items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.image_url || undefined,
        subtotal: item.subtotal,
      })),
      total: data.total,
      itemCount: data.item_count,
      updatedAt: data.updated_at,
    };
  }
}
