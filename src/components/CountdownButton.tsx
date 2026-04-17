import { useState, useRef, useEffect } from 'react';
import { Button, Popconfirm, message } from 'antd';
import type { ButtonProps } from 'antd';
import { isHandledError } from '@/service/request';

interface CountdownButtonProps {
  onConfirm: () => Promise<void> | void;
  title?: React.ReactNode;
  text?: React.ReactNode;
  countdown?: number;
  type?: ButtonProps['type'];
  danger?: boolean;
  size?: ButtonProps['size'];
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * 带倒计时的 Popconfirm 删除按钮：
 * 点击「删除」→ 弹出确认框 → 点击「确定」→ 倒计时 3s → 自动执行操作。
 * 倒计时期间可点「取消」中止。
 */
const CountdownButton: React.FC<CountdownButtonProps> = ({
  onConfirm,
  title = '确认删除？',
  text = '删除',
  countdown = 3,
  type = 'link',
  danger = true,
  size = 'small',
  icon,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const countingRef = useRef(false);
  const executingRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined; }
    countingRef.current = false;
  };

  const handleOk = () => {
    // 同步设置 ref，阻止 Popconfirm 的 onOpenChange(false) 关闭弹框
    countingRef.current = true;
    setRemaining(countdown);
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          // StrictMode 下 updater 函数会被调用两次，用 ref 防止重复执行
          if (!executingRef.current) {
            executingRef.current = true;
            setOpen(false);
            (async () => {
              try {
                await onConfirmRef.current();
              } catch (e: any) {
                if (!isHandledError(e)) message.error('操作失败');
              } finally {
                executingRef.current = false;
              }
            })();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    clearTimer();
    setRemaining(0);
    setOpen(false);
  };

  return (
    <Popconfirm
      open={open}
      onOpenChange={(v) => { if (!countingRef.current) setOpen(v); }}
      title={title}
      okText={remaining > 0 ? `确定(${remaining}s)` : '确定'}
      okButtonProps={{ disabled: remaining > 0 }}
      onConfirm={handleOk}
      onCancel={handleCancel}
    >
      <Button type={type} danger={danger} size={size} icon={icon} style={style}>{text}</Button>
    </Popconfirm>
  );
};

export default CountdownButton;
