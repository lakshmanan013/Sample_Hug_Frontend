import { useEffect, useMemo, useState } from 'react'
import { petApi } from './api'

const emptyOwner = { name:'', email:'', address:'', phone:'' }
const emptyPet = { name:'', breed:'', age:0, ownerId:'' }
const emptyAppointment = { appointmentDate:'', appointmentType:'', status:'SCHEDULED', petId:'' }

function Modal({title, children, onClose}) {
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal" onMouseDown={e=>e.stopPropagation()}>
      <h2>{title}</h2>{children}
    </div>
  </div>
}

function OwnerForm({item,onClose,onSaved}) {
  const [form,setForm]=useState(item || emptyOwner); const [error,setError]=useState('')
  const edit=!!item
  const save=async e=>{e.preventDefault();setError('');try{
    const body={...form,phone:form.phone===''?null:Number(form.phone)}
    const data=edit?await petApi.owners.update(item.ownerId,body):await petApi.owners.create(body)
    onSaved(data)
  }catch(err){setError(err.message)}}
  return <Modal title={edit?'Edit Owner':'Add Owner'} onClose={onClose}>
    {error&&<div className="alert">{error}</div>}
    <form onSubmit={save}><div className="form-grid">
      <Field label="Name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Email"><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
      <Field label="Phone"><input required type="number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field>
      <Field label="Address" full><input required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></Field>
    </div><ModalActions onClose={onClose}/></form>
  </Modal>
}

