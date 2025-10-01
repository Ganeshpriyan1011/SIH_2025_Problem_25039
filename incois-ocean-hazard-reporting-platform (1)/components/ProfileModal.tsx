import React, { useState } from 'react';
import { User } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (data: { name: string; avatar?: string }) => Promise<void>;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    let newAvatarBase64: string | undefined = undefined;
    if (newAvatarFile) {
        try {
            newAvatarBase64 = await fileToBase64(newAvatarFile);
        } catch (error) {
            console.error("Error converting file to Base64", error);
            setIsSaving(false);
            return;
        }
    }

    await onSave({
        name,
        ...(newAvatarBase64 && { avatar: newAvatarBase64 })
    });
    
    setIsSaving(false);
  };

  return (
    <Modal title={t('profileModal.title')} onClose={onClose}>
        <div className="p-6 space-y-6 text-slate-300">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-slate-600" />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center border-4 border-slate-600">
                            <ion-icon name="person-outline" className="text-6xl text-slate-400"></ion-icon>
                        </div>
                    )}
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-sky-600 p-2 rounded-full cursor-pointer hover:bg-sky-700 transition-colors">
                        <ion-icon name="camera-outline" className="text-white text-xl"></ion-icon>
                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">{t('profileModal.usernameLabel')}</label>
              <input
                id="username"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
             <div>
              <label className="block text-sm font-medium mb-1">{t('profileModal.roleLabel')}</label>
              <p className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-400">{t(`roles.${user.role}`)}</p>
            </div>
        </div>

        <div className="bg-slate-800 px-6 py-3 flex justify-end gap-3 rounded-b-lg border-t border-slate-700">
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSaving}>{t('reportForm.cancel')}</Button>
          <Button type="button" onClick={handleSave} variant="primary" disabled={isSaving}>
            {isSaving ? <Spinner /> : <ion-icon name="save-outline" className="mr-2"></ion-icon>}
            {t('profileModal.save')}
          </Button>
        </div>
    </Modal>
  );
};

export default ProfileModal;