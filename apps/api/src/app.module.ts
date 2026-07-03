import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { User } from './users/entities/user.entity';
import { Role } from './users/entities/role.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GraphModule } from './graph/graph.module';
import { InvitesModule } from './invites/invites.module';
import { AdminSeeder } from './seed/admin.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.database'),
        entities: [User, Role],
        synchronize: config.get<boolean>('db.synchronize'),
      }),
    }),
    UsersModule,
    AuthModule,
    GraphModule,
    InvitesModule,
  ],
  providers: [AdminSeeder],
})
export class AppModule {}
