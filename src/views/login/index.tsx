import { ProForm, ProFormText } from '@ant-design/pro-components';
import { Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, BulbOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';
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

      {/* Amber glow orb */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: '2%', left: '50%', transform: 'translateX(-50%)',
          width: 640, height: 320,
          background: 'radial-gradient(ellipse, rgba(249,115,22,.12) 0%, transparent 70%)',
          pointerEvents: 'none'
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
        className="zb-animate-in"
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
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 8,
              background: '#f97316',
              boxShadow: '0 6px 20px rgba(249,115,22,.4)',
              fontFamily: 'var(--zb-font-mono)',
              fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px',
              marginBottom: 14,
            }}
          >
            ZB
          </div>
          <h1 style={{
            margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '0.08em',
            fontFamily: 'var(--zb-font-mono)',
            color: isDark ? '#f0f0f0' : '#111',
            textTransform: 'uppercase',
          }}>
            ZEBRAOPS
          </h1>
          <p style={{
            margin: '6px 0 0', fontSize: 11,
            fontFamily: 'var(--zb-font-mono)',
            color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)',
            letterSpacing: '0.04em',
          }}>
            {t('page.login.welcomeBack', { defaultValue: 'SIGN IN TO YOUR ACCOUNT' })}
          </p>
        </div>

        {/* Form */}
        <ProForm<LoginFormValues>
          submitter={{
            render: (_, dom) => dom[1],
            submitButtonProps: {
              type: 'primary',
              size: 'large',
              loading,
              block: true,
              style: {
                borderRadius: 6, height: 42,
                fontFamily: 'var(--zb-font-mono)', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.08em',
                background: '#f97316',
                border: 'none',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(249,115,22,.35)',
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
  );
}
