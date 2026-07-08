import { ProForm, ProFormText } from '@ant-design/pro-components';
import { Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, BulbOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/auth';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useThemeStore } from '@/store/theme';
import './login.css';

interface LoginFormValues {
  userName: string;
  password: string;
  remember?: boolean;
}

type LoginStage = 'idle' | 'authenticating' | 'success' | 'error';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { themeScheme, setThemeScheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginStage, setLoginStage] = useState<LoginStage>('idle');
  const isDark = themeScheme === 'dark';
  const formRef = useRef<ProFormInstance>(null);

  // ── Capability carousel state ──────────────────────────────
  const capabilities = useMemo(() => [
    { keyword: t('page.login.capabilities.automation'),    desc: t('page.login.capabilities.automationDesc') },
    { keyword: t('page.login.capabilities.observability'), desc: t('page.login.capabilities.observabilityDesc') },
    { keyword: t('page.login.capabilities.intelligence'),  desc: t('page.login.capabilities.intelligenceDesc') },
  ], [t]);

  const [carouselIdx, setCarouselIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [charIdx, setCharIdx] = useState(0);

  // ── Grid parallax — mouse offset drives background-position ────
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    // Map to [-20, 20] px offset — subtle parallax
    const x = ((clientX - cx) / cx) * 20;
    const y = ((clientY - cy) / cy) * 20;
    setGridOffset({ x, y });
  }, []);

  // ── Typewriter carousel effect ──────────────────────────────
  useEffect(() => {
    const current = capabilities[carouselIdx];
    if (!current) return;
    let timer: ReturnType<typeof window.setTimeout>;

    if (isTyping) {
      if (charIdx < current.keyword.length) {
        timer = setTimeout(() => {
          setDisplayText(current.keyword.slice(0, charIdx + 1));
          setCharIdx(charIdx + 1);
        }, 80);
      } else {
        timer = setTimeout(() => setIsTyping(false), 2200);
      }
    } else {
      if (charIdx > 0) {
        timer = setTimeout(() => {
          setDisplayText(current.keyword.slice(0, charIdx - 1));
          setCharIdx(charIdx - 1);
        }, 40);
      } else {
        timer = setTimeout(() => {
          setCarouselIdx((prev) => (prev + 1) % capabilities.length);
          setIsTyping(true);
          setCharIdx(0);
        }, 60);
      }
    }

    return () => clearTimeout(timer);
  }, [charIdx, isTyping, carouselIdx, capabilities]);

  // ── Login handler with state machine ────────────────────────
  const handleSubmit = async (values: LoginFormValues) => {
    setLoginStage('authenticating');
    setLoading(true);

    const success = await login(values.userName, values.password);
    setLoading(false);

    if (success) {
      setLoginStage('success');
      message.success(t('page.login.loginSuccess'));
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 800);
    } else {
      setLoginStage('error');
      message.error(t('page.login.loginFailed'));
      setTimeout(() => setLoginStage('idle'), 600);
    }
  };

  // ── Dynamic button content ─────────────────────────────────
  const buttonContent = (() => {
    switch (loginStage) {
      case 'authenticating':
        return (
          <>
            {t('page.login.authenticating')}
            <span className="zb-login-carousel-cursor" />
          </>
        );
      case 'success':
        return (
          <span className="zb-success-pop" style={{ display: 'inline-block' }}>
            ✓ {t('page.login.authSuccess')}
          </span>
        );
      case 'error':
      default:
        return t('page.login.login');
    }
  })();

  const buttonClass = [
    'zb-login-submit',
    loginStage === 'authenticating' && 'zb-login-submit--loading',
    loginStage === 'success' && 'zb-login-submit--success',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="zb-login-shell" onMouseMove={handleMouseMove}>
      {/* Grid — follows mouse with parallax */}
      <div
        className="zb-login-grid"
        style={{
          backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
        }}
      />

      {/* Theme toggle */}
      <div className="zb-login-theme-toggle">
        <Button
          type="text"
          icon={<BulbOutlined />}
          onClick={() => setThemeScheme(isDark ? 'light' : 'dark')}
        />
      </div>

      {/* Card */}
      <div className="zb-login-card zb-animate-blur">
        <div className="zb-noise" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Logo section */}
        <div className="zb-login-logo">
          <div className="zb-login-logo-block zb-animate-scale zb-pulse-glow">ZB</div>
          <h1 className="zb-login-title zb-animate-in zb-delay-1">ZEBRAOPS</h1>
          <p className="zb-login-tagline zb-animate-in zb-delay-2">
            {t('page.login.tagline')}
          </p>
        </div>

        {/* Capability carousel */}
        <div className="zb-login-carousel zb-animate-in zb-delay-3">
          <div className="zb-login-carousel-keyword">
            {displayText || capabilities[carouselIdx]?.keyword?.charAt(0)}
            <span className="zb-login-carousel-cursor" />
          </div>
          <div className="zb-login-carousel-desc" key={carouselIdx}>
            {capabilities[carouselIdx]?.desc}
          </div>
        </div>

        {/* Form */}
        <div className="zb-animate-in zb-delay-4">
          <ProForm<LoginFormValues>
            formRef={formRef}
            submitter={{
              render: (_, dom) => dom[1],
              submitButtonProps: {
                type: 'primary',
                size: 'large',
                loading,
                block: true,
                disabled: loginStage === 'success',
                className: buttonClass,
                style: {
                  border: 'none',
                  boxShadow: loginStage === 'authenticating' ? 'none' : undefined,
                },
                children: buttonContent,
              },
            }}
            onFinish={handleSubmit}
          >
            <ProFormText
              name="userName"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined style={{ color: 'var(--zb-accent)' }} />,
                className: 'zb-login-input',
                onPressEnter: () => formRef.current?.submit(),
              }}
              placeholder={t('page.login.usernamePlaceholder')}
              rules={[{ required: true, message: t('page.login.usernameRequired') }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined style={{ color: 'var(--zb-accent)' }} />,
                className: 'zb-login-input',
                onPressEnter: () => formRef.current?.submit(),
              }}
              placeholder={t('page.login.passwordPlaceholder')}
              rules={[{ required: true, message: t('page.login.passwordRequired') }]}
            />
            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{
                  fontFamily: 'var(--zb-font-mono)',
                  fontSize: 11,
                  color: 'var(--zb-text-3)',
                }}
              >
                {t('page.login.rememberMe')}
              </Checkbox>
            </div>
          </ProForm>
        </div>
      </div>
    </div>
  );
}
