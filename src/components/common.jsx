import { Link } from 'react-router-dom'
import { ArrowRight, Bell, BookOpen, CalendarDays, FileText, Image, MapPin, Play, Search, ShieldCheck } from 'lucide-react'

export function SectionTitle({ eyebrow, children, href, linkLabel = 'View all' }) {
  return <div className="section-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{children}</h2></div>{href && <Link className="text-link" to={href}>{linkLabel} <ArrowRight size={16}/></Link>}</div>
}
export function EmptyState({ icon: Icon = FileText, title = 'Nothing published yet', text = 'Please check again soon.' }) {
  return <div className="empty-state"><span><Icon size={22}/></span><strong>{title}</strong><p>{text}</p></div>
}
export function LoadingState() { return <div className="loading-grid" aria-label="Loading"><i/><i/><i/></div> }
export function NoticeCard({ item }) {
  return <article className="notice-card"><div className="notice-date"><span>{item.published_at ? new Date(item.published_at).toLocaleDateString('en-IN', { day: '2-digit' }) : '—'}</span><small>{item.published_at ? new Date(item.published_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Notice'}</small></div><div className="notice-copy"><div className="notice-meta">{item.is_pinned && <b className="pin">PINNED</b>}<span>{item.category || 'General Notice'}</span></div><h3>{item.title}</h3><p>{item.description}</p>{item.attachment_url && <a href={item.attachment_url} target="_blank" rel="noreferrer" className="text-link">View attachment <ArrowRight size={14}/></a>}</div></article>
}
export function ContentCard({ item, type }) {
  const image = type === 'gallery' ? item.image_url : item.thumbnail_url
  return <article className="content-card"><div className="content-image">{image ? <img src={image} alt={item.title || item.event_name || 'School activity'} loading="lazy"/> : <div className="image-fallback">{type === 'video' ? <Play/> : <Image/>}</div>}{type === 'video' && <span className="play-badge"><Play size={16} fill="currentColor"/></span>}</div><div className="content-card-copy"><span className="card-kicker">{item.event_name || 'School life'}</span><h3>{item.title || item.event_name}</h3><p>{item.description || 'Moments from our school community.'}</p></div></article>
}
export function FilterBar({ search, setSearch, filters, setFilters, categories = [] }) {
 return <div className="filter-bar"><label className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" aria-label="Search"/></label><select value={filters.year || ''} onChange={e=>setFilters({...filters,year:e.target.value})}><option value="">All years</option>{Array.from({length:8},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y}>{y}</option>)}</select><select value={filters.month || ''} onChange={e=>setFilters({...filters,month:e.target.value})}><option value="">All months</option>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(2000,i).toLocaleString('en',{month:'long'})}</option>)}</select>{categories.length>0&&<select value={filters.category||''} onChange={e=>setFilters({...filters,category:e.target.value})}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select>}</div>
}
export const icons = { Bell, BookOpen, CalendarDays, FileText, Image, MapPin, Play, ShieldCheck }
