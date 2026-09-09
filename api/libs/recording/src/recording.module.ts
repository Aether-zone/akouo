import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { type EnvService } from '@akouo/common';
import { MeetingModule } from '@akouo/meeting';

import { RecordingService } from './recording.service';
import { RecordingMapper } from './recording.mapper';
import { recordingProviders } from './recording.providers';
import { RecordingController } from './recording.controller';
import { recordingUploadOptions } from './recording.upload';

@Module({
  imports: [
    // For `MeetingService`: an upload announces the meeting alongside the
    // recording, so a transcriber can see who was expected in the room.
    MeetingModule,
    // Recording uploads are the only multipart traffic in this module, so its
    // storage, size cap and type filter are the module-wide multer defaults.
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: EnvService) => recordingUploadOptions(config),
    }),
  ],
  providers: [...recordingProviders, RecordingService, RecordingMapper],
  controllers: [RecordingController],
  exports: [RecordingService, RecordingMapper],
})
export class RecordingModule { }
