(() => {
  const cfg=window.LAVINA_CONFIG||{}, configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes("ضع_")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes("ضع_");
  const db=configured&&window.supabase?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const $=id=>document.getElementById(id);let items=[],currentImageUrl="";
  const money=n=>`${Number(n||0).toLocaleString("ar-EG")} ج.م`;
  function message(id,text,isError=true){$(id).textContent=text;$(id).style.color=isError?"#C25A66":"#168653"}
  function toast(t){$("adminToast").textContent=t;$("adminToast").classList.add("show");setTimeout(()=>$("adminToast").classList.remove("show"),2300)}
  function parseList(s){return s.split(",").map(x=>x.trim()).filter(Boolean)}
  function stars(r){const n=Math.max(0,Math.min(5,Math.round(Number(r||0))));return "★".repeat(n)+"☆".repeat(5-n)}
  function reset(){ $("productForm").reset();$("productId").value="";$("active").checked=true;$("rating").value=0;$("rating_count").value=0;currentImageUrl="";$("imagePreview").textContent="معاينة صورة المنتج";$("formTitle").textContent="إضافة منتج جديد";$("saveBtn").textContent="حفظ المنتج";$("formMessage").textContent=""}
  async function refresh(){
   const {data,error}=await db.from("products").select("*").order("created_at",{ascending:false});
   if(error){message("formMessage","تعذر قراءة المنتجات: "+error.message);return}
   items=data||[];$("totalProducts").textContent=items.length;$("activeProducts").textContent=items.filter(x=>x.active).length;
   const rated=items.filter(p=>Number(p.rating_count)>0),count=rated.reduce((a,p)=>a+Number(p.rating_count||0),0);
   const avg=count?rated.reduce((a,p)=>a+Number(p.rating||0)*Number(p.rating_count||0),0)/count:0;
   $("averageRating").textContent=avg?avg.toFixed(1):"0";renderList();
  }
  function renderList(){
   const q=$("adminSearch").value.toLowerCase();const filtered=items.filter(p=>p.name.toLowerCase().includes(q));
   $("adminProducts").innerHTML=filtered.length?filtered.map(p=>`<div class="admin-product"><img src="${p.image_url||""}" onerror="this.style.display='none'"><div class="admin-product-info"><b>${safe(p.name)}</b><small>${safe(p.category)} · ${money(p.sale_price||p.price)} · ${p.active?"منشور":"مخفي"}</small><small class="admin-rating">${stars(p.rating)} ${Number(p.rating||0).toFixed(1)} (${Number(p.rating_count||0)})</small></div><div class="admin-product-actions"><button data-edit="${p.id}">تعديل</button><button class="delete" data-delete="${p.id}">حذف</button></div></div>`).join(""):"<div class='empty-list'>لا توجد منتجات حتى الآن.</div>";
  }
  function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function edit(id){const p=items.find(x=>String(x.id)===String(id));if(!p)return;
   $("productId").value=p.id;$("name").value=p.name;$("category").value=p.category;$("price").value=p.price;$("sale_price").value=p.sale_price??"";$("sizes").value=(p.sizes||[]).join(", ");$("colors").value=(p.colors||[]).join(", ");$("rating").value=p.rating??0;$("rating_count").value=p.rating_count??0;$("description").value=p.description||"";$("active").checked=p.active;currentImageUrl=p.image_url||"";
   $("imagePreview").innerHTML=currentImageUrl?`<img src="${safe(currentImageUrl)}" alt="معاينة">`:"لا توجد صورة";$("formTitle").textContent="تعديل المنتج";$("saveBtn").textContent="حفظ التعديلات";window.scrollTo({top:0,behavior:"smooth"});
  }
  async function upload(file){
   if(!file)return currentImageUrl;
   if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("صيغة الصورة يجب أن تكون JPG أو PNG أو WEBP");
   if(file.size>5*1024*1024)throw new Error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
   const ext=file.name.split(".").pop().toLowerCase(),path=`${Date.now()}-${crypto.randomUUID()}.${ext}`;
   const {error}=await db.storage.from("product-images").upload(path,file,{upsert:false,contentType:file.type});
   if(error)throw error;
   const {data}=db.storage.from("product-images").getPublicUrl(path);return data.publicUrl;
  }
  $("image").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);$("imagePreview").innerHTML=`<img src="${url}" alt="معاينة الصورة">`});
  $("productForm").addEventListener("submit",async e=>{
   e.preventDefault();const btn=$("saveBtn");btn.disabled=true;btn.textContent="جارٍ الحفظ...";
   try{
    const image_url=await upload($("image").files[0]);
    const rating=Math.max(0,Math.min(5,Number($("rating").value)||0));
    const rating_count=Math.max(0,Number($("rating_count").value)||0);
    const payload={name:$("name").value.trim(),category:$("category").value,price:Number($("price").value),sale_price:$("sale_price").value?Number($("sale_price").value):null,sizes:parseList($("sizes").value),colors:parseList($("colors").value),rating,rating_count,description:$("description").value.trim(),image_url,active:$("active").checked};
    if(payload.sale_price!==null&&payload.sale_price>payload.price)throw new Error("سعر الخصم يجب ألا يكون أكبر من السعر الأصلي");
    if(rating_count>0&&rating===0)throw new Error("أدخلي درجة التقييم عندما يكون عدد التقييمات أكبر من صفر");
    const id=$("productId").value;const result=id?await db.from("products").update(payload).eq("id",id):await db.from("products").insert(payload);
    if(result.error)throw result.error;message("formMessage","تم حفظ المنتج بنجاح.",false);reset();await refresh();toast("تم حفظ المنتج");
   }catch(err){message("formMessage","حدث خطأ: "+err.message)}finally{btn.disabled=false;btn.textContent=$("productId").value?"حفظ التعديلات":"حفظ المنتج"}
  });
  $("adminProducts").addEventListener("click",async e=>{
   const editBtn=e.target.closest("[data-edit]");if(editBtn)return edit(editBtn.dataset.edit);
   const del=e.target.closest("[data-delete]");if(del){const p=items.find(x=>String(x.id)===del.dataset.delete);if(!p||!confirm(`هل تريد حذف المنتج «${p.name}»؟`))return;const {error}=await db.from("products").delete().eq("id",p.id);if(error)return toast("تعذر الحذف: "+error.message);await refresh();toast("تم حذف المنتج")}
  });
  $("adminSearch").addEventListener("input",renderList);$("resetBtn").onclick=reset;
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!db)return message("loginMessage","أكملي إعدادات Supabase في config.js أولًا");const {error}=await db.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error)return message("loginMessage","تعذر تسجيل الدخول. راجعي البريد وكلمة المرور.");await showDashboard()});
  async function showDashboard(){const {data:{session}}=await db.auth.getSession();const ok=!!session;$("loginPanel").hidden=ok;$("dashboard").hidden=!ok;if(ok)await refresh()}
  $("logoutBtn").onclick=async()=>{await db.auth.signOut();$("dashboard").hidden=true;$("loginPanel").hidden=false;reset()};
  if(!configured){message("loginMessage","أضيفي رابط Supabase ومفتاح anon في config.js ثم أعيدي تحميل الصفحة")}else{db.auth.onAuthStateChange(()=>showDashboard());showDashboard()}
})();
