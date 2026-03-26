'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, Loader2, Image as ImageIcon } from 'lucide-react'

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [authError, setAuthError] = useState(false)
  const SECRET_PIN = '2026' 

  // Portfolio State
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [allImages, setAllImages] = useState([])

  // Site Settings State (Socials + Hero)
  // ADDED: hero_image_url and hero_image_url_2 to the initial state
  const [settings, setSettings] = useState({ 
    whatsapp_number: '', 
    facebook_url: '', 
    instagram_url: '',
    hero_image_url: '',
    hero_image_url_2: ''
  })
  const [heroFile1, setHeroFile1] = useState(null)
  const [heroFile2, setHeroFile2] = useState(null)
  const [settingsUploading, setSettingsUploading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories()
      fetchExistingImages()
      fetchSettings()
    }
  }, [isAuthenticated])

  async function fetchSettings() {
    const { data } = await supabase.from('site_settings').select('*').single()
    if (data) setSettings(data)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('id')
    if (data) {
      setCategories(data)
      setSelectedCategory(data[0]?.id || '')
    }
  }

  async function fetchExistingImages() {
    const { data } = await supabase.from('portfolio_images').select('*, categories(name)').order('created_at', { ascending: false })
    if (data) setAllImages(data)
  }

  function handleLogin(e) {
    e.preventDefault()
    if (passcode === SECRET_PIN) {
      setIsAuthenticated(true)
    } else {
      setAuthError(true)
      setPasscode('')
    }
  }

  // BULK UPLOAD PORTFOLIO
  async function handleBulkUpload(e) {
    e.preventDefault()
    if (files.length === 0 || !selectedCategory) return alert('Select files and category.')
    
    setUploading(true)
    const uploadResults = []

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `p-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: storageError } = await supabase.storage.from('portfolio-assets').upload(fileName, file)
        if (storageError) throw storageError
        const { data: { publicUrl } } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName)
        uploadResults.push({ image_url: publicUrl, category_id: selectedCategory })
      }
      const { error: dbError } = await supabase.from('portfolio_images').insert(uploadResults)
      if (dbError) throw dbError
      alert(`Uploaded ${files.length} photos!`)
      setFiles([])
      fetchExistingImages()
    } catch (error) {
      console.error(error)
      alert('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // DELETE PORTFOLIO IMAGE
  async function handleDelete(id) {
    if (!confirm('Delete this photo?')) return
    const { error } = await supabase.from('portfolio_images').delete().eq('id', id)
    if (!error) setAllImages(allImages.filter(img => img.id !== id))
  }

  // UPDATE SETTINGS (Hero Sliders & Social Links)
  async function handleSettingsSave(e) {
    e.preventDefault()
    setSettingsUploading(true)
    try {
      let updates = {
        whatsapp_number: settings.whatsapp_number,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url
      }
      if (heroFile1) {
        const name = `h1-${Date.now()}`
        await supabase.storage.from('portfolio-assets').upload(name, heroFile1)
        updates.hero_image_url = supabase.storage.from('portfolio-assets').getPublicUrl(name).data.publicUrl
      }
      if (heroFile2) {
        const name = `h2-${Date.now()}`
        await supabase.storage.from('portfolio-assets').upload(name, heroFile2)
        updates.hero_image_url_2 = supabase.storage.from('portfolio-assets').getPublicUrl(name).data.publicUrl
      }
      await supabase.from('site_settings').update(updates).eq('id', 1)
      
      // Refresh the settings so the new images instantly appear in the admin previews
      fetchSettings() 
      setHeroFile1(null)
      setHeroFile2(null)
      
      alert('Settings & Hero Slider Updated!')
    } finally { setSettingsUploading(false) }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-800 text-center">
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest">Admin Access</h2>
          <input 
            type="password" placeholder="ENTER PIN" value={passcode} onChange={e => setPasscode(e.target.value)}
            className="w-full p-4 mb-4 bg-slate-950 text-white border border-slate-700 rounded-2xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {authError && <p className="text-red-400 mb-4 text-sm font-bold uppercase">Access Denied</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest">Unlock</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border flex justify-between items-center">
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">PRAMUDITHA DISSANAYAKA - PORTFOLIO MANAGER</h1>
          <button onClick={() => setIsAuthenticated(false)} className="text-xs font-black text-slate-400 hover:text-red-600 uppercase transition-colors tracking-widest">LOCK</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* BULK UPLOADER */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-slate-400">01. Bulk Portfolio Upload</h2>
            <form onSubmit={handleBulkUpload} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Select Category</label>
                <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-black font-bold appearance-none cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="text-black font-bold bg-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-slate-50 group">
                <input 
                  id="bulk-upload" type="file" accept="image/*" multiple 
                  onChange={e => setFiles(Array.from(e.target.files))}
                  className="hidden"
                />
                <label htmlFor="bulk-upload" className="cursor-pointer">
                  <ImageIcon className="mx-auto mb-3 text-slate-300 group-hover:text-blue-500 transition-colors" size={32} />
                  <span className="block text-slate-900 font-bold uppercase text-xs tracking-widest">Select Multiple Photos</span>
                  <span className="text-[10px] text-blue-600 mt-2 block font-black uppercase tracking-tighter">
                    {files.length > 0 ? `${files.length} Files Ready` : 'No files selected'}
                  </span>
                </label>
              </div>

              <button 
                type="submit" disabled={uploading}
                className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-lg ${uploading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-black hover:shadow-2xl'}`}
              >
                {uploading ? <Loader2 className="animate-spin mx-auto" /> : `Publish ${files.length} Photos`}
              </button>
            </form>
          </div>

          {/* SITE SETTINGS (Socials + Hero Slider) */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 h-fit">
            <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-slate-400">02. Site & Social Settings</h2>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">WhatsApp Number (e.g. 94771234567)</label>
                <input 
                  type="text" 
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Facebook URL</label>
                <input 
                  type="text" 
                  value={settings.facebook_url || ''}
                  onChange={(e) => setSettings({...settings, facebook_url: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Instagram URL</label>
                <input 
                  type="text" 
                  value={settings.instagram_url || ''}
                  onChange={(e) => setSettings({...settings, instagram_url: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div className="space-y-4">
                {/* PREVIEW 1 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Hero Slide 01</p>
                      {settings.hero_image_url && <span className="text-[8px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase">Active</span>}
                    </div>
                    {settings.hero_image_url && (
                      <img src={settings.hero_image_url} alt="Current Slide 1" className="w-full h-32 object-cover rounded-xl mb-3 border border-slate-200" />
                    )}
                    <input type="file" onChange={e => setHeroFile1(e.target.files[0])} className="w-full text-xs font-bold text-slate-900" />
                </div>

                {/* PREVIEW 2 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Hero Slide 02</p>
                      {settings.hero_image_url_2 && <span className="text-[8px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase">Active</span>}
                    </div>
                    {settings.hero_image_url_2 && (
                       <img src={settings.hero_image_url_2} alt="Current Slide 2" className="w-full h-32 object-cover rounded-xl mb-3 border border-slate-200" />
                    )}
                    <input type="file" onChange={e => setHeroFile2(e.target.files[0])} className="w-full text-xs font-bold text-slate-900" />
                </div>
              </div>

              <button disabled={settingsUploading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 mt-4">
                {settingsUploading ? <Loader2 className="animate-spin mx-auto" /> : 'Save All Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* IMAGE MANAGER */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
          <h2 className="text-sm font-black mb-8 uppercase tracking-widest text-slate-400">03. Live Gallery Manager</h2>
          
          {allImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {allImages.map((img) => (
                <div key={img.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm transition-all hover:shadow-xl">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/20">
                    {img.categories?.name}
                  </div>
                  <button 
                    onClick={() => handleDelete(img.id)}
                    className="absolute inset-0 bg-red-600/90 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white gap-2"
                  >
                    <Trash2 size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[2rem]">
               <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm italic">Gallery is empty</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}