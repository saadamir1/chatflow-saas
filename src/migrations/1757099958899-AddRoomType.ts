import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoomType1757099958899 implements MigrationInterface {
    name = 'AddRoomType1757099958899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."chat_rooms_type_enum" AS ENUM('CHANNEL', 'DIRECT_MESSAGE')`);
        await queryRunner.query(`ALTER TABLE "chat_rooms" ADD "type" "public"."chat_rooms_type_enum" NOT NULL DEFAULT 'CHANNEL'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_rooms" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."chat_rooms_type_enum"`);
    }

}
