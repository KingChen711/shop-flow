import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
  exists(email: string): Promise<boolean>;
}

export const USER_REPOSITORY = 'UserRepository';
