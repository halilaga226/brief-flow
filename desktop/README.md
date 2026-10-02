# Atlı Karakaya · Masaüstü Yedek Ajanı

Evet — bu **gerçek bir masaüstü programı**. Kurulum / açılıştan sonra masaüstünde
veya Başlat menüsünde **«Atlı Karakaya Yedek»** ikonu (kalkan amblemi) ile erişirsiniz.

## Windows’a kurulum

### Yol 1 — Kurulum dosyası (Setup.exe)

Windows bilgisayarda bir kez paket üretin:

```bash
cd desktop
npm install
npm run dist
```

`desktop/release/` içinde **Setup.exe** oluşur. Çift tıklayıp kurun:
- Masaüstü kısayolu otomatik gelir
- Başlat menüsüne de eklenir

Sonra masaüstündeki **Atlı Karakaya Yedek** ikonuna çift tıklamanız yeterli.

### Yol 2 — Taşınabilir klasör (Portable)

1. `release/win-unpacked` klasörünü (veya Portable zip’i) ofis PC’ye kopyalayın  
2. İçindeki **`Atli Karakaya Yedek Ajani.exe`** dosyasına sağ tıklayın  
3. **Gönder → Masaüstü (kısayol oluştur)**  
4. Bundan sonra masaüstü ikonundan açın  

### Yol 3 — Geliştirici (Node)

```bash
cd desktop
npm install
npm start
```

Aynı pencereli uygulama açılır; kalıcı ikon için Yol 1 veya 2’yi kullanın.

## İlk açılış ayarları

1. **Portal adresi** — canlı site URL’niz  
2. **Ajan anahtarı** — Vercel `BACKUP_AGENT_TOKEN`  
3. **Ayarları kaydet** → **Şimdi yedekle**  

Yedekler varsayılan olarak **Belgeler → Atli-Karakaya-Yedekler** klasörüne yazılır.
Pencereyi kapatınca sistem tepsisinde çalışmaya devam eder.

## Site tarafı (bir kez)

Vercel → Environment Variables → `BACKUP_AGENT_TOKEN` ekleyin → Redeploy.

## Not

Siteden «Yedek al ve indir» yeterliyse bu uygulamayı kurmak **zorunlu değil**.
Otomatik / arka planda diske yazmak istiyorsanız masaüstü programı kullanın.
