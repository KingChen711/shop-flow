import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { GetUserQuery } from '../get-user.query';
import { User } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository.interface';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw new NotFoundError('User', query.userId);
    }

    return user;
  }
}
