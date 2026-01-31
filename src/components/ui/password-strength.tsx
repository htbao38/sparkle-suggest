import { cn } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/validations';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const maxScore = 6;
  const percentage = (strength.score / maxScore) * 100;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Độ mạnh mật khẩu</span>
        <span className={cn(
          strength.score <= 2 && 'text-red-500',
          strength.score > 2 && strength.score <= 4 && 'text-yellow-500',
          strength.score > 4 && 'text-green-500',
        )}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', strength.color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
        <li className={cn(password.length >= 8 && 'text-green-600')}>
          {password.length >= 8 ? '✓' : '○'} Ít nhất 8 ký tự
        </li>
        <li className={cn(/[a-z]/.test(password) && 'text-green-600')}>
          {/[a-z]/.test(password) ? '✓' : '○'} Có chữ thường (a-z)
        </li>
        <li className={cn(/[A-Z]/.test(password) && 'text-green-600')}>
          {/[A-Z]/.test(password) ? '✓' : '○'} Có chữ hoa (A-Z)
        </li>
        <li className={cn(/[0-9]/.test(password) && 'text-green-600')}>
          {/[0-9]/.test(password) ? '✓' : '○'} Có số (0-9)
        </li>
      </ul>
    </div>
  );
}
