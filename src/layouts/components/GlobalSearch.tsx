import { useMemo, useState } from 'react';
import { Modal, Input, List, Empty, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useRouteStore, type MenuNode } from '@/store/route';
import { staticMenus } from '@/router/menus';

interface FlatRoute {
  key: string;
  label: string;
  path: string;
  icon?: string;
}

function flattenMenus(nodes: MenuNode[], t: (k: string) => string, result: FlatRoute[] = []): FlatRoute[] {
  for (const node of nodes) {
    if (node.path) {
      result.push({ key: node.key, label: t(node.label), path: node.path, icon: node.icon });
    }
    if (node.children) flattenMenus(node.children, t, result);
  }
  return result;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { menus: dynamicMenus } = useRouteStore();
  const [keyword, setKeyword] = useState('');

  const menus = dynamicMenus.length > 0 ? dynamicMenus : staticMenus;
  const allRoutes = useMemo(() => flattenMenus(menus, t), [menus, t]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return allRoutes;
    const kw = keyword.toLowerCase();
    return allRoutes.filter(
      r => r.label.toLowerCase().includes(kw) || r.path.toLowerCase().includes(kw)
    );
  }, [allRoutes, keyword]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setKeyword('');
  };

  const handleClose = () => {
    onClose();
    setKeyword('');
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={null}
      closeIcon={null}
      width={520}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '16px 16px 8px' }}>
        <Input
          autoFocus
          size="large"
          placeholder={t('common.keywordSearch')}
          prefix={<Icon icon="mdi:magnify" width={18} style={{ color: 'var(--zb-text-3)' }} />}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          allowClear
          variant="filled"
        />
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto', padding: '4px 0 8px' }}>
        {filtered.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '24px 0' }} />
        ) : (
          <List
            dataSource={filtered}
            renderItem={item => (
              <List.Item
                onClick={() => handleSelect(item.path)}
                style={{ padding: '10px 16px', cursor: 'pointer' }}
              >
                <List.Item.Meta
                  avatar={
                    item.icon
                      ? <Icon icon={item.icon} width={20} style={{ color: 'var(--zb-accent)', marginTop: 2 }} />
                      : undefined
                  }
                  title={<span style={{ fontSize: 13 }}>{item.label}</span>}
                  description={<Typography.Text type="secondary" style={{ fontSize: 11 }}>{item.path}</Typography.Text>}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
}
