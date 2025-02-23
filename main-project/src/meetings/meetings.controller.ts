import {
  Param,
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { BodyAndParam } from 'src/common/decorator/body-and-param.decorator';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/createMeeting.dto';
import { UpdateMeetingDto } from './dto/updateMeeting.dto';
import { DeleteGuestDto } from 'src/meetings/dto/deleteGuest.dto';
import { DeleteHostDto } from './dto/deleteHost.dto';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: '새로운 약속 생성',
  })
  @Post()
  async createMeeting(
    @Body() createMeetingDto: CreateMeetingDto,
  ): Promise<object> {
    try {
      const meetingNo: number = await this.meetingsService.createMeeting(
        createMeetingDto,
      );

      return {
        success: true,
        msg: '약속이 생성되었습니다.',
        meetingNo,
      };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({
    description: '호스트가 게스트의 약속 참여 요청 수락',
  })
  @Patch('/accept/application/:noticeNo')
  async acceptGuestApplication(
    @Param('noticeNo') noticeNo: number,
  ): Promise<object> {
    try {
      await this.meetingsService.acceptGuestApplication(noticeNo);

      return { success: true, msg: `게스트의 참여 요청이 수락되었습니다.` };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: '새로운 멤버로 약속에 참여',
  })
  @Patch('/accept/invitation/:noticeNo/:userNo') // 후에 토큰에서 받도록 수정
  async acceptInvitation(
    @Param('noticeNo') noticeNo: number,
    @Param('userNo') userNo: number,
  ) {
    try {
      await this.meetingsService.acceptInvitation(noticeNo, userNo);

      return {
        succes: true,
        msg: `초대 요청이 수락되었습니다.`,
      };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: '약속 장소/시간 수정',
  })
  @Patch('/:meetingNo/:userNo') //후에 토큰에서 userNo 받아오도록 수정
  async updateMeeting(
    @Param('meetingNo') meetingNo: number,
    @Param('userNo') userNo: number,
    @Body() updateMeetingDto: UpdateMeetingDto,
  ): Promise<object> {
    try {
      await this.meetingsService.updateMeeting(
        meetingNo,
        userNo,
        updateMeetingDto,
      );

      return { success: true, msg: `약속이 수정되었습니다` };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOkResponse({
    description: '약속 수락',
  })
  @Patch('/accept/:meetingNo/:userNo') //후에 토큰에서 userNo 받아오도록 수정
  async acceptMeeting(
    @Param('meetingNo') meetingNo: number,
    @Param('userNo') userNo: number,
  ): Promise<object> {
    try {
      await this.meetingsService.acceptMeeting(meetingNo, userNo);

      return { success: true, msg: `약속이 수락되었습니다` };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({
    description: '약속에 게스트로 참여 신청',
  })
  @Post('/apply/:meetingNo')
  async setGuestMembers(
    @Param('meetingNo') meetingNo: number,
    @Body('guest') guest: number[],
  ): Promise<object> {
    try {
      await this.meetingsService.applyForMeeting({ meetingNo, guest });

      return { success: true, msg: `약속 신청이 완료되었습니다.` };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: '참여 중인 약속에 새로운 멤버 초대',
  })
  @Post('/invite/:meetingNo/:userNo')
  async inviteGuest(
    @Body('invitedUserNo') invitedUserNo: number,
    @Param('meetingNo') meetingNo: number,
    @Param('userNo') userNo: number, //후에 토큰에서 받도록 수정
  ) {
    try {
      await this.meetingsService.inviteMember(meetingNo, invitedUserNo, userNo);

      return {
        succes: true,
        msg: `약속 초대 알람이 전송되었습니다.`,
      };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: '게스트 삭제',
  })
  @Delete('/guest/:meetingNo/:userNo') //후에 토큰에서 userNo 받아오도록 수정
  async deleteGuest(@BodyAndParam() deleteGuestDto: DeleteGuestDto) {
    try {
      await this.meetingsService.deleteGuest(deleteGuestDto);

      return {
        success: true,
        msg: `게스트가 삭제되었습니다.`,
      };
    } catch (err) {
      throw err;
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: '호스트 삭제',
  })
  @Delete('/host/:meetingNo/:userNo') //후에 토큰에서 userNo 받아오도록 수정
  async deleteHost(@BodyAndParam() deleteHostDto: DeleteHostDto) {
    try {
      const msg: string = await this.meetingsService.deleteHost(deleteHostDto);

      return {
        success: true,
        msg,
      };
    } catch (err) {
      throw err;
    }
  }
}
