import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Development CORS - allows all origins
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({
      origin: true, // This allows all origins in development
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
  } else {
    // Production CORS - restrictive
    app.enableCors({
      origin: [
        'https://pg-crud-frontend-44cu.vercel.app',
        'https://pg-crud-frontend-44cu-saadamir1s-projects.vercel.app/',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: true, // throws error on unknown props
      transform: true, // auto-transforms payloads to DTO classes
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter()); // handles unhandled exceptions globally

  // GraphQL will be available at /graphql

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`GraphQL API running on http://localhost:${port}`);
  console.log(`GraphQL Playground available at http://localhost:${port}/graphql`);
}
bootstrap();
