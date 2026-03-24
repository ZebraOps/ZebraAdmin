import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Page403() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center">
      <Result
        status="403"
        subTitle={t('page.403.subTitle', { defaultValue: '抱歉，您没有访问该页面的权限' })}
        extra={
          <Button type="primary" onClick={() => navigate('/home')}>
            {t('common.backToHome', { defaultValue: '返回首页' })}
          </Button>
        }
      />
    </div>
  );
}
