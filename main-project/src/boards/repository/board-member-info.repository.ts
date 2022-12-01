import { InternalServerErrorException } from "@nestjs/common";
import { DeleteResult, EntityRepository, InsertResult, Repository, UpdateResult } from "typeorm";
import { BoardMemberInfos } from "../entity/board-member-info.entity";
import { BoardMemberDetail, CreateResponse } from "../interface/boards.interface";

@EntityRepository(BoardMemberInfos)
export class BoardMemberInfoRepository extends Repository<BoardMemberInfos> {
    // 생성
    async createBoardMember(
        boardMemberDetail: BoardMemberDetail,
    ): Promise<CreateResponse> {
        try {
            const { raw }: InsertResult = await this.createQueryBuilder(
                'board_member_infos',
            )
                .insert()
                .into(BoardMemberInfos)
                .values(boardMemberDetail)
                .execute();

            return raw;
        } catch (error) {
            throw new InternalServerErrorException(
                `${error} createBoardMember-repository: 알 수 없는 서버 에러입니다.`,
            );
        }
    }

    // 수정
    async updateBoardMember(
        boardNo: number,
        boardMember: BoardMemberDetail,
    ): Promise<number> {
        try {
            const { affected }: UpdateResult = await this.createQueryBuilder()
                .update(BoardMemberInfos)
                .set(boardMember)
                .where('boardNo = :boardNo', { boardNo })
                .execute();

            return affected;
        } catch (error) {
            throw new InternalServerErrorException(
                `${error} updateBoardMember-repository: 알 수 없는 서버 에러입니다.`,
            );
        }
    }

    // 삭제
    async deleteBoardMember(boardNo: number): Promise<number> {
        try {
            const { affected }: DeleteResult = await this.createQueryBuilder(
                'board_member_infos',
            )
                .delete()
                .from(BoardMemberInfos)
                .where('boardNo = :boardNo', { boardNo })
                .execute();

            return affected;
        } catch (error) {
            throw new InternalServerErrorException(
                `${error} deleteBoardMember-repository: 알 수 없는 서버 에러입니다.`,
            );
        }
    }
}
