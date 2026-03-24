import { StatisticCard } from '@ant-design/pro-components';
import { Row, Col } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';

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

const PIE_COLORS = ['#f97316', '#fbbf24', '#ef4444'];

const stats = [
  { title: '应用数量', value: 24, suffix: '个', accent: '#f97316', trend: 12 },
  { title: '今日构建', value: 8,  suffix: '次', accent: '#22c55e', trend: 5  },
  { title: '今日部署', value: 5,  suffix: '次', accent: '#fbbf24', trend: -2 },
  { title: '告警数量', value: 2,  suffix: '个', accent: '#ef4444', trend: -1 }
];

export default function HomePage() {
  const { t } = useTranslation();

  const cardStyle = {
    background: 'var(--zb-surface)',
    border: '1px solid var(--zb-border)',
    borderRadius: 'var(--zb-r)',
    padding: '20px 24px',
  };

  const chartTooltipStyle = {
    background: 'var(--zb-surface)',
    border: '1px solid var(--zb-border)',
    borderRadius: 'var(--zb-r-sm)',
    color: 'var(--zb-text-1)',
    fontSize: 12
  };

  return (
    <div className="zb-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats row */}
      <Row gutter={[16, 16]}>
        {stats.map((stat) => (
          <Col key={stat.title} xs={24} sm={12} lg={6}>
            <StatisticCard
              statistic={{
                title: stat.title,
                value: stat.value,
                suffix: stat.suffix,
                valueStyle: { color: stat.accent, fontWeight: 700, fontSize: 32 },
                trend: stat.trend > 0 ? 'up' : 'down',
                description: (
                  <StatisticCard.Statistic
                    title="较昨日"
                    value={Math.abs(stat.trend)}
                    valueStyle={{ fontSize: 12, color: stat.trend > 0 ? '#22c55e' : '#ef4444' }}
                    suffix={stat.trend > 0 ? '↑' : '↓'}
                  />
                ),
              }}
              style={{ background: 'var(--zb-surface)', border: '1px solid var(--zb-border)', borderRadius: 'var(--zb-r)' }}
            />
          </Col>
        ))}
      </Row>

      {/* Charts row */}
      <Row gutter={[16, 16]}>
        {/* Line chart */}
        <Col xs={24} lg={16}>
          <div style={cardStyle}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--zb-text-1)' }}>
                  {t('page.home.buildTrend', { defaultValue: '构建 / 部署趋势' })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--zb-text-3)', marginTop: 2 }}>近 7 个月</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f97316' }} />
                  <span style={{ fontSize: 11, color: 'var(--zb-text-2)' }}>构建</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} />
                  <span style={{ fontSize: 11, color: 'var(--zb-text-2)' }}>部署</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--zb-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--zb-text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--zb-text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: 'var(--zb-border)' }} />
                <Line
                  type="monotone" dataKey="builds"
                  name={t('page.home.builds', { defaultValue: '构建次数' })}
                  stroke="#f97316" strokeWidth={2}
                  dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#f97316' }}
                />
                <Line
                  type="monotone" dataKey="deploys"
                  name={t('page.home.deploys', { defaultValue: '部署次数' })}
                  stroke="#22c55e" strokeWidth={2}
                  dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Pie chart */}
        <Col xs={24} lg={8}>
          <div style={{ ...cardStyle, height: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--zb-text-1)' }}>
                {t('page.home.deployStatus', { defaultValue: '部署状态分布' })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--zb-text-3)', marginTop: 2 }}>累计统计</div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={62} outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: 'var(--zb-text-2)' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>
    </div>
  );
}
