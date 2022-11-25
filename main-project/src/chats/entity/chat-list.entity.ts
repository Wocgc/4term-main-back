import { type } from 'os';
import { Boards } from 'src/boards/entity/board.entity';
import { Meetings } from 'src/meetings/entity/meeting.entity';
import { NoticeChats } from 'src/notices/entity/notice-chat.entity';
import { Users } from 'src/users/entity/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { ChatLog } from './chat-log.entity';
import { ChatUsers } from './chat-users.entity';

@Entity('chat_list')
export class ChatList extends BaseEntity {
  @PrimaryGeneratedColumn()
  no: number;

  @Column({ name: 'room_name', type: 'varchar', length: 255, nullable: false })
  roomName: string;

  @ManyToOne((type) => Boards, (boards) => boards.chatBoard, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_no' })
  boardChat: number;

  @OneToMany((type) => ChatUsers, (chatUsers) => chatUsers.chatRoomNo)
  chatUserNo: ChatUsers[];

  @OneToMany((type) => ChatLog, (chatLog) => chatLog.chatRoomNo)
  chatLogNo: ChatLog[];

  @OneToMany((type) => NoticeChats, (noticeChats) => noticeChats.chatRoomNo)
  noticeChat: NoticeChats[];
}
