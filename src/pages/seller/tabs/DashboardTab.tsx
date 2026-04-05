import React from 'react';
import { SellerTabState } from '@/types';
import { SellerOrderUI, SellerProductUI } from '@/hooks/useSellerData';
import { sellerApi, ApiSellerAnalytics } from '@/services/api';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OrderCard from '../components/OrderCard';
import { BarChart, Bar, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { products: SellerProductUI[]; orders: SellerOrderUI[]; newOrdersCount: number; totalRevenue: number; onNavigate: (t:SellerTabState)=>void; onAddProduct: ()=>void; onSelectOrder: (o:SellerOrderUI)=>void; }

const DashboardTab: React.FC<Props> = ({ products, orders, newOrdersCount, totalRevenue, onNavigate, onAddProduct, onSelectOrder }) => {
  const [analytics, setAnalytics] = React.useState<ApiSellerAnalytics|null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [range, setRange] = React.useState<'daily'|'weekly'|'monthly'|'all'>('daily');

  React.useEffect(() => {
    setIsLoading(true);
    sellerApi.getAnalytics(range).then(setAnalytics).catch(()=>{}).finally(()=>setIsLoading(false));
  }, [range]);

  return (
    <div className="px-4 pb-8">
      <div className="flex gap-3 mb-6 pt-4">
        <button onClick={onAddProduct} className="flex-1 bg-brand text-white font-bold py-3 px-6 rounded-pill flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98] transition-transform"><Icon name="add_box" className="text-lg"/> Mahsulot</button>
        <button onClick={()=>onNavigate('REPORTS')} className="flex-1 bg-card border border-subtle font-bold py-3 px-6 rounded-pill flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98] transition-transform"><Icon name="bar_chart" className="text-lg"/> Hisobotlar</button>
      </div>
      <h3 className="text-muted text-xs font-bold uppercase tracking-wider mb-3">Statistika</h3>
      <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
        {(['daily','weekly','monthly','all'] as const).map(r=>(
          <button key={r} onClick={()=>setRange(r)} className={`flex-1 text-xs py-1.5 font-bold rounded-md ${range===r?'bg-white shadow text-black':'text-gray-500'} transition-all`}>
            {r==='daily'?'Kunlik':r==='weekly'?'Haftalik':r==='monthly'?'Oylik':'Umumiy'}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner message="Analitika yuklanmoqda"/></div>
      ) : analytics ? (
        <>
          <div className="bg-card rounded-card p-4 border border-subtle mb-4">
            <p className="text-muted text-xs font-bold uppercase mb-2">Savdo aylanmasi</p>
            <p className="text-3xl font-bold">{analytics.revenue.toLocaleString()} so'm</p>
            {analytics.chart && analytics.chart.length>0 && (
              <div className="h-32 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.chart.map((val,idx)=>({name:idx,value:val}))}>
                    <Tooltip formatter={(v:number)=>[`${v.toLocaleString()} so'm`,'Daromad']} labelFormatter={()=>''} cursor={{fill:'transparent'}}/>
                    <Bar dataKey="value" fill="#16a34a" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div onClick={()=>onNavigate('ORDERS')} className="bg-card rounded-card p-4 border border-subtle cursor-pointer active:scale-[0.98] transition-transform flex flex-col items-center justify-center text-center">
              <p className="text-muted text-xs">Buyurtmalar</p>
              <p className="text-xl font-bold mt-1 text-brand">{analytics.orders} ta</p>
            </div>
            <div className="bg-card rounded-card p-4 border border-subtle flex flex-col items-center justify-center text-center">
              <p className="text-muted text-xs">O'rtacha check</p>
              <p className="text-xl font-bold mt-1 text-green-600">{analytics.average_check.toLocaleString()} <span className="text-sm">so'm</span></p>
            </div>
          </div>
          {analytics.top_products && analytics.top_products.length>0 && (
            <div className="bg-card rounded-card p-4 border border-subtle mb-6">
              <p className="text-muted text-sm mb-3 font-bold">Top mahsulotlar</p>
              <div className="space-y-3">
                {analytics.top_products.map((tp,idx)=>(
                  <div key={tp.id} className="flex items-center gap-3">
                    <span className="font-bold text-gray-400 w-4">{idx+1}.</span>
                    <p className="flex-1 text-sm font-semibold line-clamp-1">{tp.name}</p>
                    <span className="text-sm font-bold text-brand bg-brand-light px-2 py-0.5 rounded">{tp.sold} ta</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card rounded-card p-4 border border-subtle"><div className="size-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3"><Icon name="point_of_sale" className="text-muted"/></div><p className="text-muted text-xs">Jami mahsulotlar</p><p className="text-2xl font-bold mt-1">{products.length} ta</p></div>
          <div onClick={()=>onNavigate('ORDERS')} className="bg-card rounded-card p-4 border border-subtle cursor-pointer active:scale-[0.98] transition-transform"><div className="size-10 bg-brand-light rounded-lg flex items-center justify-center mb-3"><Icon name="shopping_basket" className="text-brand"/></div><p className="text-muted text-xs">Yangi buyurtmalar</p><p className="text-2xl font-bold mt-1">{newOrdersCount} ta</p></div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-muted text-xs font-bold uppercase tracking-wider">Buyurtmalar</h3>
        <button onClick={()=>onNavigate('ORDERS')} className="text-brand text-sm font-bold">Hammasi</button>
      </div>
      <div className="space-y-3">
        {orders.length===0 ? <EmptyState icon="shopping_bag" message="Buyurtmalar yo'q"/> : orders.slice(0,3).map(o=><OrderCard key={o.id} order={o} onClick={onSelectOrder}/>)}
      </div>
    </div>
  );
};
export default DashboardTab;
