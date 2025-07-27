import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm, formatDate } from '../store/crmStore';
import { Deal, Tag } from '../types';
import { CalendarIcon, UsersIcon } from '../components/Icons';
import GlobalSearch from '../components/GlobalSearch';

const ProductionDealCard: React.FC<{ deal: Deal, tagColorClass: string }> = ({ deal, tagColorClass }) => {
  const { getUserById } = useCrm();
  const navigate = useNavigate();
  const assignedUser = deal.assignedUserId ? getUserById(deal.assignedUserId) : undefined;

  const handleClick = () => {
    navigate(`/deals/${deal.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white p-4 rounded-lg shadow-sm mb-3 cursor-pointer border-t-4 ${tagColorClass}`}
    >
      <h4 className="font-bold text-slate-800">{deal.title}</h4>
      <div className="mt-2 space-y-2 text-sm">
        {assignedUser && (
           <div className="flex items-center text-slate-600">
             <span className="bg-slate-200 text-slate-600 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2">
               {assignedUser.name.charAt(0)}
             </span>
             <span>{assignedUser.name}</span>
           </div>
        )}
        {deal.deliveryDate && (
            <div className="flex items-center text-slate-500">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{formatDate(deal.deliveryDate)}</span>
            </div>
        )}
      </div>
    </div>
  );
};

const TagColumn: React.FC<{ tag: Tag; deals: Deal[] }> = ({ tag, deals }) => {
  const headerColorClass = tag.color.replace('bg-', 'border-t-');

  return (
    <div className="w-80 flex-shrink-0">
      <div className="rounded-lg p-2 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 p-2">
          <h3 className="font-semibold text-slate-700">{tag.name}</h3>
          <span className="text-sm bg-slate-200 text-slate-600 font-medium px-2 py-1 rounded-full">{deals.length}</span>
        </div>
        <div className="overflow-y-auto h-full min-h-[50vh] px-1">
          {deals.map(deal => (
            <ProductionDealCard key={`${tag.id}-${deal.id}`} deal={deal} tagColorClass={headerColorClass} />
          ))}
        </div>
      </div>
    </div>
  );
};


const ProductionPage: React.FC = () => {
  const { deals, tags } = useCrm();

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <header className="flex-shrink-0 p-8 pb-4 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-slate-800">Producción</h2>
        </div>
        <GlobalSearch />
      </header>
      <div className="flex-1 overflow-x-auto px-8 pb-4">
        <div className="inline-flex space-x-4 h-full">
          {tags.map(tag => {
            const dealsForTag = deals
              .filter(deal => deal.tagIds.includes(tag.id))
              .sort((a, b) => {
                const timeA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity;
                const timeB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity;
                return timeA - timeB;
              });
              
            return (
              <TagColumn
                key={tag.id}
                tag={tag}
                deals={dealsForTag}
              />
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;