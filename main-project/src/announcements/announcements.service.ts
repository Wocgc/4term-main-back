import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import {
  AnnouncementCreateResponse,
  AnnouncementReadResponse,
} from './interface/announcement.interface';
import { AnnouncementsRepository } from './repository/announcement.repository';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(AnnouncementsRepository)
    private readonly announcementsRepository: AnnouncementsRepository,
  ) {}
  // 공지사항 조회 관련
  async getAllAnnouncements(): Promise<AnnouncementReadResponse[]> {
    try {
      const announcements: AnnouncementReadResponse[] =
        await this.announcementsRepository.getAllAnnouncements();

      if (!announcements) {
        throw new NotFoundException(`전체 공지사항의 조회를 실패 했습니다.`);
      }

      return announcements;
    } catch (error) {
      throw error;
    }
  }

  // 공지사항 생성 관련
  async createAnnouncement(
    createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<number> {
    try {
      const { affectedRows, insertId }: AnnouncementCreateResponse =
        await this.announcementsRepository.createAnnouncement(
          createAnnouncementDto,
        );

      if (!(affectedRows && insertId)) {
        throw new InternalServerErrorException(`공지사항 생성 오류입니다.`);
      }

      return insertId;
    } catch (error) {
      throw error;
    }
  }
}
