import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { generateId } from '@shopflow/shared-utils';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get('MINIO_PORT', 9000),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin123'),
    });

    this.bucket = this.configService.get('MINIO_BUCKET', 'shopflow-products');
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  /**
   * Ensure the bucket exists, create if not
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created bucket: ${this.bucket}`);

        // Set bucket policy to allow public read access for product images
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      }
      this.logger.log(`MinIO bucket ready: ${this.bucket}`);
    } catch (error) {
      this.logger.error('Failed to initialize MinIO bucket', error);
    }
  }

  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'images'
  ): Promise<UploadResult> {
    const extension = originalName.split('.').pop() || 'jpg';
    const key = `${folder}/${generateId()}.${extension}`;

    await this.client.putObject(this.bucket, key, file, file.length, {
      'Content-Type': mimeType,
    });

    const url = this.getPublicUrl(key);

    this.logger.debug(`Uploaded file: ${key}`);

    return {
      url,
      key,
      bucket: this.bucket,
    };
  }

  /**
   * Upload a file from base64 string
   */
  async uploadBase64(
    base64Data: string,
    fileName: string,
    mimeType: string,
    folder: string = 'images'
  ): Promise<UploadResult> {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    return this.uploadFile(buffer, fileName, mimeType, folder);
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
      this.logger.debug(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    const endpoint = this.configService.get('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get('MINIO_PORT', 9000);
    const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${this.bucket}/${key}`;
  }

  /**
   * Generate a presigned URL for upload (direct client upload)
   */
  async getPresignedUploadUrl(
    fileName: string,
    folder: string = 'images',
    expirySeconds: number = 3600
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const extension = fileName.split('.').pop() || 'jpg';
    const key = `${folder}/${generateId()}.${extension}`;

    const uploadUrl = await this.client.presignedPutObject(this.bucket, key, expirySeconds);

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
    };
  }

  /**
   * Generate a presigned URL for download
   */
  async getPresignedDownloadUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, key);
      return true;
    } catch {
      return false;
    }
  }
}
