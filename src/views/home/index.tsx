import { Row, Col } from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
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

const lineData = [
  { month: '1月', builds: 12, deploys: 8 },
  { month: '2月', builds: 19, deploys: 14 },
  { month: '3月', builds: 25, deploys: 20 },
  { month: '4月', builds: 18, deploys: 15 },
  { month: '5月', builds: 30, deploys: 26 },
  { month: '6月', builds: 28, deploys: 22 },
  { month: '7月', builds: 35, deploys: 30 }
];

const pieData = [
  { name: '成功', value: 86 },
  { name: '失败', value: 8 },
  { name: '进行中', value: 6 }
];

const PIE_COLORS = ['#22c55e', '#ef4444', '#f97316'];

const stats = [
  { title: '应用数量', value: 24, suffix: '个', accent: '#f97316', trend: 12, icon: <AppstoreOutlined /> },
  { title: '今日构建', value: 8,  suffix: '次', accent: '#22c55e', trend: 5,  icon: <ThunderboltOutlined /> },
  { title: '今日部署', value: 5,  suffix: '次', accent: '#fbbf24', trend: -2, icon: <CloudUploadOutlined /> },
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

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircleFilled style={{ color: '#22c55e', fontSize: 14 }} />;
    if (status === 'error') return <CloseCircleFilled style={{ color: '#ef4444', fontSize: 14 }} />;
    return <SyncOutlined spin style={{ color: '#f97316', fontSize: 14 }} />;
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
                    color: stat.trend > 0 ? '#22c55e' : '#ef4444',
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
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div className="zb-animate-in zb-delay-5" style={cardStyle}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zb-text-1)' }}>
                  {t('page.home.buildTrend', { defaultValue: '构建 / 部署趋势' })}
                </div>
                <div className="zb-section-label" style={{ marginTop: 4 }}>近 7 个月</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 3, borderRadius: 2, background: '#f97316' }} />
                  <span style={{ fontSize: 11, color: 'var(--zb-text-2)', fontFamily: 'var(--zb-font-mono)' }}>构建</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 3, borderRadius: 2, background: '#22c55e' }} />
                  <span style={{ fontSize: 11, color: 'var(--zb-text-2)', fontFamily: 'var(--zb-font-mono)' }}>部署</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="gradBuilds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDeploys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--zb-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--zb-text-3)', fontSize: 11, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--zb-text-3)', fontSize: 11, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: 'var(--zb-border)', strokeDasharray: '4 4' }} />
                <Area
                  type="monotone" dataKey="builds"
                  name={t('page.home.builds', { defaultValue: '构建次数' })}
                  stroke="#f97316" strokeWidth={2}
                  fill="url(#gradBuilds)"
                  dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#f97316', stroke: 'rgba(249,115,22,0.3)', strokeWidth: 4 }}
                />
                <Area
                  type="monotone" dataKey="deploys"
                  name={t('page.home.deploys', { defaultValue: '部署次数' })}
                  stroke="#22c55e" strokeWidth={2}
                  fill="url(#gradDeploys)"
                  dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#22c55e', stroke: 'rgba(34,197,94,0.3)', strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="zb-animate-in zb-delay-6" style={{ ...cardStyle, height: '100%' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zb-text-1)' }}>
                {t('page.home.deployStatus', { defaultValue: '部署状态分布' })}
              </div>
              <div className="zb-section-label" style={{ marginTop: 4 }}>累计统计</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={58} outerRadius={82}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            {/* Inline legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 4 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: PIE_COLORS[i],
                    boxShadow: `0 0 6px ${PIE_COLORS[i]}40`,
                  }} />
                  <span className="zb-num" style={{ fontSize: 11, color: 'var(--zb-text-2)' }}>
                    {d.name}
                    <span style={{ marginLeft: 4, color: 'var(--zb-text-3)' }}>{d.value}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

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
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--zb-border)')}
                >
                  <div className={`zb-dot ${svc.status === 'online' ? 'zb-dot-green' : 'zb-dot-orange'}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--zb-text-1)' }}>{svc.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="zb-num" style={{ fontSize: 13, fontWeight: 600, color: svc.status === 'online' ? '#22c55e' : '#f97316' }}>
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
