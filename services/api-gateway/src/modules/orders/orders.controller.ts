import { Controller, Get, Post, Body, Param, Query, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { ORDER_SERVICE } from '@grpc/grpc-clients.module';
import { CurrentUser, CurrentUserData } from '@common/decorators/current-user.decorator';
import {
  CreateOrderDto,
  CancelOrderDto,
  ListOrdersQueryDto,
  OrderResponseDto,
  ListOrdersResponseDto,
  OrderStatusResponseDto,
} from './dto/orders.dto';

interface OrderServiceClient {
  CreateOrder(data: any): any;
  GetOrder(data: any): any;
  ListOrders(data: any): any;
  CancelOrder(data: any): any;
  GetOrderStatus(data: any): any;
}

// Map gRPC enum to readable string
const statusMap: Record<string, string> = {
  ORDER_STATUS_UNSPECIFIED: 'UNSPECIFIED',
  ORDER_STATUS_PENDING: 'PENDING',
  ORDER_STATUS_CONFIRMED: 'CONFIRMED',
  ORDER_STATUS_PROCESSING: 'PROCESSING',
  ORDER_STATUS_SHIPPED: 'SHIPPED',
  ORDER_STATUS_DELIVERED: 'DELIVERED',
  ORDER_STATUS_CANCELLED: 'CANCELLED',
  ORDER_STATUS_FAILED: 'FAILED',
};

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController implements OnModuleInit {
  private orderService: OrderServiceClient;

  constructor(@Inject(ORDER_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderServiceClient>('OrderService');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createOrder(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateOrderDto
  ): Promise<OrderResponseDto> {
    const response = await firstValueFrom(
      this.orderService.CreateOrder({
        user_id: user.userId,
        items: dto.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        shipping_address: dto.shippingAddress,
        notes: dto.notes,
      })
    );

    return this.mapOrderResponse(response);
  }

  @Get()
  @ApiOperation({ summary: 'List orders for current user' })
  @ApiResponse({ status: 200, type: ListOrdersResponseDto })
  async listOrders(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ListOrdersQueryDto
  ): Promise<ListOrdersResponseDto> {
    const statusEnum = query.status ? `ORDER_STATUS_${query.status}` : undefined;

    const response = (await firstValueFrom(
      this.orderService.ListOrders({
        user_id: user.userId,
        page: query.page,
        limit: query.limit,
        status: statusEnum,
      })
    )) as any;

    return {
      orders: (response.orders || []).map(this.mapOrderResponse),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.total_pages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    const response = await firstValueFrom(this.orderService.GetOrder({ order_id: id }));

    return this.mapOrderResponse(response);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get order status' })
  @ApiResponse({ status: 200, type: OrderStatusResponseDto })
  async getOrderStatus(@Param('id') id: string): Promise<OrderStatusResponseDto> {
    const response = (await firstValueFrom(
      this.orderService.GetOrderStatus({ order_id: id })
    )) as any;

    return {
      orderId: response.order_id,
      status: statusMap[response.status] || response.status,
      statusMessage: response.status_message,
      updatedAt: response.updated_at,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto
  ): Promise<OrderResponseDto> {
    const response = await firstValueFrom(
      this.orderService.CancelOrder({
        order_id: id,
        reason: dto.reason,
      })
    );

    return this.mapOrderResponse(response);
  }

  private mapOrderResponse(data: any): OrderResponseDto {
    return {
      id: data.id,
      userId: data.user_id,
      items: (data.items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: data.total_amount,
      status: statusMap[data.status] || data.status,
      shippingAddress: data.shipping_address,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
