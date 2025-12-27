import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.userRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepo.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search',
        { search: `%${search}%` }
      );
    }

    const [entities, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      users: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async save(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const savedEntity = await this.userRepo.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const updatedEntity = await this.userRepo.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.userRepo.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  // Mapping methods
  private toDomain(entity: UserEntity): User {
    return User.reconstitute({
      id: entity.id,
      email: Email.create(entity.email),
      passwordHash: entity.passwordHash,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      roles: entity.roles,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.emailValue;
    entity.passwordHash = user.passwordHash;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.phone = user.phone ?? '';
    entity.roles = user.roles;
    entity.isActive = user.isActive;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }
}
