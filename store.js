(() => {
  const cfg = window.LAVINA_CONFIG || {};
  const isStub = v => !v || /ضع_|SUPABASE_URL|SUPABASE_ANON_KEY/.test(String(v));
  const hasConfig = !isStub(cfg.SUPABASE_URL) && !isStub(cfg.SUPABASE_ANON_KEY);
  const db = hasConfig && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const money = n => `${Number(n || 0).toLocaleString("ar-EG")} ${cfg.CURRENCY || "ج.م"}`;
  const $ = id => document.getElementById(id);
  let products = [], selectedCategory = "الكل", search = "", sortBy = "default";
  let cart = JSON.parse(localStorage.getItem("lavina_cart") || "[]");
  const demo = [
    {id:"demo1",name:"فستان أنيق بتصميم ناعم",category:"فساتين",price:850,sale_price:720,sizes:["S","M","L","XL"],colors:["أسود","بيج"],rating:4.8,rating_count:24,description:"تصميم أنيق يناسب إطلالتك اليومية والمناسبات.",image_url:"",active:true},
    {id:"demo2",name:"بلوزة كلاسيكية",category:"بلوزات",price:420,sale_price:null,sizes:["M","L","XL"],colors:["أبيض","وردي"],rating:4.3,rating_count:11,description:"بلوزة بتفاصيل بسيطة ولمسة أنثوية.",image_url:"",active:true},
    {id:"demo3",name:"طقم كاجوال مريح",category:"أطقم",price:990,sale_price:890,sizes:["S","M","L"],colors:["رمادي","أسود"],rating:4.6,rating_count:18,description:"طقم عملي وأنيق للاستخدام اليومي.",image_url:"",active:true},
    {id:"demo4",name:"عباية بتفاصيل راقية",category:"عبايات",price:1150,sale_price:null,sizes:["M","L","XL","XXL"],colors:["أسود"],rating:4.9,rating_count:32,description:"عباية بتصميم راقٍ وقصة مريحة.",image_url:"",active:true},
    {id:"demo5",name:"فستان صيفي مزهر",category:"فساتين",price:760,sale_price:650,sizes:["S","M","L"],colors:["أبيض","أزرق"],rating:4.5,rating_count:9,description:"فستان خفيف بطبعة مزهرة لإطلالة صيفية مشرقة.",image_url:"",active:true},
    {id:"demo6",name:"بنطال واسع أنيق",category:"بناطيل",price:540,sale_price:null,sizes:["S","M","L","XL"],colors:["بيج","أسود"],rating:4.2,rating_count:7,description:"بنطال واسع بقصة مريحة يناسب مختلف الإطلالات.",image_url:"",active:true},
    {id:"demo7",name:"طقم شتوي محاك",category:"أطقم",price:1350,sale_price:1200,sizes:["M","L","XL"],colors:["رمادي","بيج"],rating:4.7,rating_count:15,description:"طقم دافئ مناسب لأيام الشتاء بتفاصيل أنيقة.",image_url:"",active:true},
    {id:"demo8",name:"حقيبة يد صغيرة",category:"إكسسوارات",price:390,sale_price:340,sizes:[],colors:["وردي","بيج","أسود"],rating:4.4,rating_count:21,description:"حقيبة يد عملية بحجم مناسب لكل يوم.",image_url:"",active:true}
  ];
  function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
  function saveCart(){localStorage.setItem("lavina_cart",JSON.stringify(cart));$("cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0)}
  function price(p){return p.sale_price && Number(p.sale_price)<Number(p.price)?p.sale_price:p.price}
  function stars(r){const n=Math.max(0,Math.min(5,Math.round(Number(r||0))));return `<span class="stars" aria-label="التقييم ${Number(r||0).toFixed(1)} من 5">${"★".repeat(n)}${"☆".repeat(5-n)}</span>`}
  function ratingLine(p){return `<div class="rating-row">${stars(p.rating)}<span class="rating-count">${Number(p.rating||0).toFixed(1)} (${Number(p.rating_count||0)})</span></div>`}
  function visibleProducts(){
    let list=products.filter(p=>(p.active!==false)&& (selectedCategory==="الكل"||p.category===selectedCategory) && (`${p.name} ${p.category} ${p.description||""}`).toLowerCase().includes(search.toLowerCase()));
    if(sortBy==="rating")list=[...list].sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)||(Number(b.rating_count)||0)-(Number(a.rating_count)||0));
    if(sortBy==="price-asc")list=[...list].sort((a,b)=>price(a)-price(b));
    if(sortBy==="price-desc")list=[...list].sort((a,b)=>price(b)-price(a));
    return list;
  }
  function render(){
    const list=visibleProducts(); $("productCount").textContent=`${list.length} منتج`;
    $("statusMessage").textContent=list.length?"": "لا توجد منتجات مطابقة لبحثك حاليًا.";
    $("productGrid").innerHTML=list.map(p=>`<article class="product-card">
      <div class="product-image" data-details="${p.id}">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="image-placeholder">✿</div>`}
      ${p.sale_price&&Number(p.sale_price)<Number(p.price)?`<span class="discount">خصم</span>`:""}</div>
      <div class="product-info"><span class="product-category">${esc(p.category||"ملابس")}</span><div class="product-name">${esc(p.name)}</div>
      ${ratingLine(p)}
      <div class="price-row"><span class="price">${money(price(p))}</span>${p.sale_price&&Number(p.sale_price)<Number(p.price)?`<span class="old-price">${money(p.price)}</span>`:""}</div>
      <div class="card-actions"><button data-details="${p.id}">التفاصيل</button><button data-add="${p.id}">أضيفي للسلة +</button></div></div></article>`).join("");
  }
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  async function load(){
    $("year").textContent=new Date().getFullYear();
    $("followWhatsapp").href=whatsappUrl("مرحبًا، أود الاستفسار عن منتجات لافينا.");
    if(!db){products=demo;render();$("statusMessage").textContent="هذه معاينة تجريبية بمنتجات توضيحية. اربطي Supabase لعرض منتجاتك الفعلية.";return}
    const {data,error}=await db.from("products").select("*").eq("active",true).order("created_at",{ascending:false});
    if(error){products=demo;render();$("statusMessage").textContent="تعذر تحميل المنتجات من قاعدة البيانات. راجعي إعدادات Supabase والاتصال.";console.error(error);return}
    products=data||[];render();
  }
  function openDetails(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;
    $("productDetails").innerHTML=`<div class="product-detail-layout"><div>${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}">`:`<div class="image-placeholder">✿</div>`}</div><div><span class="eyebrow">${esc(p.category||"لافينا")}</span><h2>${esc(p.name)}</h2>${ratingLine(p)}<div class="price-row"><b class="price">${money(price(p))}</b>${p.sale_price&&Number(p.sale_price)<Number(p.price)?`<span class="old-price">${money(p.price)}</span>`:""}</div><p>${esc(p.description||"اختاري المقاس واللون المناسبين لكِ.")}</p><label class="field-label">المقاس</label><select id="detailSize" class="select-field"><option value="">اختاري المقاس</option>${(p.sizes||[]).map(s=>`<option>${esc(s)}</option>`).join("")}</select><label class="field-label">اللون</label><select id="detailColor" class="select-field"><option value="">اختاري اللون</option>${(p.colors||[]).map(c=>`<option>${esc(c)}</option>`).join("")}</select><label class="field-label">الكمية</label><input id="detailQty" class="qty-input" type="number" min="1" value="1"><button class="primary-btn full" id="detailAdd" style="margin-top:15px">أضيفي إلى السلة</button></div></div>`;
    $("detailAdd").onclick=()=>{const size=$("detailSize").value,color=$("detailColor").value,qty=Math.max(1,Number($("detailQty").value)||1);if((p.sizes||[]).length&&!size)return toast("اختاري المقاس أولًا");if((p.colors||[]).length&&!color)return toast("اختاري اللون أولًا");addToCart(p,size,color,qty);$("productModal").classList.remove("show")};
    $("productModal").classList.add("show");
  }
  function addToCart(p,size="",color="",qty=1){const key=[p.id,size,color].join("|");const old=cart.find(x=>x.key===key);if(old)old.qty+=qty;else cart.push({key,id:p.id,name:p.name,price:price(p),image_url:p.image_url||"",size,color,qty});saveCart();toast("تمت إضافة المنتج إلى السلة")}
  function renderCart(){
    $("cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-line"><img src="${esc(x.image_url||"")}" onerror="this.style.display='none'"><div class="cart-line-info"><b>${esc(x.name)}</b><small>${esc(x.size)} ${x.color?" · "+esc(x.color):""} · الكمية: ${x.qty}</small><small>${money(x.price*x.qty)}</small></div><button class="remove-item" data-remove="${esc(x.key)}">حذف</button></div>`).join(""):"<p class='status-message'>سلتكِ فارغة حاليًا.</p>";
    $("cartTotal").textContent=money(cart.reduce((a,x)=>a+x.price*x.qty,0));
  }
  function whatsappUrl(message){const number=(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"");return `https://wa.me/${number}?text=${encodeURIComponent(message)}`}
  document.addEventListener("click",e=>{
    const detail=e.target.closest("[data-details]");if(detail)openDetails(detail.dataset.details);
    const add=e.target.closest("[data-add]");if(add){const p=products.find(x=>String(x.id)===add.dataset.add);if(p){if((p.sizes||[]).length||(p.colors||[]).length)openDetails(p.id);else addToCart(p)}}
    const remove=e.target.closest("[data-remove]");if(remove){cart=cart.filter(x=>x.key!==remove.dataset.remove);saveCart();renderCart()}
    const close=e.target.closest("[data-close]");if(close)$(close.dataset.close).classList.remove("show");
  });
  $("cartOpen").onclick=()=>{renderCart();$("cartModal").classList.add("show")};
  $("checkoutBtn").onclick=()=>{if(!cart.length)return toast("السلة فارغة");const lines=cart.map((x,i)=>`${i+1}- ${x.name} | المقاس: ${x.size||"غير محدد"} | اللون: ${x.color||"غير محدد"} | الكمية: ${x.qty} | ${money(x.price*x.qty)}`);const total=cart.reduce((a,x)=>a+x.price*x.qty,0);const msg=`مرحبًا، أريد تأكيد طلب من متجر لافينا:\n${lines.join("\n")}\nالإجمالي: ${money(total)}\nالاسم:\nالعنوان:\n`;const number=(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"");if(!number)return toast("أضيفي رقم واتساب الصحيح في ملف config.js أولًا");window.open(whatsappUrl(msg),"_blank");};
  $("searchInput").addEventListener("input",e=>{search=e.target.value;render()});
  $("searchBtn").onclick=()=>{$("products").scrollIntoView({behavior:"smooth"})};
  $("sortSelect").addEventListener("change",e=>{sortBy=e.target.value;render()});
  $("categoryNav").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;selectedCategory=b.dataset.category;document.querySelectorAll(".category").forEach(x=>x.classList.toggle("active",x===b));render()});
  $("followWhatsapp").addEventListener("click",e=>{const number=(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"");if(!number){e.preventDefault();toast("أضيفي رقم واتساب الصحيح في config.js أولًا")}});
  saveCart();load();
})();
