import { Meetings } from 'src/meetings/entity/meeting.entity';
import { BoardBookmarks } from './board-bookmark.entity';
import { BoardMemberInfos } from './board-member-info.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from 'src/users/entity/user.entity';
import { Reportedboards } from 'src/reports/entity/reported-board.entity';

@Entity('boards')
export class Boards extends BaseEntity {
  @PrimaryGeneratedColumn()
  no: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: false,
    nullable: true,
  })
  isDone: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'datetime', name: 'meeting_time', nullable: true })
  meetingTime: Date;

  @CreateDateColumn({ name: 'created_date' })
  createdDate: Date;

  @UpdateDateColumn({ default: null, name: 'updated_date' })
  updatedDate: Date;

  @DeleteDateColumn({ name: 'deleted_date' })
  deletedDate: Date;

  @OneToOne(
    (type) => BoardMemberInfos,
    (boardMemberInfo) => boardMemberInfo.boardNo,
  )
  boardMemberInfo: BoardMemberInfos;

  @OneToOne((type) => BoardBookmarks, (boardBookmark) => boardBookmark.boardNo)
  boardBookmark: BoardBookmarks;

  @OneToOne((type) => Meetings, (meeting) => meeting.board, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meeting_no' })
  meetingNo: number;

  @ManyToOne((type) => Users, (user) => user.board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_no' })
  userNo: number;

  @OneToMany(
    (type) => Reportedboards,
    (reportedboards) => reportedboards.targetBoardNo,
  )
  reportedBoard: Reportedboards[];
}
