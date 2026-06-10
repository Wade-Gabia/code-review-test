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
