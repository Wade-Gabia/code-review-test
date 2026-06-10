import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // 결함: 유효성 검사 없이 body를 그대로 사용
  @Post()
  create(@Body() body: { name: string; description: string; ownerId: number }) {
    return this.projectsService.create(body.name, body.description, body.ownerId);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  // 결함: findOne이 null을 반환해도 404를 던지지 않음
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  // 결함: 존재하지 않는 프로젝트 삭제 시도 시 에러 미처리
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }
}
