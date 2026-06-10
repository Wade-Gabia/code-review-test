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
