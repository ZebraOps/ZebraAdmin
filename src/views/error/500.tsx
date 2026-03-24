import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Page500() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center">
      <Result
        status="500"
        subTitle={t('page.500.subTitle', { defaultValue: '抱歉，服务器出错了' })}
        extra={
          <Button type="primary" onClick={() => navigate('/home')}>
            {t('common.backToHome', { defaultValue: '返回首页' })}
          </Button>
        }
      />
    </div>
  );
}
