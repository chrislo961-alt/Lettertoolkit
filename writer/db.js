window.WriterDB=(()=>{
  const DB='lettertoolkit-writer-v2', VERSION=1, DOCS='documents', VERSIONS='versions';
  const open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(DOCS))db.createObjectStore(DOCS,{keyPath:'id'});if(!db.objectStoreNames.contains(VERSIONS)){const s=db.createObjectStore(VERSIONS,{keyPath:'id',autoIncrement:true});s.createIndex('documentId','documentId')}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  async function store(name,mode='readonly'){const db=await open();return db.transaction(name,mode).objectStore(name)}
  async function putDocument(doc){const s=await store(DOCS,'readwrite');await request(s.put(doc));return doc}
  async function getDocument(id){return request((await store(DOCS)).get(id))}
  async function listDocuments(){const docs=await request((await store(DOCS)).getAll());return docs.sort((a,b)=>b.updated-a.updated)}
  async function deleteDocument(id){const db=await open(),tx=db.transaction([DOCS,VERSIONS],'readwrite');tx.objectStore(DOCS).delete(id);const index=tx.objectStore(VERSIONS).index('documentId');const keys=await request(index.getAllKeys(id));keys.forEach(k=>tx.objectStore(VERSIONS).delete(k));return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
  async function addVersion(doc){const s=await store(VERSIONS,'readwrite');return request(s.add({documentId:doc.id,title:doc.title,html:doc.html,created:Date.now()}))}
  async function versions(id){const all=await request((await store(VERSIONS)).index('documentId').getAll(id));return all.sort((a,b)=>b.created-a.created).slice(0,20)}
  async function pruneVersions(id,keep=20){const all=await versions(id);const db=await open(),tx=db.transaction(VERSIONS,'readwrite');all.slice(keep).forEach(v=>tx.objectStore(VERSIONS).delete(v.id))}
  return {putDocument,getDocument,listDocuments,deleteDocument,addVersion,versions,pruneVersions};
})();
