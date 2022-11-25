import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { ApplicationDto } from './dto/application.dto';
import { BoardDto } from './dto/board.dto';
import { BoardReadResponse } from './interface/boards.interface';

@Controller('boards')
@ApiTags('게시글 API')
export class BoardsController {
  constructor(private boardService: BoardsService) { }
  //Get Methods
  @Get()
  @ApiOperation({
    summary: '게시글 전체 조회 API',
    description: '게시글 전부를 내림차순으로 조회한다.',
  })
  async getAllBoards(): Promise<object> {
    const response: object = await this.boardService.getAllBoards();

    return { response };
  }

  @Get('/:boardNo')
  @ApiOperation({
    summary: '게시글 상세조회 API',
    description: '게시글 번호를 사용해 상세조회한다.',
  })
  async getBoardByNo(@Param('boardNo') boardNo: number): Promise<object> {
    const response: BoardReadResponse = await this.boardService.getBoardByNo(
      boardNo,
    );

    return { response };
  }

  // Post Methods
  @Post()
  @ApiOperation({
    summary: '게시글 생성 API',
    description: '입력한 정보로 게시글, 멤버 정보을 생성한다.',
  })
  async createBoard(@Body() createBoarddto: BoardDto): Promise<object> {
    const response: number = await this.boardService.createBoard(createBoarddto);

    return { response };
  }

  @Post('/:boardNo/:userNo/bookmark')
  @ApiOperation({
    summary: '북마크 생성 API',
    description: '게시글 번호를 통해 해당 User의 북마크를 생성한다..',
  })
  async createBookmark(
    @Param() params: { [key: string]: number }, // jwt -> userNo
  ): Promise<object> {

    const { boardNo, userNo } = params;
    const response: number = await this.boardService.createBookmark({
      boardNo,
      userNo,
    });

    return { response };
  }

  @Post('/:boardNo/application')
  @ApiOperation({
    summary: '게스트 참가 신청 API',
    description: '',
  })
  async createAplication(
    @Param('boardNo') boardNo: number, @Body() applicationDto: ApplicationDto
  ): Promise<object> {
    const response: number = await this.boardService.createAplication(
      { boardNo, ...applicationDto }
    );

    return { response };
  }

  // Patch Methods
  @Patch('/:boardNo')
  @ApiOperation({
    summary: '게시글 수정 API',
    description: '입력한 정보로 게시글, 멤버 정보을 수정한다.',
  })
  async updateBoard(
    @Param('boardNo', ParseIntPipe) boardNo: number,
    @Body() BoardDto: BoardDto,
  ): Promise<object> {
    const response: string = await this.boardService.editBoard(boardNo, BoardDto);

    return { response };
  }

  // Delete Methods
  @Delete('/:boardNo')
  @ApiOperation({
    summary: '게시글 삭제 API',
    description: '게시글 번호를 사용해 게시글, 게시글 멤버 정보을 삭제한다.',
  })
  async deleteBoard(
    @Param('boardNo', ParseIntPipe) boardNo: number,
  ): Promise<object> {
    const response: string = await this.boardService.deleteBoardByNo(boardNo);

    return { response };
  }

  @Delete('/:boardNo/:userNo') // 후에 jwt에서 userNo 빼올 예정
  @ApiOperation({
    summary: '북마크 취소 API',
    description: '게시글 번호를 사용해 해당 User의 북마크를 취소한다.',
  })
  async cancelBookmark(
    @Param() params: { [key: string]: number }, // userNo -> jwt
  ): Promise<object> {
    const { boardNo, userNo } = params;
    const response = await this.boardService.cancelBookmark(boardNo, userNo);

    return { response };
  }
}
