import { Module } from '@nestjs/common';
import { OboService } from './obo.service';
import { GraphService } from './graph.service';

@Module({
  providers: [OboService, GraphService],
  exports: [GraphService, OboService],
})
export class GraphModule {}
