import { Drawer, Space, Typography, Divider, Segmented, ColorPicker } from 'antd';
import { SunOutlined, MoonOutlined, LaptopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Color } from 'antd/es/color-picker';
import { useThemeStore } from '@/store/theme';
import { useAppStore } from '@/store/app';

const PRESET_COLORS = [
  '#165DFF',
  '#0FC6C2',
  '#7B61FF',
  '#10B981',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#EAB308',
];

export default function ThemeDrawer() {
  const { t } = useTranslation();
  const { themeScheme, primaryColor, setThemeScheme, setPrimaryColor } = useThemeStore();
  const { themeDrawerVisible, closeThemeDrawer } = useAppStore();

  const handleColorChange = (_: Color, hex: string) => {
    setPrimaryColor(hex);
  };

  const schemeOptions = [
    { label: <Space size={4}><SunOutlined />{t('theme.light')}</Space>, value: 'light' },
    { label: <Space size={4}><MoonOutlined />{t('theme.dark')}</Space>, value: 'dark' },
    { label: <Space size={4}><LaptopOutlined />{t('theme.auto')}</Space>, value: 'auto' },
  ];

  return (
    <Drawer
      title={t('icon.themeConfig')}
      open={themeDrawerVisible}
      onClose={closeThemeDrawer}
      width={300}
      placement="right"
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        {/* Color Scheme */}
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('icon.themeSchema')}
          </Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Segmented
              options={schemeOptions}
              value={themeScheme}
              onChange={(val) => setThemeScheme(val as 'light' | 'dark' | 'auto')}
              block
            />
          </div>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Primary Color */}
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('theme.primaryColor')}
          </Typography.Text>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((color) => (
              <div
                key={color}
                onClick={() => setPrimaryColor(color)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  background: color,
                  cursor: 'pointer',
                  outline: primaryColor === color ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: 2,
                  transition: 'outline 0.15s',
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <ColorPicker
              value={primaryColor}
              onChange={handleColorChange}
              showText
              size="small"
            />
          </div>
        </div>
      </Space>
    </Drawer>
  );
}
