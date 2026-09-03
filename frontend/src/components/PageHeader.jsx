import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function PageHeader({ title, sub, rightText }) {
  const { user } = useContext(AuthContext);
  
  // Use the explicitly provided rightText, or fallback to the logged in user's role
  const badgeText = rightText || user?.role;

  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight m-0 mb-1">{title}</h1>
        <div className="text-muted text-sm">{sub}</div>
      </div>
      {badgeText && <div className="text-muted text-sm px-3 py-1 bg-neutral-100 rounded-full font-medium">{badgeText}</div>}
    </div>
  );
}

export default PageHeader;
