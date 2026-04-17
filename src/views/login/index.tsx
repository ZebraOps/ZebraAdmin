import { ProForm, ProFormText } from '@ant-design/pro-components';
import { Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, BulbOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/auth';
import { useState, useRef } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useThemeStore } from '@/store/theme';

interface LoginFormValues {
  userName: string;
  password: string;
  remember?: boolean;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { themeScheme, setThemeScheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const isDark = themeScheme === 'dark';
  const formRef = useRef<ProFormInstance>();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    const success = await login(values.userName, values.password);
    setLoading(false);
    if (success) {
      message.success(t('page.login.loginSuccess', { defaultValue: '登录成功' }));
      navigate('/home', { replace: true });
    } else {
      message.error(t('page.login.loginFailed', { defaultValue: '登录失败，请检查用户名和密码' }));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#0a0a0a' : '#f4f4f5',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--zb-font-sans)',
      }}
    >
      {/* Grid texture */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.04)'} 1px, transparent 1px),
                            linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.04)'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Amber glow orb — floating */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: '0%', left: '50%', transform: 'translateX(-50%)',
          width: 640, height: 360,
          background: 'radial-gradient(ellipse, rgba(249,115,22,.14) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'zb-float 6s ease-in-out infinite',
        }}
      />

      {/* Secondary glow — bottom right */}
      <div
        aria-hidden
        style={{
          position: 'absolute', bottom: '-10%', right: '10%',
          width: 400, height: 300,
          background: 'radial-gradient(ellipse, rgba(251,191,36,.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'zb-float 8s ease-in-out infinite 2s',
        }}
      />

      {/* Theme toggle */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <Button
          type="text"
          icon={<BulbOutlined />}
          onClick={() => setThemeScheme(isDark ? 'light' : 'dark')}
          style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)', borderRadius: 6 }}
        />
      </div>

      {/* Card */}
      <div
        className="zb-animate-blur"
        style={{
          width: '100%', maxWidth: 400, margin: '0 16px',
          background: isDark ? 'rgba(17,17,17,0.92)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'}`,
          borderRadius: 12,
          boxShadow: isDark
            ? '0 0 0 1px rgba(249,115,22,.08), 0 24px 48px rgba(0,0,0,.6)'
            : '0 24px 48px rgba(0,0,0,.08)',
          padding: '40px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Noise overlay */}
        <div className="zb-noise" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Top accent stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #f97316, transparent)',
          opacity: 0.6,
        }} />
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
          <div
            className="zb-animate-scale zb-pulse-glow"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: 10,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              boxShadow: '0 6px 24px rgba(249,115,22,.45)',
              fontFamily: 'var(--zb-font-mono)',
              fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px',
              marginBottom: 16,
            }}
          >
            ZB
          </div>
          <h1 className="zb-animate-in zb-delay-1" style={{
            margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em',
            fontFamily: 'var(--zb-font-mono)',
            color: isDark ? '#f0f0f0' : '#111',
            textTransform: 'uppercase',
          }}>
            ZEBRAOPS
          </h1>
          <p className="zb-animate-in zb-delay-2" style={{
            margin: '8px 0 0', fontSize: 11,
            fontFamily: 'var(--zb-font-mono)',
            color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)',
            letterSpacing: '0.12em',
          }}>
            {t('page.login.welcomeBack', { defaultValue: 'SIGN IN TO YOUR ACCOUNT' })}
          </p>
        </div>

        {/* Form */}
        <div className="zb-animate-in zb-delay-3">
        <ProForm<LoginFormValues>
          formRef={formRef}
          submitter={{
            render: (_, dom) => dom[1],
            submitButtonProps: {
              type: 'primary',
              size: 'large',
              loading,
              block: true,
              className: 'zb-btn-glow',
              style: {
                borderRadius: 8, height: 44,
                fontFamily: 'var(--zb-font-mono)', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.1em',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(249,115,22,.35)',
                transition: 'all 200ms ease',
              },
              children: t('page.login.login', { defaultValue: 'SIGN IN' }),
            },
          }}
          onFinish={handleSubmit}
        >
          <ProFormText
            name="userName"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined style={{ color: '#f97316' }} />,
              style: { borderRadius: 6, fontFamily: 'var(--zb-font-mono)', fontSize: 13 },
              onPressEnter: () => formRef.current?.submit(),
            }}
            placeholder={t('page.login.usernamePlaceholder', { defaultValue: '请输入用户名' })}
            rules={[{ required: true, message: t('page.login.usernameRequired', { defaultValue: '请输入用户名' }) }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined style={{ color: '#f97316' }} />,
              style: { borderRadius: 6, fontFamily: 'var(--zb-font-mono)', fontSize: 13 },
              onPressEnter: () => formRef.current?.submit(),
            }}
            placeholder={t('page.login.passwordPlaceholder', { defaultValue: '请输入密码' })}
            rules={[{ required: true, message: t('page.login.passwordRequired', { defaultValue: '请输入密码' }) }]}
          />
          <div style={{ marginBottom: 16 }}>
            <Checkbox
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ fontFamily: 'var(--zb-font-mono)', fontSize: 11, color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' }}
            >
              {t('page.login.rememberMe', { defaultValue: '记住我' })}
            </Checkbox>
          </div>
        </ProForm>
        </div>
      </div>
    </div>
  );
}
