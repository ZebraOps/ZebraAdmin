import { lazy, startTransition, Suspense, useEffect, useState } from 'react';
import { Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  AppstoreOutlined,
  ThunderboltOutlined,
  CloudUploadOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SyncOutlined,
} from '@ant-design/icons';

const HomeCharts = lazy(() => import('./components/HomeCharts'));

const stats = [
  { title: '应用数量', value: 24, suffix: '个', accent: '#14b8a6', trend: 12, icon: <AppstoreOutlined /> },
  { title: '今日构建', value: 8,  suffix: '次', accent: '#10b981', trend: 5,  icon: <ThunderboltOutlined /> },
  { title: '今日部署', value: 5,  suffix: '次', accent: '#6366f1', trend: -2, icon: <CloudUploadOutlined /> },
  { title: '告警数量', value: 2,  suffix: '个', accent: '#ef4444', trend: -1, icon: <AlertOutlined /> }
];

const activities = [
  { time: '2 分钟前', action: '部署成功', target: 'zebra-gateway', env: 'production', status: 'success' },
  { time: '18 分钟前', action: '构建失败', target: 'zebra-admin', env: 'staging', status: 'error' },
  { time: '45 分钟前', action: '构建中', target: 'zebra-rbac', env: 'dev', status: 'running' },
  { time: '1 小时前', action: '部署成功', target: 'zebra-cicd', env: 'production', status: 'success' },
  { time: '2 小时前', action: '部署成功', target: 'zebra-ui', env: 'staging', status: 'success' },
];

