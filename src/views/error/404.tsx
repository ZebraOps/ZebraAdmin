import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Page404() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center">
      <Result
        status="404"
        subTitle={t('page.404.subTitle', { defaultValue: '抱歉，您访问的页面不存在' })}
        extra={
          <Button type="primary" onClick={() => navigate('/home')}>
            {t('common.backToHome', { defaultValue: '返回首页' })}
          </Button>
        }
      />
    </div>
  );
}
