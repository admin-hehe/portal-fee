const WEB_APP_URL = "/api"; 
    const form = document.getElementById('dataForm');
    const submitBtn = document.getElementById('submitBtn');
    let lastSubmittedData = {}; 
    let masterVendors = [];
    let isAutoFilled = false;

    function showModal(id) { document.getElementById(id).classList.add('open'); }
    function hideModal(id) { document.getElementById(id).classList.remove('open'); }

    function copyFullData() {
        const d = lastSubmittedData;
        const btn = document.getElementById('mainCopyBtn');
        const btnText = document.getElementById('copyBtnText');
        const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
        
        let estimasiSelesai = "";
        if (d.advanced_task === "on" && d.tanggal_task) {
            estimasiSelesai = `\nEstimasi Selesai: ${d.tanggal_task}`;
        }

        const text = `*DETAIL PENGAJUAN FEE*\n` +
                     `ID: ${d.id}\n` +
                     `Vendor: ${d.nama_vendor}\n` +
                     `Email: ${d.email_vendor}\n` +
                     `Telp: ${d.telp_vendor}\n` +
                     `PIC: ${d.pic}\n` +
                     `Kegiatan: ${d.nama_kegiatan}\n` +
                     `Brand: ${d.brand}\n` +
                     `Budget: ${d.kode}\n` +
                     `Total: ${fmt.format(d.harga)}` + 
                     estimasiSelesai;

        navigator.clipboard.writeText(text).then(() => {
            btn.classList.replace('bg-brand-600/10', 'bg-emerald-500');
            btn.classList.replace('text-brand-600', 'text-white');
            btnText.textContent = "Tersalin! Kirim ke grup ya!";
            btn.querySelector('i').setAttribute('data-lucide', 'check');
            lucide.createIcons();

            setTimeout(() => {
                btn.classList.replace('bg-emerald-500', 'bg-brand-600/10');
                btn.classList.replace('text-white', 'text-brand-600');
                btnText.textContent = "Salin Rekap Data (KLIK INI!)";
                btn.querySelector('i').setAttribute('data-lucide', 'copy');
                lucide.createIcons();
            }, 2500);
        });
    }
    
function sendToWhatsApp() {
    const d = lastSubmittedData;
    const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const text = `*DETAIL PENGAJUAN FEE*\n\n` +
                 `*ID:* ${d.id}\n` +
                 `*Vendor:* ${d.nama_vendor}\n` +
                 `*Brand:* ${d.brand}\n` +
                 `*Total:* ${fmt.format(d.harga)}\n` +
                 `*PIC:* ${d.pic}\n` +
                 `*Kegiatan:* ${d.nama_kegiatan}\n` +
                 `*Budget:* ${d.kode}\n` +
                 (d.advanced_task === "on" ? `*Advanced:* YES\n*Est. Selesai:* ${d.tanggal_task}` : `*Advanced:* NO`);

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
}

    document.getElementById('harga').addEventListener('keyup', function(e) {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val) e.target.value = new Intl.NumberFormat('id-ID').format(val);
    });

    document.getElementById('advanced_task').addEventListener('change', function() {
        document.getElementById('advancedFields').classList.toggle('show', this.checked);
        document.getElementById('tanggal_task').required = this.checked;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.getElementById('btnText').textContent = 'Mengirim...';
        document.getElementById('btnSpinner').classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.advanced_task = document.getElementById('advanced_task').checked ? "on" : "off";
        data.action = 'saveMainData';
        data.harga = data.harga.replace(/\./g, '');

        try {
            const res = await fetch(WEB_APP_URL, { method: 'POST', body: new URLSearchParams(data) });
            const resJ = await res.json();
            if(resJ.result === 'success') {
                lastSubmittedData = { ...data, id: resJ.id }; 
                document.getElementById('generatedId').textContent = resJ.id;
                showModal('successModal');
            }
        } catch (err) { alert('Gagal mengirim data.'); }
        finally {
            document.getElementById('btnText').textContent = 'Kirim Pengajuan';
            document.getElementById('btnSpinner').classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    if(!WEB_APP_URL) return;

    const vendorInput = document.getElementById('nama_vendor');
    const brandSelect = document.getElementById('brand');
    const vendorLoader = document.getElementById('vendorLoader');
    const brandLoader = document.getElementById('brandLoader');

    vendorInput.classList.add('loading-skeleton');
    brandSelect.classList.add('loading-skeleton');
    vendorLoader.classList.remove('hidden');
    brandLoader.classList.remove('hidden');

    fetch(`${WEB_APP_URL}?action=getBrands`, { method: 'GET', redirect: 'follow' })
    .then(r => r.json())
    .then(res => {
        brandSelect.classList.remove('loading-skeleton');
        brandLoader.classList.add('hidden');
        if(res.result === 'success') {
            brandSelect.innerHTML = '<option value="" disabled selected>Pilih Brand</option>';
            res.brands.forEach(b => { 
                const o = document.createElement('option'); 
                o.value = b; o.textContent = b; brandSelect.appendChild(o); 
            });
        }
    }).catch(err => {
        brandSelect.classList.remove('loading-skeleton');
        brandLoader.classList.add('hidden');
    });

    fetch(`${WEB_APP_URL}?action=getVendorList`, { method: 'GET', redirect: 'follow' })
    .then(r => r.json())
    .then(res => {
        vendorInput.classList.remove('loading-skeleton');
        vendorLoader.classList.add('hidden');
        if(res.result === 'success') {
            masterVendors = res.vendors;
        }
    }).catch(err => {
        vendorInput.classList.remove('loading-skeleton');
        vendorLoader.classList.add('hidden');
    });

    const dropdown = document.getElementById('customDropdown');
    const vendorWarning = document.getElementById('vendorWarning');

vendorInput.addEventListener('input', function(e) {
    const val = this.value.trim().toLowerCase();
    
    if (!isAutoFilled) {
        document.getElementsByName('email_vendor')[0].value = '';
        document.getElementsByName('telp_vendor')[0].value = '';
    }
    
    isAutoFilled = false;

    dropdown.innerHTML = '';
    
    if (val.length > 0) {
        const filtered = masterVendors.filter(v => v.nama.toLowerCase().includes(val));
        
        if (filtered.length > 0) {
            dropdown.classList.remove('hidden');
            filtered.forEach(vendor => {
                const item = document.createElement('div');
                item.className = 'px-4 py-3 text-sm cursor-pointer hover:bg-brand-600/10 dark:hover:bg-brand-600/20 text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors';
                item.textContent = vendor.nama;
                
                item.onclick = () => {
                    isAutoFilled = true;
                    
                    vendorInput.value = vendor.nama;
                    document.getElementsByName('email_vendor')[0].value = vendor.email || '';
                    document.getElementsByName('telp_vendor')[0].value = vendor.telp || '';
                    
                    dropdown.classList.add('hidden');
                    vendorWarning.classList.add('hidden');
                };
                dropdown.appendChild(item);
            });
        } else {
            dropdown.classList.add('hidden');
        }

        const isExist = masterVendors.some(v => v.nama.toLowerCase() === val);
        vendorWarning.classList.toggle('hidden', isExist);
    } else {
        dropdown.classList.add('hidden');
        vendorWarning.classList.add('hidden');
    }
});

    document.addEventListener('click', (e) => {
        if (!vendorInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
});
