import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeBoardsRepository } from 'src/notices/repository/notices-board.repository';
import { NoticesRepository } from 'src/notices/repository/notices.repository';
import { UsersRepository } from 'src/users/repository/users.repository';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardRepository, TestUserRepo } from './repository/board.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BoardRepository, UsersRepository, NoticesRepository, NoticeBoardsRepository, TestUserRepo])],
  providers: [BoardsService],
  controllers: [BoardsController],
})
export class BoardsModule { }
