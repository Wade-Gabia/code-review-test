import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(dto);
    return this.taskRepository.save(task);
  }

  // 결함: 태스크 목록 조회 후 각 태스크의 assignee를 루프에서 별도 쿼리로 조회 (N+1)
  async findAll(): Promise<any[]> {
    const tasks = await this.taskRepository.find();

    const result = [];
    for (const task of tasks) {
      let assignee = null;
      if (task.assigneeId) {
        assignee = await this.taskRepository.manager.findOne(
          require('../users/user.entity').User,
          { where: { id: task.assigneeId } },
        );
      }
      result.push({ ...task, assignee });
    }

    return result;
  }

  async findOne(id: number): Promise<Task> {
    return this.taskRepository.findOne({
      where: { id },
      relations: ['assignee', 'project'],
    });
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    await this.taskRepository.update(id, dto);
    return this.taskRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
