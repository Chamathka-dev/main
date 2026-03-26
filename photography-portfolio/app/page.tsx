'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa'

export default function Portfolio() {
  const [settings, setSettings] = useState({ 
    hero_image_url: '', 
    hero_image_url_2: '', 
    whatsapp_number: '',
    facebook_url: '',
    instagram_url: ''
  })
  const [categories, setCategories] = useState([])
  const [images, setImages] = useState([])
  const [activeTab, setActiveTab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex === 0 ? 1 : 0))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPortfolioData() {
    setLoading(true)
    try {
      const { data: settingsData } = await supabase.from('site_settings').select('*').single()
      if (settingsData) setSettings(settingsData)

      const { data: catData } = await supabase.from('categories').select('*').order('id')
      if (catData && catData.length > 0) {
        setCategories(catData)
        setActiveTab(catData[0].id)
      }

      const { data: imgData } = await supabase.from('portfolio_images').select('*').order('sort_order')
      if (imgData) setImages(imgData)

    } catch (error) {
      console.error("Network error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="animate-pulse text-xl text-slate-500 tracking-widest font-light uppercase italic">Loading Portfolio...</div>
    </div>
  )

  const filteredImages = images.filter(img => img.category_id === activeTab)

  const slideImages = [
    settings.hero_image_url || 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=2674&auto=format&fit=crop',
    settings.hero_image_url_2 || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop'
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      
      {/* BRANDING HEADER */}
      <header className="absolute top-0 left-0 w-full z-50 px-6 py-8 md:px-12">
        <div className="text-white text-lg md:text-xl font-bold tracking-[0.3em] uppercase drop-shadow-lg">
          Pramuditha Dissanayaka
        </div>
      </header>

      {/* HERO SECTION WITH SLIDER */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden bg-black">
        
        {slideImages.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover transition-opacity duration-1000 ease-in-out ${
              index === bgIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
            } ${
              // FIXED: Slide 1 focuses 75% right. Slide 2 focuses 85% right on mobile.
              index === 0 
                ? 'bg-[75%_top] md:bg-[center_top_15%]' 
                : 'bg-[85%_top] md:bg-center'
            }`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 via-80% to-transparent z-10" /> 
        
        <div className="relative z-20 text-center flex flex-col items-center px-4 mt-12">
          <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-6 tracking-tight drop-shadow-2xl leading-tight">
            Hello!<br />I'm Pramuditha
          </h1>
          
          <p className="text-lg md:text-xl text-slate-200 mb-10 font-light tracking-wide max-w-2xl drop-shadow-md italic">
            "Capturing moments that stay with you forever."
          </p>
          
          <a 
            href={`https://wa.me/${settings.whatsapp_number}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-white/25 backdrop-blur-2xl hover:bg-white/40 text-white px-10 py-5 rounded-full font-bold transition-all shadow-2xl border border-white/50 hover:border-white/70 hover:scale-105 active:scale-95"
          >
            <FaWhatsapp size={26} className="text-[#25D366] drop-shadow-[0_0_10px_rgba(37,211,102,0.6)] transition-transform group-hover:rotate-12" />
            <span className="tracking-[0.15em] uppercase text-sm font-black drop-shadow-lg">Let's Talk</span>
          </a>
        </div>
      </section>

      {/* DYNAMIC CATEGORY TABS */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        
        {/* MOBILE SWIPE HINT */}
        <div className="w-full flex md:hidden items-center justify-center gap-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
          <span>Swipe for more</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>

        <div className="sticky top-4 z-30 flex md:flex-wrap overflow-x-auto justify-start md:justify-center gap-2 md:gap-3 mb-12 p-2 rounded-2xl md:rounded-3xl bg-white/70 md:bg-white/40 backdrop-blur-xl shadow-md border border-white/50 w-full md:w-fit mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-sm font-bold tracking-widest transition-all duration-300 uppercase ${
                activeTab === category.id 
                  ? 'bg-slate-900 text-white shadow-xl md:scale-105' 
                  : 'bg-transparent text-slate-700 hover:bg-white/60'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* MASONRY IMAGE GALLERY */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {filteredImages.length > 0 ? (
            filteredImages.map((img) => (
              <div 
                key={img.id} 
                onClick={() => setSelectedImage(img.image_url)}
                className="break-inside-avoid overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-white group cursor-pointer relative"
              >
                <Image 
                  src={img.image_url} 
                  alt="Portfolio shot" 
                  width={800}
                  height={1000}
                  quality={65}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  className="w-full h-auto transition-transform duration-1000 group-hover:scale-110 bg-slate-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 font-light tracking-[0.3em] bg-black/40 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20">
                    VIEW
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="columns-full text-center py-24 w-full border-2 border-dashed border-slate-200 rounded-3xl">
               <p className="text-slate-400 font-light text-lg tracking-widest uppercase">No photos in this category yet</p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 py-20 text-center">
        <h3 className="text-xl font-bold mb-8 tracking-[0.4em] text-white uppercase drop-shadow-md">
           Pramuditha Dissanayaka
        </h3>
        <div className="flex justify-center gap-10 mb-12">
          <a href={settings.facebook_url || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-all hover:scale-125">
            <FaFacebook size={30} />
          </a>
          <a href={settings.instagram_url || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-all hover:scale-125">
            <FaInstagram size={30} />
          </a>
        </div>
        <div className="w-16 h-px bg-slate-800 mx-auto mb-10"></div>
        <p className="text-slate-600 text-[10px] tracking-[0.2em] uppercase font-semibold italic">
          © {new Date().getFullYear()} All Rights Reserved. Crafted with precision.
        </p>
      </footer>

      {/* FULLSCREEN LIGHTBOX */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors z-50"
            onClick={() => setSelectedImage(null)}
          >
            <X size={48} strokeWidth={1} />
          </button>
          
          <div className="relative w-full max-w-5xl h-[90vh]">
            <Image 
              src={selectedImage} 
              alt="Expanded view" 
              fill
              className="object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </main>
  )
}