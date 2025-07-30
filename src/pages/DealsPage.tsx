import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm, formatDate } from '../store/crmStore';
import { Deal, PipelineStage } from '../types';
import { PlusIcon, UsersIcon, ChevronDownIcon, CalendarIcon } from '../components/Icons';
import ProductionTypeModal from '../components/ProductionTypeModal';
import SetDeliveryDateModal from '../components/SetDeliveryDateModal';

const STAGE_COLORS: Record<string, string> = {
  'Nuevos': 'border-t-slate-400',
  'Contactados': 'border-t-blue-400',
  'En revisión': 'border-t-yellow-400',
  'Aprobado': 'border-t-cyan-400',
  'Compra de material': 'border-t-orange-400',
  'En camino': 'border-t-lime-400',
  'Producción': 'border-t-indigo-400',
  'Taller externo': 'border-t-violet-400',
  'Listo en local': 'border-t-purple-400',
  'Espera de pago': 'border-t-pink-400',
  'Listo para entrega': 'border-t-teal-400',
  'Ganado': 'border-t-green-400',
  'Perdido': 'border-t-red-400 bg-slate-900',
};

const DealCard: React.FC<{
  deal: Deal,
  stageName: string,
  isReorderEnabled: boolean;
  onReorder: (draggedId: string, targetId: string) => void;
}> = ({ deal, stageName, isReorderEnabled, onReorder }) => {
  const { getContactById, getUserById } = useCrm();
  const navigate = useNavigate();
  const [isOver, setIsOver] = useState(false);
  const primaryContact = deal.contactIds.length > 0 ? getContactById(deal.contactIds[0]) : undefined;
  const assignedUser = deal.assignedUserId ? getUserById(deal.assignedUserId) : undefined;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const deliveryDate = deal.deliveryDate ? new Date(deal.deliveryDate + 'T00:00:00') : null;
  const isOverdue = deliveryDate && deliveryDate < today && stageName !== 'Ganado' && stageName !== 'Perdido';

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
      className={`bg-white p-4 rounded-lg shadow-sm mb-3 cursor-pointer active:cursor-grabbing border-t-4 ${STAGE_COLORS[stageName] || 'border-t-gray-400'} ${isOver ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
    >
      <h4 className={`font-bold ${stageName === 'Perdido' ? 'text-slate-400' : 'text-slate-800'}`}>{deal.title}</h4>
      <div className="mt-2 space-y-2">
        {primaryContact && (
            <p className={`text-sm flex items-center ${stageName === 'Perdido' ? 'text-slate-500' : 'text-slate-600'}`}>
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
    stage: PipelineStage; 
    deals: Deal[];
    onDropDeal: (dealId: string, newStageId: string) => void;
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
        onDropDeal(dealId, stage.id);
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
              {stage.name}
            </h3>
            <span className="text-sm bg-slate-200 text-slate-600 font-medium px-2 py-1 rounded-full">{deals.length}</span>
          </div>
        </div>
      );
    }
  
    return (
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <button onClick={onToggleCollapse} className="flex items-center gap-2 text-slate-700 font-semibold hover:text-blue-600 w-full text-left truncate">
            {stage.name}
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
          className={`rounded-lg p-2 h-full flex flex-col transition-colors ${isOver ? 'bg-slate-200' : 'bg-transparent'} ${stage.name === 'Perdido' ? 'bg-black/5' : ''}`}
        >
          <ColumnHeader />
          {!isCollapsed && (
            <div className="overflow-y-auto h-full min-h-[50vh] px-1">
              {deals.map(deal => (
                <DealCard
                    key={deal.id}
                    deal={deal}
                    stageName={stage.name}
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
  const { deals, updateDeal, getDealById, reorderDeal, showAddDeal, pipelineStages, getStageById } = useCrm();
  const [productionModalDeal, setProductionModalDeal] = useState<Deal | null>(null);
  const [isDeliveryDateModalOpen, setIsDeliveryDateModalOpen] = useState(false);
  const [dealIdForDeliveryDateModal, setDealIdForDeliveryDateModal] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('createdAt-desc');
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  
  const dealForDeliveryDateModal = dealIdForDeliveryDateModal ? getDealById(dealIdForDeliveryDateModal) : null;
  
  useEffect(() => {
    // Initialize collapsed stages once pipeline stages are loaded
    if (pipelineStages.length > 0) {
        const wonLostStages = pipelineStages.filter(s => s.name === 'Ganado' || s.name === 'Perdido').map(s => s.id);
        setCollapsedStages(new Set(wonLostStages));
    }
  }, [pipelineStages]);

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

  const handleDropDeal = (dealId: string, newStageId: string) => {
    const deal = getDealById(dealId);
    if (!deal || deal.stageId === newStageId) return;

    const newStage = getStageById(newStageId);
    if (!newStage) return;

    if (newStage.name === 'Producción') {
        setProductionModalDeal(deal);
    } else {
        updateDeal(dealId, () => ({ stageId: newStageId }));
    }
    
    if (newStage.name === 'Compra de material') {
        setDealIdForDeliveryDateModal(dealId);
        setIsDeliveryDateModalOpen(true);
    }
  };

  const toggleCollapse = (stageId: string) => {
    setCollapsedStages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(stageId)) {
            newSet.delete(stageId);
        } else {
            newSet.add(stageId);
        }
        return newSet;
    });
  };

  return (
    <div className="p-8 h-full flex flex-col">
       {productionModalDeal && <ProductionTypeModal 
          isOpen={!!productionModalDeal}
          onClose={() => setProductionModalDeal(null)}
          onConfirm={(tagIds) => {
              const productionStage = pipelineStages.find(s => s.name === 'Producción');
              if (productionStage) {
                  updateDeal(productionModalDeal.id, () => ({
                      stageId: productionStage.id,
                      tagIds,
                  }));
              }
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
      <div className="flex-shrink-0 pb-4">
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
      </div>
      <div className="flex-1 overflow-x-auto -mx-8 px-8">
        <div className="inline-flex space-x-4 h-full">
          {pipelineStages.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={sortedDeals.filter(deal => deal.stageId === stage.id)}
              onDropDeal={handleDropDeal}
              isCollapsed={collapsedStages.has(stage.id)}
              onToggleCollapse={() => toggleCollapse(stage.id)}
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