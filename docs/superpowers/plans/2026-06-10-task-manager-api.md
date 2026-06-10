# Task Manager API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 코드리뷰 도구 3종 비교를 위한 NestJS Task Manager API 샘플 프로젝트 생성 (실행 불필요, 의도적 결함 포함)

**Architecture:** NestJS 표준 모듈 구조 (User → Project → Task). 서비스 레이어는 정상 구현, 컨트롤러 에러핸들링 누락 + 서비스 N+1 쿼리 + DTO 검증 미흡 + 엔티티 인덱스 누락을 의도적으로 삽입.

**Tech Stack:** NestJS 10, TypeScript 5, TypeORM 0.3, class-validator, class-transformer

---

## File Map

| 파일 | 역할 | 결함 |
|------|------|------|
| `src/main.ts` | 앱 부트스트랩 | 없음 |
| `src/app.module.ts` | 루트 모듈 | 없음 |
| `src/users/user.entity.ts` | User 엔티티 | 없음 |
| `src/users/users.service.ts` | User CRUD | 없음 |
| `src/users/users.controller.ts` | User 엔드포인트 | 없음 |
| `src/users/users.module.ts` | User 모듈 | 없음 |
| `src/projects/project.entity.ts` | Project 엔티티 | 없음 |
| `src/projects/projects.service.ts` | Project CRUD | **N+1**: task count 루프 조회 |
| `src/projects/projects.controller.ts` | Project 엔드포인트 | **에러핸들링 누락** |
| `src/projects/projects.module.ts` | Project 모듈 | 없음 |
| `src/tasks/task.entity.ts` | Task 엔티티 | **인덱스 누락** (status, assigneeId) |
| `src/tasks/dto/create-task.dto.ts` | 생성 DTO | **any 타입**, `@IsNotEmpty()` 누락 |
| `src/tasks/dto/update-task.dto.ts` | 수정 DTO | **PartialType 미사용**, 필드 중복 |
| `src/tasks/tasks.service.ts` | Task CRUD | **N+1**: assignee 루프 조회 |
| `src/tasks/tasks.controller.ts` | Task 엔드포인트 | **에러핸들링 누락**, 404 없음 |
| `src/tasks/tasks.module.ts` | Task 모듈 | 없음 |
| `package.json` | 의존성 | 없음 |
| `tsconfig.json` | TS 설정 | 없음 |
| `nest-cli.json` | NestJS CLI 설정 | 없음 |

---

### Task 1: 프로젝트 설정 파일

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `nest-cli.json`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "task-manager-api",
  "version": "1.0.0",
  "description": "Code review comparison sample project",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.1.3"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

- [ ] **Step 3: nest-cli.json 작성**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 4: 커밋**

```bash
git init
git add package.json tsconfig.json nest-cli.json
git commit -m "chore: init project config"
```

---

### Task 2: User 모듈

**Files:**
- Create: `src/users/user.entity.ts`
- Create: `src/users/users.service.ts`
- Create: `src/users/users.controller.ts`
- Create: `src/users/users.module.ts`

- [ ] **Step 1: user.entity.ts 작성**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks: Task[];
}
```

- [ ] **Step 2: users.service.ts 작성**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(email: string, name: string): Promise<User> {
    const user = this.userRepository.create({ email, name });
    return this.userRepository.save(user);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }
}
```

- [ ] **Step 3: users.controller.ts 작성**

```typescript
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: { email: string; name: string }) {
    return this.usersService.create(body.email, body.name);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
```

- [ ] **Step 4: users.module.ts 작성**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: 커밋**

```bash
git add src/users/
git commit -m "feat: add users module"
```

---

### Task 3: Project 모듈 (N+1 결함 + 에러핸들링 누락)

**Files:**
- Create: `src/projects/project.entity.ts`
- Create: `src/projects/projects.service.ts` — **N+1 결함 의도 삽입**
- Create: `src/projects/projects.controller.ts` — **에러핸들링 누락 의도 삽입**
- Create: `src/projects/projects.module.ts`

- [ ] **Step 1: project.entity.ts 작성**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  ownerId: number;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: projects.service.ts 작성 (N+1 결함 포함)**

```typescript
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
```

- [ ] **Step 3: projects.controller.ts 작성 (에러핸들링 누락)**

