import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvitations1756918209369 implements MigrationInterface {
    name = 'AddInvitations1756918209369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'declined', 'expired')`);
        await queryRunner.query(`CREATE TABLE "invitations" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "token" character varying NOT NULL, "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP NOT NULL, "workspaceId" integer NOT NULL, "invitedById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_fd175905b95c6758d226a632d0e" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_b60325e5302be0dad38b423314c" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_b60325e5302be0dad38b423314c"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_fd175905b95c6758d226a632d0e"`);
        await queryRunner.query(`DROP TABLE "invitations"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
    }

}
