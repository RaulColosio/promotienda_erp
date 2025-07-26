import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm, formatDate } from '../store/crmStore';
import { Deal, DealStage, Contact } from '../types';
import { PlusIcon, UsersIcon, ChevronLeftIcon, ChevronDownIcon, CalendarIcon } from '../components/Icons';
import ProductionTypeModal from '../components/ProductionTypeModal';
import GlobalSearch from '../components/GlobalSearch';
import SetDeliveryDateModal from '../components/SetDeliveryDateModal';

const STAGE_COLORS: Record<DealStage, string> = {
  [DealStage.NEW]: 'border-t-slate-400',
  [DealStage.CONTACTED]: 'border-t-blue-400',
  [DealStage.REVIEW]: 'border-t-yellow-400',
  [DealStage.APPROVED]: 'border-t-cyan-400',
  [DealStage.MATERIAL_PURCHASE]: 'border-t-orange-400',
  [DealStage.IN_TRANSIT]: 'border-t-lime-400',
  [DealStage.PRODUCTION]: 'border-t-indigo-400',
  [DealStage.EXTERNAL_WORKSHOP]: 'border-t-violet-400',
  [DealStage.READY_LOCAL]: 'border-t-purple-400',
  [DealStage.AWAITING_PAYMENT]: 'border-t-pink-400',
  [DealStage.READY_FOR_DELIVERY]: 'border-t-teal-400',
  [DealStage.WON]: 'border-t-green-400',
  [DealStage.LOST]: 'border-t-red-400 bg-slate-900',
};

