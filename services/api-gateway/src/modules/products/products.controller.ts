import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { PRODUCT_SERVICE } from '@grpc/grpc-clients.module';
import { Public } from '@common/decorators/public.decorator';
import {
  CreateProductDto,
  UpdateProductDto,
  ListProductsQueryDto,
  ProductResponseDto,
  ListProductsResponseDto,
  CreateCategoryDto,
  CategoryResponseDto,
  ListCategoriesResponseDto,
} from './dto/products.dto';

interface ProductServiceClient {
  CreateProduct(data: any): any;
  GetProduct(data: any): any;
  UpdateProduct(data: any): any;
  DeleteProduct(data: any): any;
  ListProducts(data: any): any;
  CreateCategory(data: any): any;
  GetCategory(data: any): any;
  ListCategories(data: any): any;
}

@ApiTags('Products')
@Controller('products')
export class ProductsController implements OnModuleInit {
  private productService: ProductServiceClient;

  constructor(@Inject(PRODUCT_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.productService = this.client.getService<ProductServiceClient>('ProductService');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with pagination and filters' })
  @ApiResponse({ status: 200, type: ListProductsResponseDto })
  async listProducts(@Query() query: ListProductsQueryDto): Promise<ListProductsResponseDto> {
    const response = (await firstValueFrom(
      this.productService.ListProducts({
        page: query.page,
        limit: query.limit,
        category_id: query.categoryId,
        search: query.search,
        min_price: query.minPrice,
        max_price: query.maxPrice,
        sort_by: query.sortBy,
        sort_order: query.sortOrder,
      })
    )) as any;

    return {
      products: (response.products || []).map(this.mapProductResponse),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.total_pages,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    const response = await firstValueFrom(this.productService.GetProduct({ product_id: id }));

    return this.mapProductResponse(response);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createProduct(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const response = await firstValueFrom(
      this.productService.CreateProduct({
        name: dto.name,
        description: dto.description,
        price: dto.price,
        category_id: dto.categoryId,
        image_urls: dto.imageUrls || [],
        attributes: dto.attributes || [],
      })
    );

    return this.mapProductResponse(response);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    const response = await firstValueFrom(
      this.productService.UpdateProduct({
        product_id: id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        category_id: dto.categoryId,
        image_urls: dto.imageUrls,
        attributes: dto.attributes,
      })
    );

    return this.mapProductResponse(response);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const response = (await firstValueFrom(
      this.productService.DeleteProduct({ product_id: id })
    )) as any;

    return { success: response.success, message: response.message };
  }

  private mapProductResponse(data: any): ProductResponseDto {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.category_id,
      categoryName: data.category_name || '',
      imageUrls: data.image_urls || [],
      attributes: (data.attributes || []).map((a: any) => ({ key: a.key, value: a.value })),
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController implements OnModuleInit {
  private productService: ProductServiceClient;

  constructor(@Inject(PRODUCT_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.productService = this.client.getService<ProductServiceClient>('ProductService');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, type: ListCategoriesResponseDto })
  async listCategories(@Query('parentId') parentId?: string): Promise<ListCategoriesResponseDto> {
    const response = (await firstValueFrom(
      this.productService.ListCategories({ parent_id: parentId })
    )) as any;

    return {
      categories: (response.categories || []).map(this.mapCategoryResponse),
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('id') id: string): Promise<CategoryResponseDto> {
    const response = await firstValueFrom(this.productService.GetCategory({ category_id: id }));

    return this.mapCategoryResponse(response);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  async createCategory(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const response = await firstValueFrom(
      this.productService.CreateCategory({
        name: dto.name,
        description: dto.description,
        parent_id: dto.parentId,
      })
    );

    return this.mapCategoryResponse(response);
  }

  private mapCategoryResponse(data: any): CategoryResponseDto {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      parentId: data.parent_id || undefined,
      createdAt: data.created_at,
    };
  }
}
