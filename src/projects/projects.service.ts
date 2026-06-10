import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(name: string, description: string, ownerId: number): Promise<Project> {
    const project = this.projectRepository.create({ name, description, ownerId });
    return this.projectRepository.save(project);
  }

  // 결함: 프로젝트 목록을 가져온 뒤 각 프로젝트의 task 수를 루프에서 별도 쿼리로 조회 (N+1)
  async findAll(): Promise<any[]> {
    const projects = await this.projectRepository.find();

    const result = [];
    for (const project of projects) {
      const taskCount = await this.projectRepository
        .createQueryBuilder('project')
        .leftJoin('project.tasks', 'task')
        .where('project.id = :id', { id: project.id })
        .select('COUNT(task.id)', 'count')
        .getRawOne();

      result.push({
        ...project,
        taskCount: parseInt(taskCount.count, 10),
      });
    }

    return result;
  }

  async findOne(id: number): Promise<Project> {
    return this.projectRepository.findOne({ where: { id }, relations: ['tasks', 'owner'] });
  }

  async remove(id: number): Promise<void> {
    await this.projectRepository.delete(id);
  }
}
