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
