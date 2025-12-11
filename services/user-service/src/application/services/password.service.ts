import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async needsRehash(hash: string): Promise<boolean> {
    // Check if the hash was created with fewer rounds
    const rounds = bcrypt.getRounds(hash);
    return rounds < this.saltRounds;
  }
}