const DealCard: React.FC<{
  deal: Deal,
  isReorderEnabled: boolean;
  onReorder: (draggedId: string, targetId: string) => void;
}> = ({ deal, isReorderEnabled, onReorder }) => {
  const { getContactById, getUserById } = useCrm();
  const navigate = useNavigate();
  const [isOver, setIsOver] = useState(false);
  const primaryContact = deal.contactIds.length > 0 ? getContactById(deal.contactIds[0]) : undefined;
  const assignedUser = deal.assignedUserId ? getUserById(deal.assignedUserId) : undefined;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const deliveryDate = deal.deliveryDate ? new Date(deal.deliveryDate + 'T00:00:00') : null;
  const isOverdue = deliveryDate && deliveryDate < today && deal.stage !== DealStage.WON && deal.stage !== DealStage.LOST;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('dealId', deal.id);
  };
  
  const handleClick = () => {
    navigate(`/deals/${deal.id}`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isReorderEnabled) return;
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isReorderEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('dealId');
    if (draggedId && draggedId !== deal.id) {
      onReorder(draggedId, deal.id);
    }
    setIsOver(false);
  };

  return (
    <div
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white p-4 rounded-lg shadow-sm mb-3 cursor-pointer active:cursor-grabbing border-t-4 ${STAGE_COLORS[deal.stage]} ${isOver ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
    >
      <h4 className={`font-bold ${deal.stage === DealStage.LOST ? 'text-slate-400' : 'text-slate-800'}`}>{deal.title}</h4>
      <div className="mt-2 space-y-2">
        {primaryContact && (
            <p className={`text-sm flex items-center ${deal.stage === DealStage.LOST ? 'text-slate-500' : 'text-slate-600'}`}>
            <UsersIcon className="w-4 h-4 mr-2 text-slate-400"/>
            {primaryContact.firstName} {primaryContact.lastName}
            {deal.contactIds.length > 1 && ` +${deal.contactIds.length - 1}`}
            </p>
        )}
        {assignedUser && (
           <div className="flex items-center text-sm text-slate-600">
             <span className="bg-slate-200 text-slate-600 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2">
               {assignedUser.name.charAt(0)}
             </span>
             <span>{assignedUser.name}</span>
           </div>
        )}
        {deal.deliveryDate && (
            <div className={`text-sm flex items-center ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                {formatDate(deal.deliveryDate)}
            </div>
        )}
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ 
    stage: DealStage; 
    deals: Deal[];
    onDropDeal: (dealId: string, newStage: DealStage) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isReorderEnabled: boolean;
    onReorder: (draggedId: string, targetId: string) => void;
}> = ({ stage, deals, onDropDeal, isCollapsed, onToggleCollapse, isReorderEnabled, onReorder }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };
    
  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
        onDropDeal(dealId, stage);
    }
    setIsOver(false);
  };

  const ColumnHeader = () => {
    if (isCollapsed) {
      return (
        <div
          onClick={onToggleCollapse}
          className="flex flex-col items-center justify-start h-full py-4 cursor-pointer"
        >
          <div className="flex flex-col items-center space-y-4">
            <h3 style={{ writingMode: 'vertical-rl' }} className="transform rotate-180 font-semibold text-slate-700 whitespace-nowrap select-none">
              {stage}
            </h3>
            <span className="text-sm bg-slate-200 text-slate-600 font-medium px-2 py-1 rounded-full">{deals.length}</span>
          </div>
        </div>
      );
    }
  
    return (
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <button onClick={onToggleCollapse} className="flex items-center gap-2 text-slate-700 font-semibold hover:text-blue-600 w-full text-left truncate">
            {stage}
            <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
        </button>
        <span className="text-sm bg-slate-200 text-slate-600 font-medium px-2 py-1 rounded-full">{deals.length}</span>
      </div>
    );
  };


  return (
    <div
      className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}
    >
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          className={`rounded-lg p-2 h-full flex flex-col transition-colors ${isOver ? 'bg-slate-200' : 'bg-transparent'} ${stage === DealStage.LOST ? 'bg-black/5' : ''}`}
        >
          <ColumnHeader />
          {!isCollapsed && (
            <div className="overflow-y-auto h-full min-h-[50vh] px-1">
              {deals.map(deal => (
                <DealCard
                    key={deal.id}
                    deal={deal}
                    isReorderEnabled={isReorderEnabled}
                    onReorder={onReorder}
                />
              ))}
            </div>
          )}
        </div>
    </div>
  );
};

type SortKey = 'createdAt-asc' | 'createdAt-desc' | 'deliveryDate-asc' | 'deliveryDate-desc' | 'manual';

const DealsPage: React.FC = () => {
  const { deals, updateDeal, getDealById, reorderDeal, showAddDeal } = useCrm();
  const [productionModalDeal, setProductionModalDeal] = useState<Deal | null>(null);
  const [isDeliveryDateModalOpen, setIsDeliveryDateModalOpen] = useState(false);
  const [dealIdForDeliveryDateModal, setDealIdForDeliveryDateModal] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('createdAt-desc');
  const [collapsedStages, setCollapsedStages] = useState<Set<DealStage>>(new Set());
  const stages = Object.values(DealStage);
  
  const dealForDeliveryDateModal = dealIdForDeliveryDateModal ? getDealById(dealIdForDeliveryDateModal) : null;

  const sortedDeals = useMemo(() => {
    const dealsToSort = [...deals];
    if (sortBy === 'manual') {
      return dealsToSort.sort((a, b) => a.sortIndex - b.sortIndex);
    }

    const [key, direction] = sortBy.split('-') as [('createdAt' | 'deliveryDate'), ('asc' | 'desc')];

    return dealsToSort.sort((a, b) => {
        const dateA = a[key] ? new Date(a[key]!).getTime() : (direction === 'asc' ? Infinity : -Infinity);
        const dateB = b[key] ? new Date(b[key]!).getTime() : (direction === 'asc' ? Infinity : -Infinity);

        if (dateA < dateB) return direction === 'asc' ? -1 : 1;
        if (dateA > dateB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [deals, sortBy]);

  const handleDropDeal = (dealId: string, newStage: DealStage) => {
    const deal = getDealById(dealId);
    if (!deal || deal.stage === newStage) return;

    if (newStage === DealStage.PRODUCTION && deal.stage !== DealStage.PRODUCTION) {
        setProductionModalDeal(deal);
    } else {
        updateDeal(dealId, () => ({ stage: newStage }));
    }
    
    if (newStage === DealStage.MATERIAL_PURCHASE && deal.stage !== DealStage.MATERIAL_PURCHASE) {
        setDealIdForDeliveryDateModal(dealId);
        setIsDeliveryDateModalOpen(true);
    }
  };

  const toggleCollapse = (stage: DealStage) => {
    setCollapsedStages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(stage)) {
            newSet.delete(stage);
        } else {
            newSet.add(stage);
        }
        return newSet;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
       {productionModalDeal && <ProductionTypeModal 
          isOpen={!!productionModalDeal}
          onClose={() => setProductionModalDeal(null)}
          onConfirm={(tagIds) => {
              updateDeal(productionModalDeal.id, () => ({
                  stage: DealStage.PRODUCTION,
                  tagIds,
              }));
              setProductionModalDeal(null);
          }}
          deal={productionModalDeal}
       />}
       {dealForDeliveryDateModal && <SetDeliveryDateModal
          isOpen={isDeliveryDateModalOpen}
          onClose={() => {
            setIsDeliveryDateModalOpen(false);
            setDealIdForDeliveryDateModal(null);
          }}
          deal={dealForDeliveryDateModal}
       />}
      <header className="flex-shrink-0 p-8 pb-4 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-slate-800">Deal Pipeline</h2>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-deals" className="text-sm font-medium text-slate-600">Sort by:</label>
                <select
                    id="sort-deals"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="block px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                    <option value="createdAt-desc">Creation Date (Newest first)</option>
                    <option value="createdAt-asc">Creation Date (Oldest first)</option>
                    <option value="deliveryDate-asc">Delivery Date (Soonest first)</option>
                    <option value="deliveryDate-desc">Delivery Date (Latest first)</option>
                    <option value="manual">Manual</option>
                </select>
              </div>
              <button
                onClick={() => showAddDeal()}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Deal
              </button>
          </div>
        </div>
        <GlobalSearch />
      </header>
      <div className="flex-1 overflow-x-auto px-8 pb-4">
        <div className="inline-flex space-x-4 h-full">
          {stages.map(stage => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={sortedDeals.filter(deal => deal.stage === stage)}
              onDropDeal={handleDropDeal}
              isCollapsed={collapsedStages.has(stage)}
              onToggleCollapse={() => toggleCollapse(stage)}
              isReorderEnabled={sortBy === 'manual'}
              onReorder={reorderDeal}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealsPage;