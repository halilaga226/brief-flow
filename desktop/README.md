# Atlı Karakaya · Masaüstü Uygulama

Web portalunun **aynısını masaüstünde** açan program + otomatik yedek.

Üst çubuk: **Yenile · Yedek al · Yedek klasörü · Ayarlar**  
Altında: canlı site (görevler, müvekkiller, ayarlar…)

## İndirme (Windows)

1. **[Atlı Karakaya Windows (zip)](https://github.com/halilaga226/brief-flow/releases/download/yedek-ajani-v1.1.1/Atli-Karakaya-Windows-Portable.zip)**  
   *(yeni sürüm yayınlandığında bu link güncellenir)*
2. Zip’i açın  
3. `Atli Karakaya.exe` → sağ tık → **Gönder → Masaüstü (kısayol)**  
4. İkona çift tıklayın  

### Microsoft engellerse (Smart App Control / SmartScreen)

Uygulama henüz **kod imzası** taşımıyor; Windows “tanınmayan uygulama” diye kesebilir. Bu sizin büro yazılımınız — şu adımlarla açılır:

**A) SmartScreen (“Windows bilgisayarınızı korudu”)**  
1. **Ek bilgi** / **More info**  
2. **Yine de çalıştır** / **Run anyway**

**B) Smart App Control (Windows 11 — “engellendi”, Run anyway yok)**  
1. **Ayarlar → Gizlilik ve güvenlik → Windows Güvenliği → Uygulama ve tarayıcı denetimi**  
2. **Akıllı Uygulama Denetimi** → **Kapalı**  
   *(veya geçici olarak Evaluation; Enforcement’da imzasız yeni uygulamalar kalıcı engellenebilir)*  
3. Bilgisayarı yeniden başlatıp `Atli Karakaya.exe`’yi tekrar açın  

**C) Dosya engelini kaldır (PowerShell)** — zip’i indirdiğiniz klasörde:

```powershell
Get-ChildItem -Recurse ".\win-unpacked" | Unblock-File
```

Kalıcı çözüm: ücretli bir **Code Signing** sertifikası ile `.exe` imzalamak (Smart App Control bunu kabul eder). İsterseniz bir sonraki adımda imzalama ayarını da ekleriz.  

## İlk ayar

Ayarlar panelinde:
- **Portal adresi** → canlı site URL’niz  
- **Ajan anahtarı** → Vercel `BACKUP_AGENT_TOKEN`  
- **Kaydet ve siteyi aç**  

Site pencerede açılır. **Yedek al** bilgisayara JSON yazar; otomatik yedek de çalışır.

## Geliştirici

```bash
cd desktop
npm install
npm start
npm run dist   # Windows paket
```

## Vercel

`BACKUP_AGENT_TOKEN` tanımlayın (yedek API için). Portal adresi normal site URL’nizdir.
