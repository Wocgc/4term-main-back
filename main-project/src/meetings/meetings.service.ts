import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRepository } from './repository/meeting.repository';
import { GuestMembersRepository } from 'src/members/repository/guest-members.repository';
import { HostMembersRepository } from 'src/members/repository/host-members.repository';
import { MeetingInfoRepository } from './repository/meeting-info.repository';
import { NoticesRepository } from 'src/notices/repository/notices.repository';
import { SetGuestMembersDto } from 'src/members/dto/setGuestMembers.dto';
import { DeleteGuestDto } from 'src/meetings/dto/deleteGuest.dto';
import { CreateMeetingDto } from './dto/createMeeting.dto';
import { DeleteHostDto } from './dto/deleteHost.dto';
import { UpdateMeetingDto } from './dto/updateMeeting.dto';
import { Notices } from 'src/notices/entity/notices.entity';
import { Meetings } from './entity/meeting.entity';
import {
  ParticipatingMembers,
  MeetingDetail,
  MeetingMemberDetail,
  MeetingResponse,
  MeetingVacancy,
  ChangeAdminGuest,
} from './interface/meeting.interface';
import { NoticeType } from 'src/common/configs/notice-type.config';
import { DeleteMember } from 'src/members/interface/member.interface';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(MeetingRepository)
    private readonly meetingRepository: MeetingRepository,

    @InjectRepository(MeetingInfoRepository)
    private readonly meetingInfoRepository: MeetingInfoRepository,

    @InjectRepository(HostMembersRepository)
    private readonly hostMembersRepository: HostMembersRepository,

    @InjectRepository(GuestMembersRepository)
    private readonly guestMembersRepository: GuestMembersRepository,

    @InjectRepository(NoticesRepository)
    private readonly noticesRepository: NoticesRepository,
  ) {}

  private readonly member = { GUEST: 'guest', HOST: 'host' };

  private async getParticipatingMembers(
    meetingNo: number,
  ): Promise<ParticipatingMembers> {
    try {
      const participatingMembers: ParticipatingMembers =
        await this.meetingRepository.getParticipatingMembers(meetingNo);

      if (!participatingMembers.adminHost) {
        const affected: number = await this.meetingRepository.deleteMeeting(
          meetingNo,
        );
        if (!affected) {
          throw new InternalServerErrorException(`약속 삭제 오류입니다.`);
        }
        throw new BadRequestException(`삭제된 약속입니다.`);
      }

      return participatingMembers;
    } catch (err) {
      throw err;
    }
  }

  private async setMeetingDetail(
    meetingDetail: MeetingDetail,
  ): Promise<number> {
    try {
      const { affectedRows, insertId }: MeetingResponse =
        await this.meetingRepository.createMeeting(meetingDetail);
      if (!(affectedRows && insertId)) {
        throw new InternalServerErrorException(`meeting 생성 오류입니다.`);
      }

      return insertId;
    } catch (err) {
      throw err;
    }
  }

  private async setMeetingInfo(
    meetingInfo: MeetingMemberDetail,
  ): Promise<void> {
    try {
      const affectedRows: number =
        await this.meetingInfoRepository.createMeetingInfo(meetingInfo);

      if (!affectedRows) {
        throw new InternalServerErrorException(`meeting 생성 오류입니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  private async setMeetingMembers(
    members: number[],
    meetingNo: number,
    side: string,
  ) {
    try {
      const memberInfo: object[] = members.reduce((values, userNo) => {
        values.push({ meetingNo, userNo });
        return values;
      }, []);

      const affectedRows: number =
        side === 'guset'
          ? await this.guestMembersRepository.saveGuestMembers(memberInfo)
          : await this.hostMembersRepository.saveHostMembers(memberInfo);
      if (affectedRows !== members.length) {
        throw new InternalServerErrorException(`약속 멤버 추가 오류입니다`);
      }
    } catch (err) {
      throw err;
    }
  }

  async createMeeting(createMeetingDto: CreateMeetingDto): Promise<number> {
    try {
      const { location, time, host, guestHeadcount }: CreateMeetingDto =
        createMeetingDto;
      const meetingNo: number = await this.setMeetingDetail({ location, time });

      const meetingInfo: MeetingMemberDetail = {
        host: host[0], //후에 토큰 유저넘버로 변경
        meetingNo,
        guestHeadcount,
        hostHeadcount: host.length,
      };
      await this.setMeetingInfo(meetingInfo);
      await this.setMeetingMembers(host, meetingNo, this.member.HOST);

      return meetingNo;
    } catch (err) {
      throw err;
    }
  }

  async findMeetingById(meetingNo: number): Promise<Meetings> {
    try {
      const meeting: Meetings = await this.meetingRepository.findMeetingById(
        meetingNo,
      );
      if (!meeting) {
        throw new NotFoundException(
          `meetingNo가 ${meetingNo}인 약속을 찾지 못했습니다.`,
        );
      }
      return meeting;
    } catch (err) {
      throw err;
    }
  }

  private async checkIsAccepted(meetingNo: number): Promise<void> {
    //meeting이 있는지 동시에 확인
    try {
      const { isAccepted }: Meetings = await this.findMeetingById(meetingNo);
      if (isAccepted) {
        throw new BadRequestException(`이미 수락된 약속입니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  private async checkUpdateAvailable(
    meetingNo: number,
    userNo: number,
  ): Promise<void> {
    try {
      await this.checkIsAccepted(meetingNo);
      const { adminHost, isDone }: ParticipatingMembers =
        await this.meetingRepository.getParticipatingMembers(meetingNo);

      if (!isDone) {
        throw new BadRequestException(`아직 게스트가 참여하지 않은 약속입니다`);
      }

      if (userNo !== adminHost) {
        throw new BadRequestException(`약속 수정 권한이 없는 유저입니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  async updateMeeting(
    meetingNo: number,
    userNo: number,
    updateMeetingDto: UpdateMeetingDto,
  ): Promise<void> {
    try {
      await this.checkUpdateAvailable(meetingNo, userNo);

      const affected: number = await this.meetingRepository.updateMeeting(
        meetingNo,
        updateMeetingDto,
      );
      if (!affected) {
        throw new InternalServerErrorException(`약속 수정 관련 오류입니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  private async checkAcceptAvailable(meetingNo: number, userNo: number) {
    try {
      await this.checkIsAccepted(meetingNo);
      const { adminGuest, isDone }: ParticipatingMembers =
        await this.getParticipatingMembers(meetingNo);

      if (!isDone) {
        throw new BadRequestException(
          `게스트 참여 신청이 마감되지 않은 약속입니다`,
        );
      }
      if (userNo !== adminGuest) {
        throw new BadRequestException(`약속 수락 권한이 없는 유저입니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  async acceptMeeting(meetingNo: number, userNo: number): Promise<void> {
    try {
      await this.checkAcceptAvailable(meetingNo, userNo);

      const affected: number = await this.meetingRepository.acceptMeeting(
        meetingNo,
      );
      if (!affected) {
        throw new InternalServerErrorException(`약속 수락 관련 오류입니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  private castMembersAsNumber(guests: string, hosts: string): number[] {
    try {
      const members: number[] = guests
        ? hosts.split(',').concat(guests.split(',')).map(Number)
        : hosts.split(',').map(Number);

      return members;
    } catch (err) {
      throw err;
    }
  }

  private checkUsersInMembers(users: number[], guests: string, hosts: string) {
    try {
      const members: number[] = this.castMembersAsNumber(guests, hosts);
      const isOverlaped: number =
        members.length + users.length - new Set([...members, ...users]).size;

      if (isOverlaped) {
        throw new BadRequestException(`이미 약속에 참여 중인 유저입니다`);
      }
    } catch (err) {
      throw err;
    }
  }

  private async checkApplyAvailable(
    meetingNo: number,
    guest: number[],
  ): Promise<ParticipatingMembers> {
    try {
      await this.findMeetingById(meetingNo);
      const memberDetail: ParticipatingMembers =
        await this.getParticipatingMembers(meetingNo);

      const { isDone, guests, hosts }: ParticipatingMembers = memberDetail;
      this.checkUsersInMembers(guest, guests, hosts);
      if (isDone) {
        throw new BadRequestException(`게스트 신청이 마감된 약속입니다`);
      }

      return memberDetail;
    } catch (err) {
      throw err;
    }
  }

  async applyForMeeting({
    meetingNo,
    guest,
  }: SetGuestMembersDto): Promise<void> {
    try {
      const { guestHeadcount, adminHost }: ParticipatingMembers =
        await this.checkApplyAvailable(meetingNo, guest);

      if (guestHeadcount != guest.length) {
        throw new BadRequestException(
          `게스트가 ${guestHeadcount}명이어야 합니다.`,
        );
      }

      await this.setNotice(
        adminHost,
        guest[0],
        NoticeType.APPLY_FOR_MEETING,
        JSON.stringify({ guest, meetingNo }),
      );
    } catch (err) {
      throw err;
    }
  }

  private async setAdminGuest(meetingNo: number, guest: number): Promise<void> {
    try {
      const affected: number =
        await this.meetingInfoRepository.saveMeetingGuest(guest, meetingNo);
      if (!affected) {
        throw new InternalServerErrorException(
          `약속 adimGuest 추가 오류입니다`,
        );
      }
    } catch (err) {
      throw err;
    }
  }

  async acceptGuestApplication(noticeNo: number): Promise<void> {
    try {
      const notice: Notices = await this.noticesRepository.getNoticeById(
        noticeNo,
      );
      const { guest, meetingNo } = JSON.parse(notice.value);

      const { adminHost }: ParticipatingMembers =
        await this.checkApplyAvailable(meetingNo, guest);

      if (notice.userNo !== adminHost) {
        throw new BadRequestException(
          `게스트 참여 요청 수락 권한이 없는 유저입니다`,
        );
      }

      await this.setAdminGuest(meetingNo, guest[0]);
      await this.setMeetingMembers(guest, meetingNo, this.member.GUEST);
    } catch (err) {
      throw err;
    }
  }

  async getMeetingMembers(meetingNo: number): Promise<number[]> {
    try {
      const { hosts, guests }: ParticipatingMembers =
        await this.getParticipatingMembers(meetingNo);
      const members: number[] = this.castMembersAsNumber(guests, hosts);

      return members;
    } catch (err) {
      throw err;
    }
  }

  private async setNotice(
    userNo: number,
    targetUserNo: number,
    type: number,
    value: string,
  ): Promise<void> {
    const { affectedRows }: MeetingResponse =
      await this.noticesRepository.saveNotice({
        userNo,
        targetUserNo,
        type,
        value,
      });

    if (!affectedRows) {
      throw new InternalServerErrorException(`약속 알람 생성 에러입니다.`);
    }
  }

  private checkMeetingVacancy(meetingVacancy: MeetingVacancy): void {
    try {
      const { addGuestAvailable, addHostAvailable } = meetingVacancy;

      if (addGuestAvailable && !parseInt(addGuestAvailable)) {
        throw new BadRequestException(`게스트 최대 인원을 초과했습니다.`);
      }
      if (addHostAvailable && !parseInt(addHostAvailable)) {
        throw new BadRequestException(`호스트 최대 인원을 초과했습니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  private async checkInviteAvailable(
    userNo: number,
    meetingNo: number,
    invitedUserNo: number,
  ): Promise<number> {
    try {
      const {
        addGuestAvailable,
        addHostAvailable,
        guests,
        hosts,
      }: ParticipatingMembers = await this.getParticipatingMembers(meetingNo);
      await this.checkUsersInMembers([invitedUserNo], guests, hosts);

      if (hosts.split(',').map(Number).includes(userNo)) {
        this.checkMeetingVacancy({ addHostAvailable });

        return NoticeType.INVITE_HOST;
      } else if (guests && guests.split(',').map(Number).includes(userNo)) {
        this.checkMeetingVacancy({ addGuestAvailable });

        return NoticeType.INVITE_GUEST;
      } else {
        throw new BadRequestException(
          `약속에 참여 중이지 않은 유저는 초대 요청을 보낼 수 없습니다.`,
        );
      }
    } catch (err) {
      throw err;
    }
  }

  async inviteMember(
    meetingNo: number,
    invitedUserNo: number,
    userNo: number,
  ): Promise<void> {
    try {
      await this.findMeetingById(meetingNo);
      const noticeType: number = await this.checkInviteAvailable(
        userNo,
        meetingNo,
        invitedUserNo,
      );

      this.setNotice(
        invitedUserNo,
        userNo,
        noticeType,
        JSON.stringify({ meetingNo }),
      );
    } catch (err) {
      throw err;
    }
  }

  private async saveInvitedMember(
    userNo: number,
    noticeType: number,
    meetingNo: number,
  ): Promise<void> {
    try {
      if (
        noticeType !== NoticeType.INVITE_HOST &&
        noticeType !== NoticeType.INVITE_GUEST
      ) {
        throw new BadRequestException(`알람 type에 맞지 않는 요청 경로입니다.`);
      }

      const { addGuestAvailable, addHostAvailable } =
        await this.getParticipatingMembers(meetingNo);

      if (noticeType === NoticeType.INVITE_GUEST) {
        this.checkMeetingVacancy({ addGuestAvailable });
        await this.setMeetingMembers([userNo], meetingNo, this.member.GUEST);
      } else {
        this.checkMeetingVacancy({ addHostAvailable });
        await this.setMeetingMembers([userNo], meetingNo, this.member.HOST);
      }
    } catch (err) {
      throw err;
    }
  }

  async acceptInvitation(noticeNo: number, userNo: number): Promise<void> {
    try {
      const { value, type }: Notices =
        await this.noticesRepository.getNoticeById(noticeNo);
      const { meetingNo } = JSON.parse(value);

      await this.findMeetingById(meetingNo);
      await this.saveInvitedMember(userNo, type, meetingNo);
    } catch (err) {
      throw err;
    }
  }

  private detectNotInMembers(
    sameSideMembers: string,
    userNo: number,
    newAdmin: number,
  ): void {
    try {
      const members: number[] = sameSideMembers.split(',').map(Number);
      const notInMembers: number =
        new Set([...members, userNo, newAdmin]).size - members.length;

      if (notInMembers) {
        throw new BadRequestException(`약속에 참여 중인 유저가 아닙니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  private async detectAdminGuestChange(
    changeAdminGuest: ChangeAdminGuest,
  ): Promise<void> {
    try {
      const { userNo, adminGuest, newAdminGuest, meetingNo } = changeAdminGuest;

      if (userNo === adminGuest) {
        await this.setAdminGuest(meetingNo, newAdminGuest);

        this.setNotice(
          userNo,
          newAdminGuest,
          NoticeType.BE_ADMIN_GUEST,
          JSON.stringify({ meetingNo }),
        );
      } else if (adminGuest !== newAdminGuest) {
        throw new BadRequestException(
          `호스트 대표가 계속 약속에 참여할 경우 새로운 대표를 설정할 수 없습니다.`,
        );
      }
    } catch (err) {
      throw err;
    }
  }

  private async deleteMember(
    deleteMember: DeleteMember,
    side: string,
  ): Promise<void> {
    try {
      const affected: number =
        side === this.member.GUEST
          ? await this.guestMembersRepository.deleteGuest(deleteMember)
          : await this.hostMembersRepository.deleteHost(deleteMember);

      if (!affected) {
        throw new InternalServerErrorException(`멤버 삭제 에러입니다.`);
      }
    } catch (err) {
      throw err;
    }
  }

  async deleteGuest({
    userNo,
    newAdminGuest,
    meetingNo,
  }: DeleteGuestDto): Promise<void> {
    try {
      await this.findMeetingById(meetingNo);

      const { adminGuest, guests }: ParticipatingMembers =
        await this.getParticipatingMembers(meetingNo);
      if (!adminGuest) {
        throw new BadRequestException(`참여 중인 게스트가 없는 약속입니다`);
      }
      if (userNo === newAdminGuest) {
        throw new BadRequestException(`새로운 호스트 대표를 설정해 주세요.`);
      }

      this.detectNotInMembers(guests, userNo, newAdminGuest);
      await this.detectAdminGuestChange({
        meetingNo,
        userNo,
        adminGuest,
        newAdminGuest,
      });

      await this.deleteMember({ meetingNo, userNo }, this.member.GUEST);
    } catch (err) {
      throw err;
    }
  }

  async deleteHost({ userNo, meetingNo }: DeleteHostDto): Promise<string> {
    try {
      await this.findMeetingById(meetingNo);

      const { adminHost, hosts }: ParticipatingMembers =
        await this.getParticipatingMembers(meetingNo);
      if (userNo === adminHost) {
        const affected: number = await this.meetingRepository.deleteMeeting(
          meetingNo,
        );
        if (!affected) {
          throw new InternalServerErrorException(`호스트 삭제 에러입니다.`);
        }
        return `${meetingNo}번 약속이 성공적으로 삭제되었습니다.`;
      }

      this.detectNotInMembers(hosts, userNo, adminHost);
      await this.deleteMember({ meetingNo, userNo }, this.member.HOST);

      return '호스트 측 멤버가 약속에서 삭제되었습니다.';
    } catch (err) {
      throw err;
    }
  }
}
