import React, { useState, useEffect } from 'react';
import { sellerApi, ApiSellerWorkingHour } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const DAYS_OF_WEEK = ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba','Yakshanba'];

interface Props { isOpen: boolean; onClose: () => void; sellerName: string; storeName: string; customer: null; }

const SellerProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [workingHours, setWorkingHours] = useState<ApiSellerWorkingHour[]>([]);

  useEffect(() => { if (isOpen) fetchStore(); }, [isOpen]);

  const fetchStore = async () => {
    setIsLoading(true); setError('');
    try {
      const res = await sellerApi.getProfile();
      // ✅ res.store (yangi format, eski: res.seller.store)
      if (res.store) {
        setName(res.store.name||''); setDescription(res.store.description||'');
        setPhone(res.store.phone||''); setImagePreview(res.store.image||null);
        setWorkingHours(res.store.working_hours||[]);
      }
    } catch(e:any) { setError(e.message||'Xatolik'); }
    finally { setIsLoading(false); }
  };

  const updateWH = (day:number, open:string, close:string) => {
    setWorkingHours(prev => { const n=[...prev]; const i=n.findIndex(h=>h.day_of_week===day); if(i>=0)n[i]={...n[i],open_time:open,close_time:close}; else n.push({day_of_week:day,open_time:open,close_time:close}); return n; });
  };
  const toggleWH = (day:number, en:boolean) => en ? updateWH(day,'09:00','18:00') : setWorkingHours(prev=>prev.filter(h=>h.day_of_week!==day));

  const handleSave = async () => {
    setIsSaving(true); setError('');
    try {
      await sellerApi.updateStore({ name, description, phone, working_hours:workingHours, ...(imageFile?{image:imageFile}:{}) });
      onClose(); window.location.reload();
    } catch(e:any) { setError(e.message||'Xatolik'); }
    finally { setIsSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Do'kon sozlamalari">
      {isLoading ? <div className="py-10"><LoadingSpinner /></div> : (
        <div className="space-y-4 pt-2 pb-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-semibold mb-1">Do'kon rasmi</label>
            <div className="flex items-center gap-4">
              <div className="size-20 bg-gray-100 rounded-xl overflow-hidden border border-subtle flex items-center justify-center">
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover"/> : <Icon name="storefront" className="text-3xl text-gray-400"/>}
              </div>
              <input type="file" accept="image/*" id="sImg" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setImageFile(f);setImagePreview(URL.createObjectURL(f));}}}/>
              <label htmlFor="sImg" className="px-4 py-2 bg-brand-light text-brand text-sm font-semibold rounded-lg cursor-pointer">Rasm yuklash</label>
            </div>
          </div>
          <div><label className="block text-sm font-semibold mb-1">Do'kon nomi</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-50 border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"/></div>
          <div><label className="block text-sm font-semibold mb-1">Tavsif</label><textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-gray-50 border border-subtle rounded-xl px-4 py-3 text-sm min-h-[80px] focus:outline-none focus:border-brand"/></div>
          <div><label className="block text-sm font-semibold mb-1">Telefon</label><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-gray-50 border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"/></div>
          <div>
            <label className="block text-sm font-semibold mb-3">Ish vaqtlari</label>
            <div className="space-y-2 bg-gray-50 p-4 rounded-card border border-subtle">
              {DAYS_OF_WEEK.map((d,i)=>{const h=workingHours.find(x=>x.day_of_week===i); return (
                <div key={i} className="flex items-center gap-3">
                  <input type="checkbox" checked={!!h} onChange={e=>toggleWH(i,e.target.checked)} className="w-4 h-4 text-brand rounded"/>
                  <span className="w-24 text-sm">{d}</span>
                  {h&&<div className="flex items-center gap-2 flex-1"><input type="time" value={h.open_time.slice(0,5)} onChange={e=>updateWH(i,e.target.value,h.close_time)} className="w-full text-xs p-1 border border-subtle rounded"/><span className="text-gray-400">-</span><input type="time" value={h.close_time.slice(0,5)} onChange={e=>updateWH(i,h.open_time,e.target.value)} className="w-full text-xs p-1 border border-subtle rounded"/></div>}
                </div>
              );})}
            </div>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {isSaving?'Saqlanmoqda...':'Saqlash'}
          </button>
        </div>
      )}
    </Modal>
  );
};
export default SellerProfileModal;
