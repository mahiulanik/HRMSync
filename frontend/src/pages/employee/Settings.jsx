import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { User, Lock, Save, Camera } from 'lucide-react';

export default function EmployeeSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', position: '', bio: '', profilePic: null });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/profile').then(res => { const d = res.data; setProfile({ firstName: d.firstName||'', lastName: d.lastName||'', email: d.email||'', position: d.position||'', bio: d.bio||'', profilePic: d.profilePic||null }); if (d.profilePic) setPreview(d.profilePic); }).catch(() => {});
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadMsg('');
    if (file.size > 100 * 1024) { setUploadMsg('Image must be less than 100KB'); e.target.value = ''; return; }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) { setUploadMsg('Only JPG, PNG, WebP and GIF images are allowed'); e.target.value = ''; return; }
    setSelectedFile(file);
    const reader = new FileReader(); reader.onloadend = () => setPreview(reader.result); reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return; setUploading(true); setUploadMsg('');
    try { const formData = new FormData(); formData.append('profilePic', selectedFile); const res = await api.post('/profile/pic', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setProfile({ ...profile, profilePic: res.data.profilePic }); setPreview(res.data.profilePic); setUploadMsg('Profile picture updated successfully'); setSelectedFile(null); }
    catch (err) { setUploadMsg(err.response?.data?.error || 'Failed to upload'); }
    finally { setUploading(false); }
  };

  const handleProfileSave = async () => { setMsg(''); try { await api.post('/profile', { bio: profile.bio }); setMsg('Profile updated successfully'); } catch { setMsg('Failed to update profile'); } };
  const handlePasswordChange = async (e) => { e.preventDefault(); setPwMsg(''); try { await api.post('/change-password', passwordForm); setPwMsg('Password changed successfully. Redirecting to login...'); setTimeout(async () => { await logout(); navigate('/', { replace: true }); }, 2000); } catch (err) { setPwMsg(err.response?.data?.error || 'Failed to change password'); } };

  const initials = `${profile.firstName?.[0]||''}${profile.lastName?.[0]||''}`.toUpperCase();

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-text-secondary text-sm mb-6">Manage your account and preferences</p>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-6"><Camera size={20} className="text-text-secondary" /><h2 className="text-lg font-semibold">Profile Picture</h2></div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {preview ? <img src={preview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-border" /> : <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-border">{initials}</div>}
            <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"><Camera size={20} className="text-white" /></button>
          </div>
          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} className="hidden" />
            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors">Choose Image</button>
              {selectedFile && <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload'}</button>}
            </div>
            <p className="text-xs text-text-secondary mt-2">JPG, PNG, WebP or GIF. Max 100KB.</p>
            {uploadMsg && <p className={`text-xs mt-2 ${uploadMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{uploadMsg}</p>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-6"><User size={20} className="text-text-secondary" /><h2 className="text-lg font-semibold">Public Profile</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label className="block text-sm font-medium mb-1">Name</label><input value={`${profile.firstName} ${profile.lastName}`} readOnly className="w-full px-3 py-2.5 border border-border rounded-lg bg-page-bg text-text-secondary" /></div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input value={profile.email} readOnly className="w-full px-3 py-2.5 border border-border rounded-lg bg-page-bg text-text-secondary" /></div>
        </div>
        <div className="mb-4"><label className="block text-sm font-medium mb-1">Position</label><input value={profile.position} readOnly className="w-full px-3 py-2.5 border border-border rounded-lg bg-page-bg text-text-secondary" /></div>
        <div className="mb-4"><label className="block text-sm font-medium mb-1">Bio</label><textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary resize-none" placeholder="Write a brief bio..." /><p className="text-xs text-text-secondary mt-1">This will be displayed on your profile.</p></div>
        {msg && <p className="text-sm text-green-600 mb-3">{msg}</p>}
        <div className="flex justify-end"><button onClick={handleProfileSave} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"><Save size={16} /> Save Changes</button></div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-page-bg flex items-center justify-center text-text-secondary"><Lock size={20} /></div><div><h3 className="font-semibold">Password</h3><p className="text-sm text-text-secondary">Update your account password</p></div></div>
          <button onClick={() => setShowPassword(true)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors self-start">Change</button>
        </div>
      </div>

      <Modal isOpen={showPassword} onClose={() => setShowPassword(false)} title="Change Password" subtitle="">
        <div className="flex items-center gap-2 mb-4"><Lock size={20} className="text-text-secondary" /><h3 className="font-semibold">Change Password</h3></div>
        <form onSubmit={handlePasswordChange}>
          <div className="mb-4"><label className="block text-sm font-medium mb-1">Current Password</label><input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" required /></div>
          <div className="mb-6"><label className="block text-sm font-medium mb-1">New Password</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" required minLength={8} /></div>
          {pwMsg && <p className={`text-sm mb-3 ${pwMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{pwMsg}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowPassword(false)} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">Update Password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
