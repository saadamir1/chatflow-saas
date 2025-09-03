import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { CitiesModule } from './cities/cities.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './upload/upload.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { InvitationsModule } from './invitations/invitations.module';
import { BillingModule } from './billing/billing.module';

import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuditLog } from './common/entities/audit-log.entity';
import { GraphQLThrottlerGuard } from './common/guards/graphql-throttler.guard';
import { GraphQLValidationFilter } from './common/filters/graphql-exception.filter';
import { WebSocketsModule } from './websockets/websockets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req }) => ({ req }),
      subscriptions: {
        'subscriptions-transport-ws': true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // If DATABASE_URL is provided (production), use it
        if (databaseUrl) {
          console.log('Using DATABASE_URL for connection');
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [join(process.cwd(), 'dist', '**', '*.entity{.ts,.js}')],
            autoLoadEntities: true,
            // Remove synchronize in production and use migrations instead
            synchronize: false, // Always false in production
            // Migration configuration
            migrations: [
              join(process.cwd(), 'dist', 'migrations', '*.{ts,js}'),
            ],
            migrationsTableName: 'migrations',
            migrationsRun:
              configService.get<string>('NODE_ENV') === 'production',
            logging: configService.get<string>('NODE_ENV') === 'development',
            ssl:
              configService.get<string>('NODE_ENV') === 'production'
                ? { rejectUnauthorized: false }
                : false,
          };
        }

        // Fallback to individual variables (development)
        console.log('Using individual DB variables for connection');
        console.log('DB_HOST:', configService.get('DB_HOST'));
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [join(process.cwd(), 'dist', '**', '*.entity{.ts,.js}')],
          autoLoadEntities: true,
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          migrations: [join(process.cwd(), 'dist', 'migrations', '*.{ts,js}')],
          migrationsTableName: 'migrations',
          migrationsRun: false,
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
    TypeOrmModule.forFeature([AuditLog]),
    CitiesModule,
    UsersModule,
    AuthModule,
    ChatModule,
    NotificationsModule,
    WebSocketsModule,
    UploadModule,
    AnalyticsModule,
    WorkspacesModule,
    InvitationsModule,
    BillingModule,
  ],
  controllers: [],
  providers: [
    // GraphQL throttler guard disabled - needs further investigation
    // Rate limiting can be implemented at API Gateway level in production
    // {
    //   provide: APP_GUARD,
    //   useClass: GraphQLThrottlerGuard,
    // },
    {
      provide: APP_FILTER,
      useClass: GraphQLValidationFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Logger middleware disabled for GraphQL to avoid introspection spam
  }
}
