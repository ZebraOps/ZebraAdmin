import { Col, Row } from 'antd';
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

const PIE_COLORS = ['#10b981', '#ef4444', '#14b8a6'];

interface Props {
	cardStyle: React.CSSProperties;
	chartTooltipStyle: React.CSSProperties;
}

export default function HomeCharts({ cardStyle, chartTooltipStyle }: Props) {
	const { t } = useTranslation();

	return (
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
								<div style={{ width: 10, height: 3, borderRadius: 2, background: '#14b8a6' }} />
								<span style={{ fontSize: 11, color: 'var(--zb-text-2)', fontFamily: 'var(--zb-font-mono)' }}>构建</span>
							</div>
							<div className="flex items-center gap-1.5">
								<div style={{ width: 10, height: 3, borderRadius: 2, background: '#10b981' }} />
								<span style={{ fontSize: 11, color: 'var(--zb-text-2)', fontFamily: 'var(--zb-font-mono)' }}>部署</span>
							</div>
						</div>
					</div>
					<ResponsiveContainer width="100%" height={260}>
						<AreaChart data={lineData}>
							<defs>
								<linearGradient id="gradBuilds" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#14b8a6" stopOpacity={0.2} />
									<stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="gradDeploys" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
									<stop offset="100%" stopColor="#10b981" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--zb-border)" vertical={false} />
							<XAxis dataKey="month" tick={{ fill: 'var(--zb-text-3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
							<YAxis tick={{ fill: 'var(--zb-text-3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
							<Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: 'var(--zb-border)', strokeDasharray: '4 4' }} />
							<Area
								type="monotone" dataKey="builds"
								name={t('page.home.builds', { defaultValue: '构建次数' })}
								stroke="#14b8a6" strokeWidth={2}
								fill="url(#gradBuilds)"
								dot={{ r: 3, fill: '#14b8a6', strokeWidth: 0 }}
								activeDot={{ r: 5, fill: '#14b8a6', stroke: 'rgba(20,184,166,0.3)', strokeWidth: 4 }}
							/>
							<Area
								type="monotone" dataKey="deploys"
								name={t('page.home.deploys', { defaultValue: '部署次数' })}
								stroke="#10b981" strokeWidth={2}
								fill="url(#gradDeploys)"
								dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
								activeDot={{ r: 5, fill: '#10b981', stroke: 'rgba(16,185,129,0.3)', strokeWidth: 4 }}
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
	);
}