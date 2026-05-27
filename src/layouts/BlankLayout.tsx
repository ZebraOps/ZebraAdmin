import { Outlet } from 'react-router';

export default function BlankLayout() {
  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
}