function PetForm({item,owners,onClose,onSaved}) {
  const [form,setForm]=useState(item?{name:item.name,breed:item.breed,age:item.age,ownerId:item.owner?.ownerId??''}:emptyPet); const [error,setError]=useState('')
  const edit=!!item
  const save=async e=>{e.preventDefault();setError('');try{
    const body={name:form.name,breed:form.breed,age:Number(form.age)}
    const data=edit?await petApi.pets.update(item.petId,form.ownerId,body):await petApi.pets.create(form.ownerId,body)
    onSaved(data)
  }catch(err){setError(err.message)}}
  return <Modal title={edit?'Edit Pet':'Add Pet'} onClose={onClose}>
    {error&&<div className="alert">{error}</div>}
    <form onSubmit={save}><div className="form-grid">
      <Field label="Name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Breed"><input required value={form.breed} onChange={e=>setForm({...form,breed:e.target.value})}/></Field>
      <Field label="Age"><input required min="0" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})}/></Field>
      <Field label="Owner"><select required value={form.ownerId} onChange={e=>setForm({...form,ownerId:e.target.value})}><option value="">Select owner</option>{owners.map(o=><option key={o.ownerId} value={o.ownerId}>{o.name} (#{o.ownerId})</option>)}</select></Field>
    </div><ModalActions onClose={onClose}/></form>
  </Modal>
}

function AppointmentForm({item,pets,onClose,onSaved}) {
  const [form,setForm]=useState(item?{appointmentDate:item.appointmentDate,appointmentType:item.appointmentType,status:item.status,petId:item.pet?.petId??''}:emptyAppointment); const [error,setError]=useState('')
  const edit=!!item
  const save=async e=>{e.preventDefault();setError('');try{
    const body={appointmentDate:form.appointmentDate,appointmentType:form.appointmentType,status:form.status}
    const data=edit?await petApi.appointments.update(item.appointmentId,form.petId,body):await petApi.appointments.create(form.petId,body)
    onSaved(data)
  }catch(err){setError(err.message)}}
  return <Modal title={edit?'Edit Appointment':'Add Appointment'} onClose={onClose}>
    {error&&<div className="alert">{error}</div>}
    <form onSubmit={save}><div className="form-grid">
      <Field label="Pet"><select required value={form.petId} onChange={e=>setForm({...form,petId:e.target.value})}><option value="">Select pet</option>{pets.map(p=><option key={p.petId} value={p.petId}>{p.name} (#{p.petId})</option>)}</select></Field>
      <Field label="Date"><input required type="date" value={form.appointmentDate||''} onChange={e=>setForm({...form,appointmentDate:e.target.value})}/></Field>
      <Field label="Type"><input required value={form.appointmentType} onChange={e=>setForm({...form,appointmentType:e.target.value})}/></Field>
      <Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>SCHEDULED</option><option>COMPLETED</option><option>CANCELLED</option></select></Field>
    </div><ModalActions onClose={onClose}/></form>
  </Modal>
}

function Field({label,children,full=false}){return <div className={`field ${full?'full':''}`}><label>{label}</label>{children}</div>}
function ModalActions({onClose}){return <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary">Save</button></div>}

function App(){
  const [page,setPage]=useState('Dashboard'),[owners,setOwners]=useState([]),[pets,setPets]=useState([]),[appointments,setAppointments]=useState([])
const [modal,setModal]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState(''),[search,setSearch]=useState(''),[menu,setMenu]=useState(false)

  const load=async()=>{try{setError('');const [o,p,a]=await Promise.all([petApi.owners.all(),petApi.pets.all(),petApi.appointments.all()]);setOwners(o);setPets(p);setAppointments(a)}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[])
  const filtered=(arr,keys)=>arr.filter(x=>keys.some(k=>String(x?.[k]??'').toLowerCase().includes(search.toLowerCase())))
  const ownersF=useMemo(()=>filtered(owners,['name','email','address']),[owners,search])
  const petsF=useMemo(()=>filtered(pets,['name','breed']),[pets,search])
  const appsF=useMemo(()=>appointments.filter(a=>`${a.appointmentType} ${a.status} ${a.pet?.name||''}`.toLowerCase().includes(search.toLowerCase())),[appointments,search])

  const saved=async()=>{
    setModal(null)
    await load()
    setSuccess('Record added successfully!')
    setTimeout(() => setSuccess(''), 3000)
}
  const remove=async(type,id)=>{if(!confirm('Delete this record?'))return;try{if(type==='owner')await petApi.owners.remove(id);if(type==='pet')await petApi.pets.remove(id);if(type==='appointment')await petApi.appointments.remove(id);await load()}catch(e){setError(e.message)}}

  return <div className="app">
    <aside className={`sidebar ${menu?'open':''}`}><div className="brand">Zenve<span>Pet Healthcare</span></div><nav className="nav">
      {['Dashboard','Owners','Pets','Appointments'].map(x=><button key={x} className={page===x?'active':''} onClick={()=>{setPage(x);setMenu(false)}}>{x}</button>)}
    </nav></aside>
    <main className="main">
    <div className="topbar"><div><button className="btn btn-secondary mobile-menu" onClick={()=>setMenu(!menu)}>☰</button><h1 className="title">{page}</h1><p className="subtitle">Owner, pet and appointment management</p></div>   {page !== 'Dashboard' && (
    <button type="button" className="btn btn-primary" onClick={() => { console.log("Add button clicked:", page);if (page === 'Pets') {setModal({ type: 'pet' })} else if (page === 'Owners') {setModal({ type: 'owner' });} else if (page === 'Appointments') {setModal({ type: 'appointment' });}}}>
    + Add {page === 'Appointments' ? 'appointment' : page.slice(0, -1)} </button>)}</div>
    
      {error&&<div className="alert">{error}</div>}
      {success&&<div className="success">{success}</div>}
      {page==='Dashboard'&&<Dashboard owners={owners} pets={pets} appointments={appointments}/>}
      {page!=='Dashboard'&&<><div className="toolbar"><input className="search" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        {page==='Owners'&&<OwnerTable data={ownersF} onEdit={x=>setModal({type:'owner',item:x})} onDelete={x=>remove('owner',x)}/>}
        {page==='Pets'&&<PetTable data={petsF} onEdit={x=>setModal({type:'pet',item:x})} onDelete={x=>remove('pet',x)}/>}
        {page==='Appointments'&&<AppointmentTable data={appsF} onEdit={x=>setModal({type:'appointment',item:x})} onDelete={x=>remove('appointment',x)}/>}
      </>}
    </main>
    {modal?.type==='owner'&&<OwnerForm item={modal.item} onClose={()=>setModal(null)} onSaved={saved}/>}
    {modal?.type==='pet'&&<PetForm item={modal.item} owners={owners} onClose={()=>setModal(null)} onSaved={saved}/>}
    {modal?.type==='appointment'&&<AppointmentForm item={modal.item} pets={pets} onClose={()=>setModal(null)} onSaved={saved}/>}
  </div>
}

function Dashboard({owners,pets,appointments}){return <div className="grid">
  <div className="card"><div>Owners</div><div className="stat">{owners.length}</div></div>
  <div className="card"><div>Pets</div><div className="stat">{pets.length}</div></div>
  <div className="card"><div>Appointments</div><div className="stat">{appointments.length}</div></div>
</div>}

function OwnerTable({data,onEdit,onDelete}){return <Table headers={['ID','Name','Email','Phone','Address','Actions']} rows={data.map(o=>[o.ownerId,o.name,o.email,o.phone,o.address,<Actions edit={()=>onEdit(o)} del={()=>onDelete(o.ownerId)}/>])}/>}
function PetTable({data,onEdit,onDelete}){return <Table headers={['ID','Name','Breed','Age','Owner','Actions']} rows={data.map(p=>[p.petId,p.name,p.breed,p.age,p.owner?.name||`Owner #${p.owner?.ownerId??'-'}`,<Actions edit={()=>onEdit(p)} del={()=>onDelete(p.petId)}/>])}/>}
function AppointmentTable({data,onEdit,onDelete}){return <Table headers={['ID','Pet','Date','Type','Status','Actions']} rows={data.map(a=>[a.appointmentId,a.pet?.name||`Pet #${a.pet?.petId??'-'}`,a.appointmentDate,a.appointmentType,<span className="badge">{a.status}</span>,<Actions edit={()=>onEdit(a)} del={()=>onDelete(a.appointmentId)}/>])}/>}
function Actions({edit,del}){return <div className="actions"><button className="btn btn-secondary" onClick={edit}>Edit</button><button className="btn btn-danger" onClick={del}>Delete</button></div>}
function Table({headers,rows}){if(!rows.length)return <div className="card empty">No records found.</div>;return <div className="table-wrap"><table className="table"><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}

export default App
