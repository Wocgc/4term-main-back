import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, InsertResult, Repository } from 'typeorm';
import { Notices } from '../entity/notices.entity';
import { NoticeDetail, NoticeResponse } from '../interface/notice.interface';

@EntityRepository(Notices)
export class NoticesRepository extends Repository<Notices> {
  async saveNotice(noticeInfo: NoticeDetail): Promise<NoticeResponse> {
    try {
      const { raw }: InsertResult = await this.createQueryBuilder('notices')
        .insert()
        .into(Notices)
        .values(noticeInfo)
        .execute();

      return raw;
    } catch (error) {
      throw new InternalServerErrorException(
        `${error} 알람 생성 에러(saveNotice): 알 수 없는 서버 오류입니다.`,
      );
    }
  }

  async getNoticeById(noticeNo: number): Promise<Notices> {
    try {
      const notice: Notices = await this.createQueryBuilder('notices')
        .leftJoin('notices.userNo', 'users', 'users.no = notices.userNo')
        .select([
          'notices.no AS noticeNo',
          'users.no AS userNo',
          'notices.targetUserNo AS targetUserNo',
          'notices.createdDate AS createdDate',
          'notices.type AS type',
          'notices.value AS value',
        ])
        .where('notices.no = :noticeNo', { noticeNo })
        .getRawOne();

      return notice;
    } catch (error) {
      throw new InternalServerErrorException(
        `${error} 알람 조회 에러(getNoticeById): 알 수 없는 서버 오류입니다.`,
      );
    }
  }
}