```typescript
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
```

- [ ] **Step 4: projects.module.ts 작성**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

- [ ] **Step 5: 커밋**

```bash
git add src/projects/
git commit -m "feat: add projects module"
```

---

### Task 4: Task 모듈 (N+1 + 에러핸들링 + DTO + 인덱스 결함)

**Files:**
- Create: `src/tasks/task.entity.ts` — **인덱스 누락**
- Create: `src/tasks/dto/create-task.dto.ts` — **any 타입, @IsNotEmpty() 누락**
- Create: `src/tasks/dto/update-task.dto.ts` — **PartialType 미사용, 필드 중복**
- Create: `src/tasks/tasks.service.ts` — **N+1 결함**
- Create: `src/tasks/tasks.controller.ts` — **에러핸들링 누락**
- Create: `src/tasks/tasks.module.ts`

- [ ] **Step 1: task.entity.ts 작성 (인덱스 누락)**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  // 결함: 자주 필터링되는 컬럼인데 @Index() 없음
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column()
  projectId: number;

  // 결함: 자주 JOIN되는 FK인데 @Index() 없음
  @Column({ nullable: true })
  assigneeId: number;

  @Column({ nullable: true })
  dueDate: Date;

  @ManyToOne(() => Project, (project) => project.tasks)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

- [ ] **Step 2: create-task.dto.ts 작성 (유효성 검사 미흡)**

```typescript
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { TaskStatus } from '../task.entity';

export class CreateTaskDto {
  // 결함: @IsNotEmpty() 누락 — 빈 문자열도 통과
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsNumber()
  projectId: number;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  // 결함: dueDate 타입이 any — Date 검증 없음
  @IsOptional()
  dueDate?: any;
}
```

- [ ] **Step 3: update-task.dto.ts 작성 (PartialType 미사용, 필드 중복)**

```typescript
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { TaskStatus } from '../task.entity';

// 결함: PartialType(CreateTaskDto)을 쓰면 되는데 필드를 직접 중복 정의
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  // 결함: projectId는 변경 불가여야 하는데 수정 가능하도록 노출됨
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  dueDate?: any;
}
```

- [ ] **Step 4: tasks.service.ts 작성 (N+1 결함)**

```typescript
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
```

- [ ] **Step 5: tasks.controller.ts 작성 (에러핸들링 누락)**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // 결함: ValidationPipe 없이 DTO 사용 — class-validator 데코레이터 미작동
  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  // 결함: null 반환 시 404 처리 없음
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  // 결함: 존재하지 않는 id 수정 시 에러 미처리
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  // 결함: 존재하지 않는 id 삭제 시 204만 반환, 실제 삭제 여부 확인 없음
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}
```

- [ ] **Step 6: tasks.module.ts 작성**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
```

- [ ] **Step 7: 커밋**

```bash
git add src/tasks/
git commit -m "feat: add tasks module"
```

---

### Task 5: 앱 루트 모듈 & 부트스트랩

**Files:**
- Create: `src/app.module.ts`
- Create: `src/main.ts`

- [ ] **Step 1: app.module.ts 작성**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Task } from './tasks/task.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'task_manager',
      entities: [User, Project, Task],
      synchronize: true,
    }),
    UsersModule,
    ProjectsModule,
    TasksModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: main.ts 작성**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

- [ ] **Step 3: 최종 커밋**

```bash
git add src/app.module.ts src/main.ts
git commit -m "feat: wire up app module and bootstrap"
```

---

## 결함 요약

| 위치 | 결함 유형 | 설명 |
|------|-----------|------|
| `tasks.controller.ts` | 에러핸들링 누락 | 404, try/catch 없음 |
| `projects.controller.ts` | 에러핸들링 누락 | null 반환 미처리 |
| `tasks.service.ts` | N+1 쿼리 | assignee 루프 조회 |
| `projects.service.ts` | N+1 쿼리 | taskCount 루프 조회 |
| `create-task.dto.ts` | DTO 유효성 미흡 | `@IsNotEmpty()` 누락, `dueDate: any` |
| `update-task.dto.ts` | DTO 설계 미흡 | PartialType 미사용, projectId 노출 |
| `task.entity.ts` | 인덱스 누락 | status, assigneeId 컬럼 |
