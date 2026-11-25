import { useEffect,useMemo,useState } from 'react'
import { Bell } from 'lucide-react'
import { EmptyState, FilterBar, LoadingState, NoticeCard } from '../components/common.jsx'
import { listContent } from '../lib/content.js'
const cats=['General Notice','Examination','Admission','Holidays','Government Orders','School Events','Academic Activities']
export function Updates(){const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[filters,setFilters]=useState({year:'',month:'',category:''})
 useEffect(()=>{listContent('important_updates').then(setItems).catch(()=>{}).finally(()=>setLoading(false))},[])
 const filtered=useMemo(()=>items.filter(x=>(!search||`${x.title} ${x.description} ${x.category}`.toLowerCase().includes(search.toLowerCase()))&&(!filters.year||String(new Date(x.published_at||x.created_at).getFullYear())===filters.year)&&(!filters.month||String(new Date(x.published_at||x.created_at).getMonth()+1)===filters.month)&&(!filters.category||x.category===filters.category)),[items,search,filters])
 return <main className="page-main"><div className="wrap"><div className="page-heading"><p className="eyebrow">SCHOOL NOTICE BOARD</p><h1>Important updates</h1><p>Current notices, announcements and information for our school community.</p></div><FilterBar search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} categories={cats}/>{loading?<LoadingState/>:filtered.length?<div className="updates-list">{filtered.map(x=><NoticeCard key={x.id} item={x}/>)}</div>:<EmptyState icon={Bell} title="No matching updates" text="Try a different search or check back soon."/>}</div></main>
}