const services = [
  { name: 'API Gateway', status: 'online', uptime: '99.97%' },
  { name: 'RBAC Service', status: 'online', uptime: '99.99%' },
  { name: 'CI/CD Engine', status: 'online', uptime: '99.95%' },
  { name: 'Registry', status: 'degraded', uptime: '98.72%' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setShowCharts(true);
    });
  }, []);

  const cardStyle: React.CSSProperties = {
    background: 'var(--zb-surface)',
    border: '1px solid var(--zb-border)',
    borderRadius: 'var(--zb-r)',
    padding: '20px 24px',
    position: 'relative',
    overflow: 'hidden',
  };

  const chartTooltipStyle = {
    background: 'var(--zb-surface)',
    border: '1px solid var(--zb-border)',
    borderRadius: 'var(--zb-r-sm)',
    color: 'var(--zb-text-1)',
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  };

  const chartsFallback = (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <div className="zb-animate-in zb-delay-5" style={{ ...cardStyle, minHeight: 332 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zb-text-1)' }}>
              {t('page.home.buildTrend', { defaultValue: '构建 / 部署趋势' })}
            </div>
            <div className="zb-section-label" style={{ marginTop: 4 }}>LOADING CHARTS</div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ height: 220, borderRadius: 'var(--zb-r)', background: 'var(--zb-surface2)' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 72, height: 10, borderRadius: 999, background: 'var(--zb-surface2)' }} />
              <div style={{ width: 72, height: 10, borderRadius: 999, background: 'var(--zb-surface2)' }} />
            </div>
          </div>
        </div>
      </Col>
      <Col xs={24} lg={8}>
        <div className="zb-animate-in zb-delay-6" style={{ ...cardStyle, minHeight: 332 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zb-text-1)' }}>
              {t('page.home.deployStatus', { defaultValue: '部署状态分布' })}
            </div>
            <div className="zb-section-label" style={{ marginTop: 4 }}>LOADING CHARTS</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            <div style={{ width: 168, height: 168, borderRadius: '50%', background: 'var(--zb-surface2)' }} />
          </div>
        </div>
      </Col>
    </Row>
  );

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircleFilled style={{ color: '#10b981', fontSize: 14 }} />;
    if (status === 'error') return <CloseCircleFilled style={{ color: '#ef4444', fontSize: 14 }} />;
    return <SyncOutlined spin style={{ color: '#14b8a6', fontSize: 14 }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Stats Row ─────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        {stats.map((stat, idx) => (
          <Col key={stat.title} xs={24} sm={12} lg={6}>
            <div
              className={`zb-card-lift zb-accent-top zb-animate-in zb-delay-${idx + 1}`}
              style={{
                ...cardStyle,
                cursor: 'default',
              }}
            >
              {/* Ambient glow */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: stat.accent, opacity: 0.06, filter: 'blur(20px)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                <div>
                  <div className="zb-section-label" style={{ marginBottom: 8 }}>{stat.title}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span className="zb-num" style={{
                      fontSize: 36, fontWeight: 700, color: stat.accent,
                      lineHeight: 1, letterSpacing: '-0.04em',
                    }}>
                      {stat.value}
                    </span>
                    <span style={{
                      fontFamily: 'var(--zb-font-mono)', fontSize: 11,
                      color: 'var(--zb-text-3)', fontWeight: 500,
                    }}>{stat.suffix}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    marginTop: 8, fontSize: 11, fontFamily: 'var(--zb-font-mono)',
                    color: stat.trend > 0 ? '#10b981' : '#ef4444',
                  }}>
                    <span>{stat.trend > 0 ? '▲' : '▼'} {Math.abs(stat.trend)}</span>
                    <span style={{ color: 'var(--zb-text-3)' }}>较昨日</span>
                  </div>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: stat.accent,
                  background: `color-mix(in srgb, ${stat.accent} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stat.accent} 15%, transparent)`,
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Charts Row ────────────────────────────────────────── */}
      {showCharts ? (
        <Suspense fallback={chartsFallback}>
          <HomeCharts cardStyle={cardStyle} chartTooltipStyle={chartTooltipStyle} />
        </Suspense>
      ) : chartsFallback}

      {/* ── Activity + Services Row ───────────────────────────── */}
      <Row gutter={[16, 16]}>
        {/* Recent Activity */}
        <Col xs={24} lg={14}>
          <div className="zb-animate-in zb-delay-7" style={cardStyle}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zb-text-1)' }}>最近活动</div>
                <div className="zb-section-label" style={{ marginTop: 4 }}>RECENT ACTIVITY</div>
              </div>
              <ClockCircleOutlined style={{ color: 'var(--zb-text-3)', fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activities.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: idx < activities.length - 1 ? '1px solid var(--zb-border)' : 'none',
                  }}
                >
                  {statusIcon(act.status)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--zb-text-1)' }}>{act.action}</span>
                      <span className="zb-badge zb-badge-orange" style={{ fontSize: 9 }}>{act.env}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--zb-text-3)', fontFamily: 'var(--zb-font-mono)', marginTop: 2 }}>
                      {act.target}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--zb-text-3)', fontFamily: 'var(--zb-font-mono)', whiteSpace: 'nowrap' }}>
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Service Health */}
        <Col xs={24} lg={10}>
          <div className="zb-animate-in zb-delay-8" style={{ ...cardStyle, height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zb-text-1)' }}>服务状态</div>
              <div className="zb-section-label" style={{ marginTop: 4 }}>SERVICE HEALTH</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {services.map((svc) => (
                <div
                  key={svc.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    borderRadius: 'var(--zb-r-sm)',
                    background: 'var(--zb-surface2)',
                    border: '1px solid var(--zb-border)',
                    transition: 'border-color 200ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(20,184,166,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--zb-border)')}
                >
                  <div className={`zb-dot ${svc.status === 'online' ? 'zb-dot-green' : 'zb-dot-teal'}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--zb-text-1)' }}>{svc.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="zb-num" style={{ fontSize: 13, fontWeight: 600, color: svc.status === 'online' ? '#10b981' : '#14b8a6' }}>
                      {svc.uptime}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--zb-text-3)', fontFamily: 'var(--zb-font-mono)', textTransform: 'uppercase' }}>
                      {svc.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
