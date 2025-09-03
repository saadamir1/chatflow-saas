import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsageTracking1756928467800 implements MigrationInterface {
    name = 'AddUsageTracking1756928467800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_plantype_enum" AS ENUM('free', 'pro', 'enterprise')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "stripeSubscriptionId" character varying, "stripeCustomerId" character varying, "planType" "public"."subscriptions_plantype_enum" NOT NULL DEFAULT 'free', "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'trialing', "amount" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'usd', "currentPeriodStart" TIMESTAMP, "currentPeriodEnd" TIMESTAMP, "trialEnd" TIMESTAMP, "workspaceId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b708d303a3196a61cc88d08931" UNIQUE ("stripeSubscriptionId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('succeeded', 'pending', 'failed', 'canceled', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "stripePaymentIntentId" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'usd', "status" "public"."payments_status_enum" NOT NULL, "description" character varying, "metadata" json, "workspaceId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_57059f281caef51ef1c15adaf35" UNIQUE ("stripePaymentIntentId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usage_records" ("id" SERIAL NOT NULL, "feature" character varying NOT NULL, "quantity" integer NOT NULL DEFAULT '0', "date" date NOT NULL, "workspaceId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e511cf9f7dc53851569f87467a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_5eb562a52f8e96e1a7a25279297" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d4d8ed86743799cf0e3c94c67bb" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_records" ADD CONSTRAINT "FK_b57d00b1644285989a3192f3ef2" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usage_records" DROP CONSTRAINT "FK_b57d00b1644285989a3192f3ef2"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d4d8ed86743799cf0e3c94c67bb"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_5eb562a52f8e96e1a7a25279297"`);
        await queryRunner.query(`DROP TABLE "usage_records"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_plantype_enum"`);
    }

}
